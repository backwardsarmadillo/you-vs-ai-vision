import ast
import io
import json
import os
import random
import re
import sys
from typing import Any

import google.generativeai as genai
import matplotlib.pyplot as plt
import numpy as np
import soundfile as sf
import streamlit as st
from datasets import Audio, load_dataset


DEFAULT_DATASET = "MYJOKERML/mmau-test-mini-dataset"
DEFAULT_SPLIT = "train"
DEFAULT_MODEL = "gemini-2.0-flash"
ADAPTER_AUTO = "auto"
ADAPTER_MMAU = "mmau-mini"
ADAPTER_COTA = "audio-reasoner-cota"
ADAPTER_GENERIC = "generic"


def parse_choices(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value]
    if isinstance(value, dict):
        ordered = []
        for k in ["A", "B", "C", "D", "0", "1", "2", "3"]:
            if k in value:
                ordered.append(str(value[k]))
        if ordered:
            return ordered
        return [str(v) for _, v in sorted(value.items(), key=lambda t: str(t[0]))]
    if isinstance(value, str):
        text = value.strip()
        try:
            parsed = json.loads(text)
            return parse_choices(parsed)
        except Exception:
            pass
        try:
            parsed = ast.literal_eval(text)
            return parse_choices(parsed)
        except Exception:
            pass
        parts = [p.strip() for p in re.split(r"\n+| \|\| ", text) if p.strip()]
        return parts if len(parts) >= 2 else [text]
    return []


def parse_answer_index(sample: dict, choices: list[str]) -> int:
    if "correct_index" in sample and isinstance(sample["correct_index"], int):
        return sample["correct_index"]
    if "answer_label" in sample and isinstance(sample["answer_label"], int):
        return sample["answer_label"]

    # Common alternative formats: answer='A' or correct_answer='text'
    raw = sample.get("answer", sample.get("correct_answer", sample.get("label")))
    if isinstance(raw, int):
        return raw
    if isinstance(raw, str):
        token = raw.strip()
        if token.isdigit():
            return int(token)
        letter_map = {"A": 0, "B": 1, "C": 2, "D": 3}
        if token.upper() in letter_map:
            return letter_map[token.upper()]
        for i, c in enumerate(choices):
            if c.strip().lower() == token.lower():
                return i
    return -1


def normalize_audio(audio_obj: Any) -> tuple[np.ndarray, int] | None:
    if not isinstance(audio_obj, dict) or "array" not in audio_obj or "sampling_rate" not in audio_obj:
        return None
    audio_array = np.asarray(audio_obj["array"], dtype=np.float32)
    sr = int(audio_obj["sampling_rate"])
    if audio_array.ndim > 1:
        audio_array = np.mean(audio_array, axis=1)
    return audio_array, sr


def build_round(audio_obj: Any, question: Any, choices_value: Any, sample: dict) -> dict | None:
    normalized = normalize_audio(audio_obj)
    if normalized is None:
        return None
    if not isinstance(question, str) or not question.strip():
        return None
    choices = parse_choices(choices_value)
    if len(choices) != 4:
        return None
    correct_index = parse_answer_index(sample, choices)
    if correct_index < 0 or correct_index > 3:
        return None
    audio_array, sr = normalized
    return {
        "question": question.strip(),
        "choices": [str(c) for c in choices],
        "correct_index": int(correct_index),
        "audio_array": audio_array,
        "sampling_rate": sr,
    }


def adapter_mmau_mini(sample: dict) -> dict | None:
    return build_round(
        audio_obj=sample.get("audio"),
        question=sample.get("question"),
        choices_value=sample.get("choices", sample.get("options")),
        sample=sample,
    )


def adapter_audio_reasoner_cota(sample: dict) -> dict | None:
    return build_round(
        audio_obj=sample.get("audio"),
        question=sample.get("question", sample.get("prompt")),
        choices_value=sample.get("choices", sample.get("answer_choices", sample.get("options"))),
        sample=sample,
    )


def adapter_generic(sample: dict) -> dict | None:
    return build_round(
        audio_obj=sample.get("audio"),
        question=sample.get("question") or sample.get("prompt") or sample.get("user") or "",
        choices_value=sample.get("choices", sample.get("options", sample.get("answer_choices"))),
        sample=sample,
    )


