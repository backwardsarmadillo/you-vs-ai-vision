const humanScoreEl = document.getElementById("humanScore");
const aiScoreEl = document.getElementById("aiScore");
const roundCountEl = document.getElementById("roundCount");
const statusEl = document.getElementById("status");
const sceneImageEl = document.getElementById("sceneImage");
const overlayCanvasEl = document.getElementById("overlayCanvas");
const overlayLegendEl = document.getElementById("overlayLegend");
const questionTextEl = document.getElementById("questionText");
const choicesEl = document.getElementById("choices");
const submitBtn = document.getElementById("submitBtn");
const nextBtn = document.getElementById("nextBtn");
const resultEl = document.getElementById("result");
const API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:8000" : window.location.origin;

const state = {
  round: null,
  aiPromise: null,
  selected: null,
  humanScore: 0,
  aiScore: 0,
  roundCount: 0,
  usedIds: new Set(),
};

function drawOverlay() {
  const round = state.round;
  const ctx = overlayCanvasEl.getContext("2d");
  const cssW = sceneImageEl.clientWidth;
  const cssH = sceneImageEl.clientHeight;
  if (!ctx || !round || cssW <= 0 || cssH <= 0) return;

  const dpr = window.devicePixelRatio || 1;
  overlayCanvasEl.width = Math.max(1, Math.floor(cssW * dpr));
  overlayCanvasEl.height = Math.max(1, Math.floor(cssH * dpr));
  overlayCanvasEl.style.width = `${cssW}px`;
  overlayCanvasEl.style.height = `${cssH}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const boxes = Array.isArray(round.object_boxes) ? round.object_boxes : [];
  const refs = new Set(Array.isArray(round.referenced_ids) ? round.referenced_ids : []);
  const visible = boxes.filter((b) => refs.size === 0 || refs.has(Number(b.idx)));
  if (!visible.length) {
    overlayLegendEl.textContent = "No object overlays for this sample.";
    return;
  }

  const srcW = Number(round.image_width) || sceneImageEl.naturalWidth || cssW;
  const srcH = Number(round.image_height) || sceneImageEl.naturalHeight || cssH;
  const sx = cssW / srcW;
  const sy = cssH / srcH;

  ctx.lineWidth = 2;
  ctx.font = "12px Trebuchet MS";
  visible.slice(0, 35).forEach((box) => {
    const x = Number(box.x1) * sx;
    const y = Number(box.y1) * sy;
    const w = Math.max(1, (Number(box.x2) - Number(box.x1)) * sx);
    const h = Math.max(1, (Number(box.y2) - Number(box.y1)) * sy);
    ctx.strokeStyle = "#6aa7ff";
    ctx.fillStyle = "rgba(106,167,255,0.14)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    const tag = `[${box.label}]`;
    const textW = ctx.measureText(tag).width;
    ctx.fillStyle = "rgba(16,24,40,0.84)";
    ctx.fillRect(x, Math.max(0, y - 16), textW + 8, 14);
    ctx.fillStyle = "#e8efff";
    ctx.fillText(tag, x + 4, Math.max(11, y - 4));
  });

  const names = visible.slice(0, 12).map((b) => `[${b.label}]`).join(", ");
  overlayLegendEl.textContent = `Showing ${visible.length} referenced objects: ${names}${visible.length > 12 ? ", ..." : ""}`;
}

function renderScores() {
  humanScoreEl.textContent = String(state.humanScore);
  aiScoreEl.textContent = String(state.aiScore);
  roundCountEl.textContent = String(state.roundCount);
}

async function fetchRound() {
  const used = [...state.usedIds].join(",");
  const res = await fetch(`${API_BASE}/api/vcr/round?used_ids=${encodeURIComponent(used)}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

async function fetchAiAnswer(sampleId) {
  const res = await fetch(`${API_BASE}/api/vcr/ai-answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sample_id: sampleId }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

function renderRound(round) {
  state.selected = null;
  submitBtn.disabled = true;
  nextBtn.hidden = true;
  resultEl.textContent = "";
  const resetNote = round.deck_reset ? " Deck reshuffled." : "";
  const remaining = typeof round.remaining_unused === "number" ? ` Remaining before reshuffle: ${round.remaining_unused}.` : "";
  statusEl.textContent = `AI is pre-answering in background.${remaining}${resetNote}`;

  sceneImageEl.src = round.image_url;
  if (round.image_url.startsWith("/")) {
    sceneImageEl.src = `${API_BASE}${round.image_url}`;
  }
  sceneImageEl.onload = () => drawOverlay();
  questionTextEl.textContent = round.question;
  choicesEl.innerHTML = "";
  round.answer_choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";
    btn.textContent = `${idx}. ${choice}`;
    btn.addEventListener("click", () => {
      state.selected = idx;
      submitBtn.disabled = false;
      [...choicesEl.querySelectorAll(".choice")].forEach((el) => el.classList.remove("selected"));
      btn.classList.add("selected");
    });
    choicesEl.appendChild(btn);
  });
}

async function loadNextRound() {
  statusEl.textContent = "Loading round...";
  submitBtn.disabled = true;
  nextBtn.hidden = true;
  try {
    const round = await fetchRound();
    state.round = round;
    state.usedIds.add(String(round.id));
    renderRound(round);
    state.aiPromise = fetchAiAnswer(round.id);
    state.aiPromise.finally(() => {
      statusEl.textContent = "AI answer ready.";
    });
  } catch (err) {
    statusEl.textContent = `Failed to load round: ${err.message}`;
  }
}

submitBtn.addEventListener("click", async () => {
  if (!state.round || state.selected === null) return;
  submitBtn.disabled = true;
  statusEl.textContent = "Checking result...";

  let aiIndex = -1;
  try {
    const ai = state.aiPromise ? await state.aiPromise : await fetchAiAnswer(state.round.id);
    aiIndex = ai.ai_index;
  } catch (err) {
    statusEl.textContent = `AI failed: ${err.message}`;
  }

  const correct = state.round.answer_label;
  const humanCorrect = state.selected === correct;
  const aiCorrect = aiIndex === correct;

  if (humanCorrect) state.humanScore += 1;
  if (aiCorrect) state.aiScore += 1;
  state.roundCount += 1;
  renderScores();

  resultEl.textContent = `Correct: ${correct} | You: ${humanCorrect ? "Correct" : "Wrong"} | AI: ${aiCorrect ? "Correct" : "Wrong"} (picked ${aiIndex})`;
  statusEl.textContent = "Round complete.";
  nextBtn.hidden = false;
});

nextBtn.addEventListener("click", loadNextRound);

renderScores();
loadNextRound();
window.addEventListener("resize", drawOverlay);
