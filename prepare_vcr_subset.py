import argparse
import json
import random
import re
import shutil
from pathlib import Path


def render_token(token, objects):
    if isinstance(token, str):
        return token
    if isinstance(token, list):
        refs = []
        for idx in token:
            if not isinstance(idx, int) or idx < 0 or idx >= len(objects):
                continue
            label = str(objects[idx]).lower()
            if label == "person":
                refs.append(f"person{idx}")
            else:
                refs.append(f"{label}{idx}")
        if not refs:
            return ""
        if len(refs) == 1:
            return f"[{refs[0]}]"
        if len(refs) == 2:
            return f"[{refs[0]} and {refs[1]}]"
        return "[" + ", ".join(refs[:-1]) + f", and {refs[-1]}]"
    return ""


def join_tokens(tokens, objects):
    parts = [render_token(tok, objects) for tok in tokens]
    text = " ".join(p for p in parts if p)
    text = re.sub(r"\s+([?.!,:;])", r"\1", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


def extract_ref_ids(tokens):
    refs = []
    for token in tokens:
        if isinstance(token, list):
            for idx in token:
                if isinstance(idx, int):
                    refs.append(idx)
    return refs


def main():
    parser = argparse.ArgumentParser(description="Prepare a small local VCR subset for vcr_game.")
    parser.add_argument("--vcr-root", required=True, help="Path to unzipped VCR root folder (contains vcr1images, train/val/test jsonl).")
    parser.add_argument("--split", default="val", choices=["train", "val"], help="Which split to sample from.")
    parser.add_argument("--count", type=int, default=100, help="Number of samples to export.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    parser.add_argument("--out", default="vcr_data", help="Output folder (default: vcr_data).")
    args = parser.parse_args()

    random.seed(args.seed)
    vcr_root = Path(args.vcr_root)
    ann_file = vcr_root / f"{args.split}.jsonl"
    images_root = vcr_root / "vcr1images"
    out_root = Path(args.out)
    out_images = out_root / "images"
    out_images.mkdir(parents=True, exist_ok=True)

    if not ann_file.exists():
        raise SystemExit(f"Missing annotation file: {ann_file}")
    if not images_root.exists():
        raise SystemExit(f"Missing images dir: {images_root}")

    rows = []
    with ann_file.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            if "answer_label" not in item:
                continue
            rows.append(item)

    if not rows:
        raise SystemExit("No labeled rows found in selected split.")

    count = min(args.count, len(rows))
    picked = random.sample(rows, count)
    samples = []
    copied = 0

    for i, item in enumerate(picked, start=1):
        img_fn = item.get("img_fn")
        objects = item.get("objects", [])
        metadata_fn = item.get("metadata_fn")
        question_tokens = item.get("question", [])
        choices_tokens = item.get("answer_choices", [])
        answer_label = int(item.get("answer_label", -1))
        if not img_fn or answer_label < 0 or answer_label > 3:
            continue
        if not isinstance(choices_tokens, list) or len(choices_tokens) != 4:
            continue

        src = images_root / img_fn
        if not src.exists():
            continue

        meta = {}
        if metadata_fn:
            meta_path = images_root / metadata_fn
            if meta_path.exists():
                try:
                    meta = json.load(meta_path.open("r", encoding="utf-8"))
                except Exception:
                    meta = {}

        safe_name = img_fn.replace("\\", "__").replace("/", "__")
        dst = out_images / safe_name
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

        question = join_tokens(question_tokens, objects)
        answer_choices = [join_tokens(choice, objects) for choice in choices_tokens]
        referenced_ids = set(extract_ref_ids(question_tokens))
        for choice in choices_tokens:
            referenced_ids.update(extract_ref_ids(choice))

        meta_boxes = meta.get("boxes", [])
        meta_names = meta.get("names", [])
        object_boxes = []
        for idx, box in enumerate(meta_boxes):
            if not isinstance(box, list) or len(box) < 4:
                continue
            label_base = ""
            if idx < len(objects):
                label_base = str(objects[idx]).lower()
            elif idx < len(meta_names):
                label_base = str(meta_names[idx]).lower()
            if not label_base:
                label_base = "object"
            if label_base == "person":
                token_label = f"person{idx}"
            else:
                token_label = f"{label_base}{idx}"
            object_boxes.append(
                {
                    "idx": idx,
                    "label": token_label,
                    "x1": float(box[0]),
                    "y1": float(box[1]),
                    "x2": float(box[2]),
                    "y2": float(box[3]),
                }
            )

        sample_id = str(item.get("annot_id") or item.get("img_id") or f"{args.split}-{i:04d}")
        samples.append(
            {
                "id": sample_id,
                "image": safe_name,
                "question": question,
                "answer_choices": answer_choices,
                "answer_label": answer_label,
                "image_width": int(meta.get("width", 0)) if meta else 0,
                "image_height": int(meta.get("height", 0)) if meta else 0,
                "referenced_ids": sorted(referenced_ids),
                "object_boxes": object_boxes,
            }
        )
        copied += 1

    out_root.mkdir(parents=True, exist_ok=True)
    out_file = out_root / "samples.json"
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(samples, f, indent=2, ensure_ascii=False)

    print(f"Prepared {copied} samples at: {out_file}")
    print(f"Images copied to: {out_images}")


if __name__ == "__main__":
    main()
