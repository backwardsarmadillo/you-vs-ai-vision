# Local VCR Data Format

Put your local subset here (recommended: 100 samples to start).

## Folder

- `vcr_data/images/` -> image files (jpg/png/webp/svg)
- `vcr_data/samples.json` -> metadata used by the game

## `samples.json` schema

Each entry must be:

```json
{
  "id": "unique-string",
  "image": "relative-file-name-in-images-folder.jpg",
  "question": "Question text",
  "answer_choices": ["choice0", "choice1", "choice2", "choice3"],
  "answer_label": 2
}
```

Rules:

- `answer_choices` must contain exactly 4 items.
- `answer_label` must be `0..3`.
- `image` must exist under `vcr_data/images/`.

## Run

```bash
pip install fastapi uvicorn requests
uvicorn vcr_backend:app --reload --port 8000
```

Optional env var for AI key:

```bash
set GEMINI_API_KEY=your_key_here
```

To build a 100-sample subset from raw VCR:

```bash
python prepare_vcr_subset.py --vcr-root "C:\\Users\\yusuf\\project1\\vcr_raw" --split val --count 100 --seed 42
```

Then open:

- `http://127.0.0.1:8000/vcr_game.html` if served externally by a static server, or
- `vcr_game.html` in browser while backend is running and same-origin proxy is used.

Recommended local workflow:

1. Start backend on `http://127.0.0.1:8000`
2. Open `vcr_game.html` with a local static server on same origin (or adjust fetch URLs to include full backend URL).

Gameplay note:

- The API avoids repeats until the current subset is exhausted, then reshuffles automatically.