def resolve_adapter(dataset_id: str, adapter_mode: str):
    if adapter_mode == ADAPTER_MMAU:
        return adapter_mmau_mini, ADAPTER_MMAU
    if adapter_mode == ADAPTER_COTA:
        return adapter_audio_reasoner_cota, ADAPTER_COTA
    if adapter_mode == ADAPTER_GENERIC:
        return adapter_generic, ADAPTER_GENERIC

    lowered = dataset_id.lower()
    if "mmau" in lowered:
        return adapter_mmau_mini, ADAPTER_MMAU
    if "cota" in lowered or "audio-reasoner" in lowered:
        return adapter_audio_reasoner_cota, ADAPTER_COTA
    return adapter_generic, ADAPTER_GENERIC


def load_round_pool(dataset_id: str, split: str, max_rows: int, adapter_mode: str, strict_mode: bool) -> tuple[list[dict], str]:
    ds = load_dataset(dataset_id, split=split)
    if "audio" not in ds.column_names:
        raise ValueError("Dataset must include an 'audio' column.")
    ds = ds.cast_column("audio", Audio())
    adapter_fn, resolved_name = resolve_adapter(dataset_id, adapter_mode)

    pool: list[dict] = []
    failed = 0
    first_error = None
    for i, sample in enumerate(ds):
        if i >= max_rows:
            break
        row = adapter_fn(sample)
        if row is not None:
            pool.append(row)
        else:
            failed += 1
            if first_error is None:
                first_error = f"Row {i} did not match adapter '{resolved_name}' schema."

    if strict_mode and failed > 0:
        raise ValueError(
            f"Strict mode: {failed} rows failed adapter '{resolved_name}'. "
            f"{first_error or ''}".strip()
        )
    return pool, resolved_name


def audio_bytes_wav(audio_array: np.ndarray, sampling_rate: int) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, audio_array, sampling_rate, format="WAV")
    return buf.getvalue()


def extract_ai_index(text: str) -> int:
    try:
        data = json.loads(text.strip())
        idx = int(data.get("choiceIndex"))
        return idx
    except Exception:
        m = re.search(r"\b([0-3])\b", text)
        if not m:
            return -1
        return int(m.group(1))


def gemini_answer_index(api_key: str, model_name: str, audio_wav: bytes, question: str, choices: list[str]) -> int:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    options_text = "\n".join(f"{i}: {c}" for i, c in enumerate(choices))
    prompt = (
        "You are an expert audio analyst.\n"
        "Listen to the provided audio and answer the multiple-choice question.\n"
        "Reply with ONLY one digit: 0, 1, 2, or 3.\n"
        f"Question: {question}\nChoices:\n{options_text}"
    )
    response = model.generate_content(
        [
            prompt,
            {"mime_type": "audio/wav", "data": audio_wav},
        ]
    )
    text = getattr(response, "text", "") or ""
    return extract_ai_index(text)


def init_state() -> None:
    if "pool" not in st.session_state:
        st.session_state.pool = []
    if "round" not in st.session_state:
        st.session_state.round = None
    if "selected" not in st.session_state:
        st.session_state.selected = None
    if "human_score" not in st.session_state:
        st.session_state.human_score = 0
    if "ai_score" not in st.session_state:
        st.session_state.ai_score = 0
    if "round_count" not in st.session_state:
        st.session_state.round_count = 0
    if "ai_idx" not in st.session_state:
        st.session_state.ai_idx = None
    if "resolved" not in st.session_state:
        st.session_state.resolved = False


def next_round() -> None:
    if not st.session_state.pool:
        return
    st.session_state.round = random.choice(st.session_state.pool)
    st.session_state.selected = None
    st.session_state.ai_idx = None
    st.session_state.resolved = False


def draw_waveform(audio_array: np.ndarray, sr: int) -> None:
    seconds = len(audio_array) / sr
    x = np.linspace(0, seconds, num=len(audio_array))
    fig, ax = plt.subplots(figsize=(10, 2.2))
    ax.plot(x, audio_array, linewidth=0.8)
    ax.set_title("Waveform")
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("Amplitude")
    ax.grid(alpha=0.2)
    st.pyplot(fig, clear_figure=True)


