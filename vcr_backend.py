import base64
import json
import os
import random
import re
from pathlib import Path
from typing import Any

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "vcr_data"
IMAGES_DIR = DATA_DIR / "images"
SAMPLES_FILE = DATA_DIR / "samples.json"
DATA_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# Use env var GEMINI_API_KEY in all environments.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.0-flash"


app = FastAPI(title="VCR Local Game API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/assets", StaticFiles(directory=IMAGES_DIR), name="assets")


class AiAnswerRequest(BaseModel):
    sample_id: str


def load_samples() -> list[dict[str, Any]]:
    if not SAMPLES_FILE.exists():
        return []
    with SAMPLES_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise HTTPException(status_code=500, detail="samples.json must be an array")
    return data


def validate_sample(sample: dict[str, Any]) -> None:
    keys = {"id", "image", "question", "answer_choices", "answer_label"}
    missing = keys.difference(sample.keys())
    if missing:
        raise HTTPException(status_code=500, detail=f"Sample missing keys: {sorted(missing)}")
    if not isinstance(sample["answer_choices"], list) or len(sample["answer_choices"]) != 4:
        raise HTTPException(status_code=500, detail="answer_choices must be a 4-item list")
    label = sample["answer_label"]
    if not isinstance(label, int) or label < 0 or label > 3:
        raise HTTPException(status_code=500, detail="answer_label must be an int 0..3")


def to_public_sample(sample: dict[str, Any]) -> dict[str, Any]:
    validate_sample(sample)
    image_rel = sample["image"].replace("\\", "/")
    return {
        "id": str(sample["id"]),
        "image_url": f"/assets/{image_rel}",
        "question": sample["question"],
        "answer_choices": sample["answer_choices"],
        "answer_label": sample["answer_label"],
        "image_width": int(sample.get("image_width", 0) or 0),
        "image_height": int(sample.get("image_height", 0) or 0),
        "referenced_ids": sample.get("referenced_ids", []),
        "object_boxes": sample.get("object_boxes", []),
    }


def image_to_base64_parts(image_path: Path) -> tuple[str, str]:
    if not image_path.exists():
        raise HTTPException(status_code=500, detail=f"Missing image file: {image_path}")
    ext = image_path.suffix.lower().lstrip(".") or "jpeg"
    mime = "jpeg" if ext == "jpg" else ext
    raw = image_path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return mime, b64


def call_gemini_for_index(question: str, choices: list[str], image_mime: str, image_b64: str) -> int:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Server missing GEMINI_API_KEY")
    prompt = (
        "You are playing a visual commonsense game.\n"
        "Given one image, one question, and 4 answer choices, return ONLY JSON:\n"
        "{\"choiceIndex\": <0-3>}\n"
        "No markdown, no explanation."
    )
    options_text = "\n".join(f"{i}: {choice}" for i, choice in enumerate(choices))
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {"text": f"Question: {question}\nChoices:\n{options_text}"},
                    {
                        "inlineData": {
                            "mimeType": f"image/{image_mime}",
                            "data": image_b64,
                        }
                    },
                ],
            }
        ]
    }
    resp = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
        headers={
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=45,
    )
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Gemini error: {resp.text[:220]}")

    data = resp.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    chunks = [p.get("text", "") for p in parts if isinstance(p.get("text"), str)]
    text = "\n".join(chunks).strip()

    try:
        parsed = json.loads(text.strip())
        idx = int(parsed["choiceIndex"])
    except Exception:
        # Last-resort digit parse.
        m = re.search(r"\b([0-3])\b", text)
        if not m:
            raise HTTPException(status_code=502, detail=f"Could not parse AI index from: {text[:120]}")
        idx = int(m.group(1))

    if idx < 0 or idx > 3:
        raise HTTPException(status_code=502, detail=f"AI returned invalid choice index: {idx}")
    return idx


@app.get("/api/vcr/health")
def health() -> dict[str, Any]:
    samples = load_samples()
    return {"ok": True, "samples": len(samples), "model": GEMINI_MODEL}


@app.get("/api/vcr/round")
def random_round(used_ids: str = Query(default="")) -> dict[str, Any]:
    samples = load_samples()
    if not samples:
        raise HTTPException(
            status_code=400,
            detail="No VCR samples found. Populate vcr_data/samples.json and vcr_data/images/ first.",
        )
    used_set = {item.strip() for item in used_ids.split(",") if item.strip()}
    unused = [s for s in samples if str(s.get("id")) not in used_set]
    deck_reset = False
    if not unused:
        unused = samples
        deck_reset = True

    sample = random.choice(unused)
    result = to_public_sample(sample)
    result["remaining_unused"] = max(0, len(unused) - 1)
    result["deck_reset"] = deck_reset
    return result


@app.post("/api/vcr/ai-answer")
def ai_answer(req: AiAnswerRequest) -> dict[str, Any]:
    samples = load_samples()
    sample = next((s for s in samples if str(s.get("id")) == req.sample_id), None)
    if not sample:
        raise HTTPException(status_code=404, detail="sample_id not found")

    public = to_public_sample(sample)
    image_path = IMAGES_DIR / str(sample["image"])
    image_mime, image_b64 = image_to_base64_parts(image_path)
    ai_index = call_gemini_for_index(public["question"], public["answer_choices"], image_mime, image_b64)
    return {"sample_id": public["id"], "ai_index": ai_index}


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/vcr_game.html")


# Serve the VCR frontend from the same host for easy deployment.
app.mount("/", StaticFiles(directory=ROOT, html=True), name="web")