st.set_page_config(page_title="Audio Duel Benchmark", layout="wide")
st.title("Audio Duel: Human vs Gemini")
st.caption("Mystery audio benchmark with multiple-choice scoring.")
if sys.version_info >= (3, 14):
    st.warning(
        "Python 3.14 is currently incompatible with the Hugging Face datasets stack used here. "
        "Use Python 3.11 or 3.12 for this app."
    )

with st.sidebar:
    st.subheader("Config")
    dataset_id = st.text_input("HF dataset", value=DEFAULT_DATASET)
    split = st.text_input("Split", value=DEFAULT_SPLIT)
    max_rows = st.number_input("Load max rows", min_value=20, max_value=5000, value=300, step=20)
    adapter_mode = st.selectbox(
        "Dataset adapter",
        [ADAPTER_AUTO, ADAPTER_MMAU, ADAPTER_COTA, ADAPTER_GENERIC],
        index=0,
        help="Use strict dataset-specific schema mapping to avoid silent parsing bugs.",
    )
    strict_mode = st.checkbox("Strict schema mode", value=True)
    model_name = st.text_input("Gemini model", value=DEFAULT_MODEL)
    api_key = st.text_input("GEMINI_API_KEY", value=os.getenv("GEMINI_API_KEY", ""), type="password")
    if st.button("Load / Reload Dataset"):
        try:
            pool, resolved = load_round_pool(dataset_id, split, int(max_rows), adapter_mode, strict_mode)
            st.session_state.pool = pool
            if not st.session_state.pool:
                st.error("No valid 4-choice rows found in this dataset subset.")
            else:
                next_round()
                st.success(f"Loaded {len(st.session_state.pool)} valid rounds using adapter: {resolved}.")
        except Exception as e:
            msg = str(e)
            if "Pickler._batch_setitems" in msg:
                st.error(
                    "Failed to load dataset due to a Python/runtime incompatibility. "
                    "Deploy with Python 3.11 or 3.12 (Render: add runtime.txt with python-3.11.9), then redeploy."
                )
            else:
                st.error(f"Failed to load dataset: {msg}")

init_state()

col_a, col_b, col_c = st.columns(3)
col_a.metric("Human", st.session_state.human_score)
col_b.metric("Gemini", st.session_state.ai_score)
col_c.metric("Rounds", st.session_state.round_count)

if not st.session_state.round:
    st.info("Load dataset from the sidebar to start.")
    st.stop()

r = st.session_state.round
audio_wav = audio_bytes_wav(r["audio_array"], r["sampling_rate"])
st.audio(audio_wav, format="audio/wav")
st.subheader(r["question"])

labels = [f"{i}. {text}" for i, text in enumerate(r["choices"])]
selected_label = st.radio("Choose your answer", labels, index=None)
if selected_label is not None:
    st.session_state.selected = int(selected_label.split(".", 1)[0])

if st.button("Submit Round", disabled=st.session_state.selected is None or st.session_state.resolved):
    if not api_key:
        st.error("Enter GEMINI_API_KEY in sidebar.")
    else:
        with st.spinner("Gemini is analyzing the audio..."):
            ai_idx = gemini_answer_index(api_key, model_name, audio_wav, r["question"], r["choices"])
        st.session_state.ai_idx = ai_idx
        st.session_state.resolved = True
        st.session_state.round_count += 1
        if st.session_state.selected == r["correct_index"]:
            st.session_state.human_score += 1
        if ai_idx == r["correct_index"]:
            st.session_state.ai_score += 1

if st.session_state.resolved:
    correct = r["correct_index"]
    human_ok = st.session_state.selected == correct
    ai_ok = st.session_state.ai_idx == correct
    st.success(
        f"Correct: {correct} | You: {'Correct' if human_ok else 'Wrong'} | "
        f"Gemini: {'Correct' if ai_ok else 'Wrong'} (picked {st.session_state.ai_idx})"
    )
    draw_waveform(r["audio_array"], r["sampling_rate"])
    if st.button("Next Round"):
        next_round()
        st.rerun()
