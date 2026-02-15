const playerScoreEl = document.getElementById("playerScore");
const aiScoreEl = document.getElementById("aiScore");
const teamScoreEl = document.getElementById("teamScore");
const roundLabelEl = document.getElementById("roundLabel");
const roundPanel = document.getElementById("roundPanel");
const roundTitle = document.getElementById("roundTitle");
const questionCount = document.getElementById("questionCount");
const questionText = document.getElementById("questionText");
const optionsWrap = document.getElementById("optionsWrap");
const riddleWrap = document.getElementById("riddleWrap");
const riddleInput = document.getElementById("riddleInput");
const submitBtn = document.getElementById("submitBtn");
const skipBtn = document.getElementById("skipBtn");
const nextBtn = document.getElementById("nextBtn");
const resultBox = document.getElementById("resultBox");
const thinkingStatusEl = document.getElementById("thinkingStatus");
const modeHelp = document.getElementById("modeHelp");
const logList = document.getElementById("logList");
const modeButtons = [...document.querySelectorAll(".mode-btn")];
const connectionDotEl = document.getElementById("connectionDot");
const connectionTextEl = document.getElementById("connectionText");
const connectionMetaEl = document.getElementById("connectionMeta");
const restartBtn = document.getElementById("restartGame");
const aiPanelEl = document.querySelector(".ai-panel");
const debugLogEl = document.getElementById("debugLog");
const clearDebugLogBtn = document.getElementById("clearDebugLog");

const aiProviderEl = document.getElementById("aiProvider");
const geminiKeyEl = document.getElementById("geminiKey");
const openaiKeyEl = document.getElementById("openaiKey");
const geminiKeyFieldEl = document.getElementById("geminiKeyField");
const openaiKeyFieldEl = document.getElementById("openaiKeyField");
const aiStatusEl = document.getElementById("aiStatus");
const defaultGeminiModel = "gemini-3-flash-preview";
const defaultOpenAIModel = "gpt-5-mini";
// Local defaults are intentionally blank. Enter keys in the UI.
const hardcodedGeminiKey = "";
const hardcodedOpenAIKey = "";
let lastResolvedModel = null;
const connection = {
  connected: true,
  label: "Simulated AI (offline)",
  latencyMs: null,
  detail: "Ready"
};

const data = {
  knowledge: [
    {
      prompt: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Mercury"],
      answer: 1
    },
    {
      prompt: "What does CPU stand for?",
      options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Core Program Utility"],
      answer: 1
    },
    {
      prompt: "What is the largest ocean on Earth?",
      options: ["Indian", "Atlantic", "Pacific", "Arctic"],
      answer: 2
    },
    {
      prompt: "What gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"],
      answer: 2
    },
    {
      prompt: "Which country is home to the city of Kyoto?",
      options: ["South Korea", "Thailand", "China", "Japan"],
      answer: 3
    },
    {
      prompt: "How many sides does a hexagon have?",
      options: ["5", "6", "7", "8"],
      answer: 1
    },
    {
      prompt: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
      answer: 1
    },
    {
      prompt: "In computing, what does RAM stand for?",
      options: ["Read Access Memory", "Random Access Memory", "Rapid Application Method", "Run Active Module"],
      answer: 1
    },
    {
      prompt: "What is the chemical symbol for gold?",
      options: ["Gd", "Go", "Au", "Ag"],
      answer: 2
    },
    {
      prompt: "Which continent is Egypt located in?",
      options: ["Africa", "Europe", "Asia", "South America"],
      answer: 0
    },
    {
      prompt: "What is the freezing point of water in Celsius?",
      options: ["0", "10", "32", "-10"],
      answer: 0
    },
    {
      prompt: "Which language is primarily used to style web pages?",
      options: ["HTML", "C++", "CSS", "SQL"],
      answer: 2
    },
    {
      prompt: "How many minutes are in 2 hours?",
      options: ["90", "100", "110", "120"],
      answer: 3
    },
    {
      prompt: "What is the capital of Canada?",
      options: ["Toronto", "Ottawa", "Vancouver", "Montreal"],
      answer: 1
    }
  ],
  logic: [
    {
      prompt: "Find the next number: 2, 4, 8, 16, ?",
      options: ["20", "24", "32", "34"],
      answer: 2
    },
    {
      prompt: "If all Zogs are Mips and all Mips are Rals, what must be true?",
      options: ["All Rals are Zogs", "All Zogs are Rals", "No Zogs are Rals", "No conclusion"],
      answer: 1
    },
    {
      prompt: "A is taller than B. B is taller than C. Who is shortest?",
      options: ["A", "B", "C", "Cannot know"],
      answer: 2
    },
    {
      prompt: "Find the next number: 3, 6, 12, 24, ?",
      options: ["36", "40", "48", "54"],
      answer: 2
    },
    {
      prompt: "Which does not belong: Triangle, Square, Circle, Cube?",
      options: ["Triangle", "Square", "Circle", "Cube"],
      answer: 3
    },
    {
      prompt: "If SOME is coded as 1234 and MORE is 3456, what is M?",
      options: ["1", "2", "3", "4"],
      answer: 2
    },
    {
      prompt: "All Flins are Brons. No Brons are Kets. Which must be true?",
      options: ["Some Flins are Kets", "No Flins are Kets", "All Kets are Flins", "All Brons are Flins"],
      answer: 1
    },
    {
      prompt: "Next in sequence: A, C, F, J, O, ?",
      options: ["S", "T", "U", "V"],
      answer: 2
    },
    {
      prompt: "If yesterday was Monday, what day is tomorrow?",
      options: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      answer: 2
    },
    {
      prompt: "A clock shows 3:00. What is the smaller angle between hands?",
      options: ["30°", "60°", "90°", "120°"],
      answer: 2
    },
    {
      prompt: "Complete analogy: Bird : Nest :: Bee : ?",
      options: ["Flower", "Hive", "Wing", "Honey"],
      answer: 1
    },
    {
      prompt: "Find the odd one out: 2, 3, 5, 9, 11",
      options: ["2", "3", "9", "11"],
      answer: 2
    },
    {
      prompt: "If 5 machines make 5 widgets in 5 minutes, 1 machine makes 1 widget in:",
      options: ["1 minute", "5 minutes", "10 minutes", "25 minutes"],
      answer: 1
    },
    {
      prompt: "Sequence: 1, 1, 2, 3, 5, 8, ?",
      options: ["11", "12", "13", "15"],
      answer: 2
    },
    {
      prompt: "If all Blips are Nops and some Nops are Tars, what follows?",
      options: ["Some Blips are Tars", "No Blips are Tars", "Cannot be determined", "All Tars are Blips"],
      answer: 2
    }
  ],
  riddle: [
    {
      prompt: "I have keys but no locks, space but no room. What am I?",
      accepted: ["keyboard", "a keyboard"]
    },
    {
      prompt: "The more you take, the more you leave behind. What are they?",
      accepted: ["footsteps", "steps"]
    },
    {
      prompt: "What has to be broken before you can use it?",
      accepted: ["egg", "an egg"]
    },
    {
      prompt: "What has a neck but no head?",
      accepted: ["bottle", "a bottle"]
    },
    {
      prompt: "What gets wetter the more it dries?",
      accepted: ["towel", "a towel"]
    },
    {
      prompt: "What can travel around the world while staying in one spot?",
      accepted: ["stamp", "a stamp", "postage stamp"]
    },
    {
      prompt: "What has one eye but cannot see?",
      accepted: ["needle", "a needle"]
    },
    {
      prompt: "What has hands but cannot clap?",
      accepted: ["clock", "a clock"]
    },
    {
      prompt: "What goes up but never comes down?",
      accepted: ["age", "your age"]
    },
    {
      prompt: "What has many teeth but cannot bite?",
      accepted: ["comb", "a comb"]
    },
    {
      prompt: "What can you catch but not throw?",
      accepted: ["cold", "a cold"]
    },
    {
      prompt: "I speak without a mouth and hear without ears. What am I?",
      accepted: ["echo", "an echo"]
    },
    {
      prompt: "What has words but never speaks?",
      accepted: ["book", "a book"]
    },
    {
      prompt: "What runs but never walks?",
      accepted: ["water", "river", "a river"]
    },
    {
      prompt: "I dive without breath and bite the seabed without a mouth. To use me is to abandon me.",
      accepted: ["anchor", "an anchor"]
    },
    {
      prompt: "I am a solid block that holds an ocean. I drink the flood but stay dry to the touch until squeezed.",
      accepted: ["sponge", "a sponge"]
    },
    {
      prompt: "I am a copper snake hiding in your walls. I have no poison, but if you touch my bare skin, I will bite.",
      accepted: ["electrical wire", "wire", "an electrical wire"]
    },
    {
      prompt: "I am a yellow stone that explodes into a white cloud. I scream exactly once when I transform.",
      accepted: ["popcorn"]
    },
    {
      prompt: "I am a maze of black blocks with no entrance. I speak to machines, but I am silent to human eyes.",
      accepted: ["qr code", "a qr code"]
    },
    {
      prompt: "I am the five-second bridge over a river of commerce. Everyone waits for me, but the moment I appear, they banish me.",
      accepted: ["skip ad button", "the skip ad button", "skip ad"]
    },
    {
      prompt: "I am the twin born from your loudest shout. I have no body, yet I can bounce off a wall.",
      accepted: ["echo", "an echo"]
    },
    {
      prompt: "I am the son of the spark and the mother of ash. I dance without feet and eat the air.",
      accepted: ["fire"]
    },
    {
      prompt: "I am the prisoner of progress. I fill up from left to right, but I never eat a thing.",
      accepted: ["loading bar", "a loading bar"]
    },
    {
      prompt: "I am a red ghost that haunts the corner of an app icon. I demand your attention without making a sound, and I vanish when you acknowledge me.",
      accepted: ["notification badge", "a notification badge", "badge"]
    }
  ],
  wire: [],
  physics: [],
  agent: []
};
let adversarialMerged = false;

const aiAccuracy = {
  knowledge: 0.68,
  logic: 0.58,
  riddle: 0.46,
  wire: 0.44,
  physics: 0.41,
  agent: 0.35
};

const state = {
  mode: null,
  index: 0,
  selectedOption: null,
  locked: false,
  aiPrefetch: null,
  score: {
    player: 0,
    ai: 0,
    team: 0,
    round: 0
  }
};
const initialModeHelpText = "Pick a mode to begin.";
const debugState = {
  lines: []
};

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function mergeAdversarialQuestionBank() {
  if (adversarialMerged) return;
  if (typeof adversarialData === "undefined" || !adversarialData) {
    return;
  }

  const hasPrompt = new Set(
    [...data.logic, ...data.riddle]
      .filter((item) => item && typeof item.prompt === "string")
      .map((item) => item.prompt.trim().toLowerCase())
  );

  let addedLogic = 0;
  let addedRiddle = 0;

  const logicList = Array.isArray(adversarialData.logic) ? adversarialData.logic : [];
  for (const item of logicList) {
    if (!item || typeof item.prompt !== "string" || !Array.isArray(item.options)) continue;
    if (item.options.length !== 4 || !Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3) continue;
    const key = item.prompt.trim().toLowerCase();
    if (!key || hasPrompt.has(key)) continue;
    data.logic.push({
      prompt: item.prompt,
      options: item.options.map((opt) => String(opt)),
      answer: item.answer
    });
    hasPrompt.add(key);
    addedLogic += 1;
  }

  const riddleList = Array.isArray(adversarialData.riddle) ? adversarialData.riddle : [];
  for (const item of riddleList) {
    if (!item || typeof item.prompt !== "string" || !Array.isArray(item.accepted)) continue;
    const accepted = item.accepted
      .map((value) => String(value).trim())
      .filter(Boolean);
    if (!accepted.length) continue;
    const key = item.prompt.trim().toLowerCase();
    if (!key || hasPrompt.has(key)) continue;
    data.riddle.push({
      prompt: item.prompt,
      accepted
    });
    hasPrompt.add(key);
    addedRiddle += 1;
  }

  adversarialMerged = true;
  debugLog(`Adversarial bank merged: +${addedLogic} logic, +${addedRiddle} riddle.`);
}

function createWireFallbackPuzzle(index) {
  return {
    prompt: `Wire puzzle generator unavailable. Fallback question ${index + 1}: Which number matches A?\n\n A   B   C   D\n |---|   |   |\n |   |---|   |\n |   |   |---|\n 1   2   3   4`,
    options: ["1", "2", "3", "4"],
    answer: 0
  };
}

function buildWireQuestionBank(count = 10) {
  const bank = [];
  for (let i = 0; i < count; i += 1) {
    if (typeof generateWirePuzzle === "function") {
      const wires = 4 + Math.floor(Math.random() * 3);
      const height = 6 + Math.floor(Math.random() * 4);
      const puzzle = generateWirePuzzle(wires, height);
      bank.push({
        prompt: puzzle.prompt,
        options: puzzle.options.map((opt) => String(opt)),
        answer: puzzle.answer
      });
    } else {
      bank.push(createWireFallbackPuzzle(i));
    }
  }
  return bank;
}

function buildPhysicsQuestionBank(count = 10) {
  const bank = [];
  for (let i = 0; i < count; i += 1) {
    if (typeof generatePhysicsPuzzle === "function") {
      const puzzle = generatePhysicsPuzzle(9, 7);
      bank.push({
        prompt: puzzle.prompt,
        options: puzzle.options,
        answer: puzzle.answer
      });
    } else {
      bank.push({
        prompt: "Physics puzzle generator unavailable.",
        options: ["Yes", "No"],
        answer: 0
      });
    }
  }
  return bank;
}

function createAgentFallbackPuzzle(index) {
  return {
    prompt:
      `Agent fallback puzzle ${index + 1}:\n` +
      `# # # # #\n` +
      `# P . T #\n` +
      `# . B . #\n` +
      `# . . . #\n` +
      `# # # # #\n\n` +
      `Which is the best first move for P to eventually push B onto T?`,
    options: ["UP", "DOWN", "LEFT", "RIGHT"],
    answer: 1
  };
}

function cloneAgentState(state) {
  return {
    width: state.width,
    height: state.height,
    layout: state.layout.map((row) => [...row]),
    entities: {
      player: { ...state.entities.player },
      playerBox: { ...state.entities.playerBox },
      playerTarget: { ...state.entities.playerTarget },
      ai: { ...state.entities.ai },
      aiBox: { ...state.entities.aiBox },
      aiTarget: { ...state.entities.aiTarget }
    },
    turn: state.turn,
    finished: state.finished,
    winner: state.winner
  };
}

function scorePlayerMove(simState) {
  const box = simState.entities.playerBox;
  const target = simState.entities.playerTarget;
  const agent = simState.entities.player;
  const boxDist = Math.abs(box.r - target.r) + Math.abs(box.c - target.c);
  const agentToBox = Math.abs(agent.r - box.r) + Math.abs(agent.c - box.c);
  return boxDist * 10 + agentToBox;
}

function buildAgentQuestionBank(count = 10) {
  const bank = [];
  const options = ["UP", "DOWN", "LEFT", "RIGHT"];
  for (let i = 0; i < count; i += 1) {
    if (typeof generateAgentPuzzle !== "function" || typeof moveAgent !== "function" || typeof renderAgentGame !== "function") {
      bank.push(createAgentFallbackPuzzle(i));
      continue;
    }

    const state = generateAgentPuzzle();
    const rendered = renderAgentGame(state);
    let bestMove = "UP";
    let bestScore = Number.POSITIVE_INFINITY;
    let validMoves = 0;

    for (const move of options) {
      const sim = cloneAgentState(state);
      const result = moveAgent(sim, "player", move);
      if (!result || !result.success) continue;
      validMoves += 1;
      const score = scorePlayerMove(sim);
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    if (validMoves === 0) {
      bestMove = "UP";
    }

    bank.push({
      prompt:
        "Agent Lab Puzzle:\n" +
        "Guide P to push B onto T. What is the best first move?\n\n" +
        rendered,
      options,
      answer: options.indexOf(bestMove)
    });
  }
  return bank;
}

function shuffleQuestionBanks() {
  for (const key of Object.keys(data)) {
    if (key === "wire" || key === "physics" || key === "agent") continue;
    data[key] = shuffle(data[key]);
  }
  data.wire = buildWireQuestionBank(10);
  data.physics = buildPhysicsQuestionBank(10);
  data.agent = buildAgentQuestionBank(10);
}

function normalize(text) {
  return text.trim().toLowerCase().replace(/[.!?,]/g, "");
}

function updateScores() {
  playerScoreEl.textContent = String(state.score.player);
  aiScoreEl.textContent = String(state.score.ai);
  teamScoreEl.textContent = String(state.score.team);
  roundLabelEl.textContent = String(state.score.round);
}

function updateAiStatus() {
  const provider = aiProviderEl.value;
  if (provider === "simulated") {
    aiStatusEl.textContent = "Current AI: Simulated (offline).";
    return;
  }

  if (provider === "gemini") {
    const hasKey = geminiKeyEl.value.trim().length > 0;
    const resolvedText = lastResolvedModel ? ` | Resolved: ${lastResolvedModel}` : "";
    aiStatusEl.textContent = hasKey
      ? `Current AI: Gemini (${defaultGeminiModel})${resolvedText}.`
      : "Current AI: Gemini selected, but no API key entered yet.";
    return;
  }

  const hasKey = openaiKeyEl.value.trim().length > 0;
  aiStatusEl.textContent = hasKey
    ? `Current AI: GPT (${defaultOpenAIModel}).`
    : "Current AI: GPT selected, but no API key entered yet.";
}

function refreshAiFieldVisibility() {
  const provider = aiProviderEl.value;
  const isGemini = provider === "gemini";
  const isOpenAI = provider === "openai";

  geminiKeyFieldEl.classList.toggle("hidden-field", !isGemini);
  openaiKeyFieldEl.classList.toggle("hidden-field", !isOpenAI);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function debugLog(message) {
  const line = `[${formatTime(new Date())}] ${message}`;
  debugState.lines.unshift(line);
  if (debugState.lines.length > 200) {
    debugState.lines.pop();
  }
  debugLogEl.textContent = debugState.lines.join("\n");
}

function renderConnection() {
  connectionDotEl.classList.toggle("connected", connection.connected);
  connectionDotEl.classList.toggle("disconnected", !connection.connected);
  connectionTextEl.textContent = `${connection.connected ? "Connected" : "Disconnected"}: ${connection.label}`;
  const latencyText = connection.latencyMs === null ? "Latency: n/a" : `Latency: ${(connection.latencyMs / 1000).toFixed(2)}s`;
  connectionMetaEl.textContent = `${latencyText} | ${connection.detail}`;
}

function setConnectionStatus({ connected, label, latencyMs = null, detail = "Ready" }) {
  connection.connected = connected;
  connection.label = label;
  connection.latencyMs = latencyMs;
  connection.detail = detail;
  renderConnection();
  debugLog(`Connection: ${connected ? "connected" : "disconnected"} | ${label} | ${detail}`);
}

function syncConnectionFromSettings() {
  const provider = aiProviderEl.value;
  if (provider === "simulated") {
    setConnectionStatus({
      connected: true,
      label: "Simulated AI (offline)",
      latencyMs: null,
      detail: "Local mode"
    });
    return;
  }

  if (provider === "gemini") {
    const hasKey = geminiKeyEl.value.trim().length > 0;
    setConnectionStatus({
      connected: hasKey,
      label: hasKey
        ? `Gemini (${defaultGeminiModel})`
        : "Gemini (awaiting API key)",
      latencyMs: null,
      detail: hasKey ? "Key loaded, waiting for first response" : "Enter key to connect"
    });
    return;
  }

  const hasKey = openaiKeyEl.value.trim().length > 0;
  setConnectionStatus({
    connected: hasKey,
    label: hasKey
      ? `GPT (${defaultOpenAIModel})`
      : "GPT (awaiting API key)",
    latencyMs: null,
    detail: hasKey ? "Key loaded, waiting for first response" : "Enter key to connect"
  });
}

function getAiPrefetchFingerprint() {
  const provider = aiProviderEl.value;
  const geminiKey = provider === "gemini" ? geminiKeyEl.value.trim() : "";
  const openaiKey = provider === "openai" ? openaiKeyEl.value.trim() : "";
  return `${state.mode}|${state.index}|${provider}|${geminiKey}|${openaiKey}`;
}

function queueAiPrefetch(force = false) {
  if (!state.mode || state.locked) return null;
  const current = data[state.mode]?.[state.index];
  if (!current) return null;

  const fingerprint = getAiPrefetchFingerprint();
  if (!force && state.aiPrefetch && state.aiPrefetch.fingerprint === fingerprint) {
    return state.aiPrefetch.promise;
  }

  debugLog(`AI prefetch start: ${state.mode} Q${state.index + 1} (${aiProviderEl.value}).`);
  const promise = aiAnswer(current).then((answer) => {
    debugLog(`AI prefetch ready: ${answer.source}.`);
    return answer;
  });
  state.aiPrefetch = { fingerprint, promise };
  return promise;
}

function updateAiPanelVisibility() {
  const hide = state.score.round > 0 && aiProviderEl.value !== "simulated";
  aiPanelEl.hidden = hide;
}

function resetGame() {
  state.mode = null;
  state.index = 0;
  state.selectedOption = null;
  state.locked = false;
  state.aiPrefetch = null;
  state.score.player = 0;
  state.score.ai = 0;
  state.score.team = 0;
  state.score.round = 0;

  shuffleQuestionBanks();
  modeHelp.textContent = initialModeHelpText;
  roundPanel.hidden = true;
  optionsWrap.innerHTML = "";
  riddleWrap.hidden = true;
  optionsWrap.hidden = false;
  questionText.textContent = "";
  resultBox.textContent = "";
  thinkingStatusEl.hidden = true;
  submitBtn.hidden = false;
  submitBtn.disabled = false;
  nextBtn.hidden = true;
  nextBtn.textContent = "Next";
  riddleInput.value = "";
  logList.innerHTML = "";
  debugState.lines = [];
  debugLogEl.textContent = "";

  aiProviderEl.value = "simulated";
  geminiKeyEl.value = hardcodedGeminiKey;
  openaiKeyEl.value = hardcodedOpenAIKey;
  lastResolvedModel = null;
  refreshAiFieldVisibility();
  updateAiStatus();
  syncConnectionFromSettings();
  updateAiPanelVisibility();
  updateScores();
  debugLog("Game reset to initial state.");
}

function resetRoundUi() {
  optionsWrap.innerHTML = "";
  resultBox.textContent = "";
  state.selectedOption = null;
  state.locked = false;
  submitBtn.hidden = false;
  submitBtn.disabled = false;
  skipBtn.hidden = false;
  skipBtn.disabled = false;
  nextBtn.hidden = true;
  riddleInput.value = "";
}

function startMode(mode) {
  state.mode = mode;
  state.index = 0;
  if (mode === "wire" && (!Array.isArray(data.wire) || data.wire.length === 0)) {
    data.wire = buildWireQuestionBank(10);
  }
  if (mode === "physics" && (!Array.isArray(data.physics) || data.physics.length === 0)) {
    data.physics = buildPhysicsQuestionBank(10);
  }
  if (mode === "agent" && (!Array.isArray(data.agent) || data.agent.length === 0)) {
    data.agent = buildAgentQuestionBank(10);
  }
  if (mode === "wire") {
    modeHelp.textContent = `Mode: WIRE. Beat the AI over ${data[mode].length} rounds. Trace from start to finish; as you go down, if you hit a horizontal line, you must follow it across.`;
  } else if (mode === "physics") {
    modeHelp.textContent = `Mode: PHYSICS. Beat the AI over ${data[mode].length} rounds. Read the tower side-view and decide if it is stable (Yes) or falls (No) under gravity.`;
  } else if (mode === "agent") {
    modeHelp.textContent = `Mode: AGENT. Beat the AI over ${data[mode].length} rounds. Choose the best first move for P to eventually push B onto target T.`;
  } else {
    modeHelp.textContent = `Mode: ${mode.toUpperCase()}. Beat the AI over ${data[mode].length} rounds.`;
  }
  roundPanel.hidden = false;
  debugLog(`Mode started: ${mode} (${data[mode].length} questions).`);
  renderQuestion();
}

function renderQuestion() {
  resetRoundUi();
  state.aiPrefetch = null;
  const bank = data[state.mode];
  const current = bank[state.index];

  roundTitle.textContent = `${state.mode[0].toUpperCase()}${state.mode.slice(1)} Round`;
  questionCount.textContent = `Question ${state.index + 1}/${bank.length}`;
  questionText.textContent = current.prompt;
  questionText.classList.toggle("question-mono", state.mode === "wire" || state.mode === "physics" || state.mode === "agent");

  if (state.mode === "riddle") {
    riddleWrap.hidden = false;
    optionsWrap.hidden = true;
    riddleInput.focus();
    queueAiPrefetch();
    return;
  }

  riddleWrap.hidden = true;
  optionsWrap.hidden = false;

  current.options.forEach((option, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.textContent = option;
    btn.addEventListener("click", () => {
      if (state.locked) return;
      state.selectedOption = idx;
      const all = optionsWrap.querySelectorAll(".option");
      all.forEach((el) => el.classList.remove("selected"));
      btn.classList.add("selected");
    });
    optionsWrap.appendChild(btn);
  });

  queueAiPrefetch();
}

function skipCurrentQuestion() {
  if (!state.mode || state.locked || roundPanel.hidden) return;
  const bank = data[state.mode];
  const current = bank[state.index];
  if (!current) return;

  bank.push(current);
  state.index += 1;
  debugLog(`Question skipped in ${state.mode}. Moved to end of list.`);
  renderQuestion();
}

function simulatedAiAnswer(current) {
  const correctRoll = Math.random() < aiAccuracy[state.mode];

  if (state.mode === "riddle") {
    if (correctRoll) return { correct: true, text: current.accepted[0], source: "simulated" };
    const wrong = ["shadow", "book", "time", "cloud"];
    return { correct: false, text: wrong[Math.floor(Math.random() * wrong.length)], source: "simulated" };
  }

  if (correctRoll) {
    return { correct: true, index: current.answer, text: current.options[current.answer], source: "simulated" };
  }

  const wrongIndexes = current.options.map((_, idx) => idx).filter((idx) => idx !== current.answer);
  const picked = wrongIndexes[Math.floor(Math.random() * wrongIndexes.length)];
  return { correct: false, index: picked, text: current.options[picked], source: "simulated" };
}

function extractTextFromGeminiResponse(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return "";
  return parts.map((part) => part.text || "").join("\n").trim();
}

function parseJsonFromModelText(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text.trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callGemini(prompt) {
  const key = geminiKeyEl.value.trim();
  const requestedModel = defaultGeminiModel;
  if (!key) {
    debugLog("Gemini call blocked: no API key.");
    throw new Error("No Gemini API key entered.");
  }

  const model = await resolveGeminiModel(key, requestedModel);
  lastResolvedModel = model;
  updateAiStatus();
  debugLog(`Gemini request start (${model}).`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const msg = await response.text();
    debugLog(`Gemini request failed (${response.status}).`);
    throw new Error(`Gemini request failed (${response.status}): ${msg.slice(0, 220)}`);
  }

  const json = await response.json();
  debugLog("Gemini request success.");
  return extractTextFromGeminiResponse(json);
}

async function listGeminiModels(key) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
    headers: { "x-goog-api-key": key }
  });
  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`ListModels failed (${response.status}): ${msg.slice(0, 180)}`);
  }
  const json = await response.json();
  const models = Array.isArray(json.models) ? json.models : [];
  return models
    .filter((model) => Array.isArray(model.supportedGenerationMethods) && model.supportedGenerationMethods.includes("generateContent"))
    .map((model) => String(model.name || "").replace(/^models\//, ""));
}

function normalizeModelLabel(input) {
  return input.toLowerCase().replace(/[_\s]+/g, "-").trim();
}

function preferredAliases(label) {
  const normalized = normalizeModelLabel(label);
  const aliases = [normalized];

  if (normalized === "gemini-3-flash" || normalized === "gemini-3.0-flash" || normalized === "gemini3-flash") {
    aliases.unshift("gemini-3-flash-preview");
  }
  if (normalized === "gemini-3-flash-preview") {
    aliases.unshift("gemini-3-flash-preview");
  }
  aliases.push("gemini-2.5-flash", "gemini-2.0-flash");
  return [...new Set(aliases)];
}

async function resolveGeminiModel(key, requestedModel) {
  const available = await listGeminiModels(key);
  if (!available.length) {
    throw new Error("No generateContent models returned by ListModels.");
  }

  const exact = requestedModel.replace(/^models\//, "");
  if (available.includes(exact)) {
    return exact;
  }

  const aliases = preferredAliases(exact);
  const aliasHit = aliases.find((candidate) => available.includes(candidate));
  if (aliasHit) {
    return aliasHit;
  }

  const flashHit = available.find((name) => name.includes("flash"));
  return flashHit || available[0];
}

function buildGeminiPrompt(current) {
  if (state.mode === "riddle") {
    return [
      "You are answering a short riddle in a game.",
      "Return JSON only: {\"answer\":\"your answer\"}.",
      "No markdown, no code fences, no extra keys.",
      `Riddle: ${current.prompt}`
    ].join("\n");
  }

  const optionsText = current.options
    .map((opt, idx) => `${idx}: ${opt}`)
    .join("\n");

  return [
    "You are answering a multiple-choice question in a game.",
    "Return JSON only: {\"choiceIndex\":number,\"answer\":\"text\"}.",
    "choiceIndex must be one of the listed numeric indexes.",
    "No markdown, no code fences, no extra keys.",
    `Question: ${current.prompt}`,
    `Options:\n${optionsText}`
  ].join("\n");
}

function validateGeminiChoice(choiceIndex, optionsLength) {
  return Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < optionsLength;
}

async function geminiAiAnswer(current) {
  const prompt = buildGeminiPrompt(current);
  const text = await callGemini(prompt);
  const parsed = parseJsonFromModelText(text);

  if (state.mode === "riddle") {
    const answer = typeof parsed?.answer === "string" ? parsed.answer.trim() : text.trim();
    const aiText = answer || "(no answer)";
    const clean = normalize(aiText);
    const correct = current.accepted.some((word) => clean.includes(normalize(word)));
    return { correct, text: aiText, source: "gemini" };
  }

  let choiceIndex = parsed?.choiceIndex;
  if (typeof choiceIndex === "string" && /^\d+$/.test(choiceIndex.trim())) {
    choiceIndex = Number(choiceIndex.trim());
  }
  if (!validateGeminiChoice(choiceIndex, current.options.length)) {
    const digitMatch = text.match(/\b([0-3])\b/);
    if (digitMatch) {
      choiceIndex = Number(digitMatch[1]);
    }
  }
  if (!validateGeminiChoice(choiceIndex, current.options.length)) {
    throw new Error("Gemini response did not contain a valid choice index.");
  }

  const correct = choiceIndex === current.answer;
  return {
    correct,
    index: choiceIndex,
    text: current.options[choiceIndex],
    source: "gemini"
  };
}

async function callOpenAI(prompt) {
  const key = openaiKeyEl.value.trim();
  const model = defaultOpenAIModel;
  if (!key) {
    debugLog("GPT call blocked: no API key.");
    throw new Error("No OpenAI API key entered.");
  }

  debugLog(`GPT request start (${model}).`);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  if (!response.ok) {
    const msg = await response.text();
    debugLog(`GPT request failed (${response.status}).`);
    throw new Error(`OpenAI request failed (${response.status}): ${msg.slice(0, 220)}`);
  }

  const json = await response.json();
  debugLog("GPT request success.");
  if (typeof json.output_text === "string" && json.output_text.trim()) {
    return json.output_text.trim();
  }

  const contentParts = [];
  const output = Array.isArray(json.output) ? json.output : [];
  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (typeof part.text === "string" && part.text.trim()) {
        contentParts.push(part.text.trim());
      }
    }
  }
  return contentParts.join("\n").trim();
}

async function gptAiAnswer(current) {
  const prompt = buildGeminiPrompt(current);
  const text = await callOpenAI(prompt);
  const parsed = parseJsonFromModelText(text);

  if (state.mode === "riddle") {
    const answer = typeof parsed?.answer === "string" ? parsed.answer.trim() : text.trim();
    const aiText = answer || "(no answer)";
    const clean = normalize(aiText);
    const correct = current.accepted.some((word) => clean.includes(normalize(word)));
    return { correct, text: aiText, source: "gpt" };
  }

  let choiceIndex = parsed?.choiceIndex;
  if (typeof choiceIndex === "string" && /^\d+$/.test(choiceIndex.trim())) {
    choiceIndex = Number(choiceIndex.trim());
  }
  if (!validateGeminiChoice(choiceIndex, current.options.length)) {
    const digitMatch = text.match(/\b([0-3])\b/);
    if (digitMatch) {
      choiceIndex = Number(digitMatch[1]);
    }
  }
  if (!validateGeminiChoice(choiceIndex, current.options.length)) {
    throw new Error("GPT response did not contain a valid choice index.");
  }

  const correct = choiceIndex === current.answer;
  return {
    correct,
    index: choiceIndex,
    text: current.options[choiceIndex],
    source: "gpt"
  };
}

async function aiAnswer(current) {
  const provider = aiProviderEl.value;
  debugLog(`Answering with provider: ${provider}.`);
  if (provider === "simulated") {
    setConnectionStatus({
      connected: true,
      label: "Simulated AI (offline)",
      latencyMs: null,
      detail: "Local mode"
    });
    return simulatedAiAnswer(current);
  }

  if (provider === "gemini") {
    try {
      const answer = await geminiAiAnswer(current);
      setConnectionStatus({
        connected: true,
        label: `Gemini (${lastResolvedModel || defaultGeminiModel})`,
        latencyMs: null,
        detail: `Last success: ${formatTime(new Date())}`
      });
      return answer;
    } catch (err) {
      aiStatusEl.textContent = `Gemini failed, fallback used: ${err.message}`;
      debugLog(`Gemini fallback triggered: ${err.message}`);
      setConnectionStatus({
        connected: true,
        label: "Simulated AI (fallback)",
        latencyMs: null,
        detail: `Gemini error at ${formatTime(new Date())}`
      });
      return simulatedAiAnswer(current);
    }
  }

  try {
    const answer = await gptAiAnswer(current);
    setConnectionStatus({
      connected: true,
      label: `GPT (${defaultOpenAIModel})`,
      latencyMs: null,
      detail: `Last success: ${formatTime(new Date())}`
    });
    return answer;
  } catch (err) {
    aiStatusEl.textContent = `GPT failed, fallback used: ${err.message}`;
    debugLog(`GPT fallback triggered: ${err.message}`);
    setConnectionStatus({
      connected: true,
      label: "Simulated AI (fallback)",
      latencyMs: null,
      detail: `GPT error at ${formatTime(new Date())}`
    });
    return simulatedAiAnswer(current);
  }
}

async function evaluateRound() {
  const current = data[state.mode][state.index];
  let playerCorrect = false;
  let playerAnswerText = "";

  if (state.mode === "riddle") {
    const input = normalize(riddleInput.value);
    if (!input) {
      resultBox.textContent = "Type an answer first.";
      return;
    }
    playerCorrect = current.accepted.some((word) => normalize(word) === input);
    playerAnswerText = riddleInput.value.trim();
  } else {
    if (state.selectedOption === null) {
      resultBox.textContent = "Pick one option first.";
      return;
    }
    playerCorrect = state.selectedOption === current.answer;
    playerAnswerText = current.options[state.selectedOption];
  }

  state.locked = true;
  submitBtn.disabled = true;
  resultBox.textContent = "AI is thinking...";
  thinkingStatusEl.hidden = false;
  const startedAt = performance.now();
  const tick = setInterval(() => {
    const elapsed = (performance.now() - startedAt) / 1000;
    thinkingStatusEl.textContent = `AI is thinking... ${elapsed.toFixed(1)}s`;
  }, 100);
  let ai;
  try {
    const prefetched = queueAiPrefetch();
    ai = prefetched ? await prefetched : await aiAnswer(current);
  } finally {
    clearInterval(tick);
    thinkingStatusEl.hidden = true;
  }
  const elapsedMs = performance.now() - startedAt;
  debugLog(`Round answered in ${(elapsedMs / 1000).toFixed(2)}s (${ai.source}).`);
  if (ai.source === "gemini") {
    setConnectionStatus({
      connected: true,
      label: `Gemini (${lastResolvedModel || defaultGeminiModel})`,
      latencyMs: elapsedMs,
      detail: `Last success: ${formatTime(new Date())}`
    });
  } else if (ai.source === "gpt") {
    setConnectionStatus({
      connected: true,
      label: `GPT (${defaultOpenAIModel})`,
      latencyMs: elapsedMs,
      detail: `Last success: ${formatTime(new Date())}`
    });
  }

  state.score.round += 1;
  updateAiPanelVisibility();
  if (playerCorrect) state.score.player += 1;
  if (ai.correct) state.score.ai += 1;
  if (playerCorrect || ai.correct) state.score.team += 1;
  updateScores();

  const correctText = state.mode === "riddle" ? current.accepted[0] : current.options[current.answer];
  const playerLine = `You: ${playerAnswerText || "(none)"} -> ${playerCorrect ? "Correct" : "Wrong"}`;
  const aiLine = `AI (${ai.source}): ${ai.text} -> ${ai.correct ? "Correct" : "Wrong"}`;

  resultBox.textContent = `${playerLine} | ${aiLine} | Correct answer: ${correctText} | Response: ${(elapsedMs / 1000).toFixed(2)}s`;

  const item = document.createElement("li");
  item.textContent = `[${state.mode}] R${state.score.round}: You ${playerCorrect ? "1" : "0"}, AI ${ai.correct ? "1" : "0"} (${ai.source})`;
  logList.prepend(item);

  submitBtn.hidden = true;
  skipBtn.hidden = true;
  nextBtn.hidden = false;

  if (state.index >= data[state.mode].length - 1) {
    nextBtn.textContent = "Finish Mode";
  } else {
    nextBtn.textContent = "Next";
  }
}

function nextRound() {
  const bank = data[state.mode];
  if (state.index < bank.length - 1) {
    state.index += 1;
    renderQuestion();
    return;
  }

  resultBox.textContent = `Mode complete. Final in this run -> You ${state.score.player}, AI ${state.score.ai}, Team ${state.score.team}. Pick another mode.`;
  roundPanel.hidden = true;
  modeHelp.textContent = "Mode complete. Choose a new mode to continue.";
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => startMode(btn.dataset.mode));
});

submitBtn.addEventListener("click", () => {
  evaluateRound();
});
skipBtn.addEventListener("click", skipCurrentQuestion);

nextBtn.addEventListener("click", nextRound);

riddleInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !submitBtn.disabled && !submitBtn.hidden) {
    evaluateRound();
  }
});

aiProviderEl.addEventListener("change", () => {
  lastResolvedModel = null;
  state.aiPrefetch = null;
  refreshAiFieldVisibility();
  updateAiStatus();
  syncConnectionFromSettings();
  updateAiPanelVisibility();
  if (state.mode && !roundPanel.hidden && !state.locked) {
    queueAiPrefetch(true);
  }
  debugLog(`Provider changed to: ${aiProviderEl.value}`);
});
geminiKeyEl.addEventListener("input", () => {
  lastResolvedModel = null;
  state.aiPrefetch = null;
  updateAiStatus();
  syncConnectionFromSettings();
  updateAiPanelVisibility();
  if (state.mode && !roundPanel.hidden && !state.locked) {
    queueAiPrefetch(true);
  }
  debugLog("Gemini key updated.");
});
openaiKeyEl.addEventListener("input", () => {
  state.aiPrefetch = null;
  updateAiStatus();
  syncConnectionFromSettings();
  updateAiPanelVisibility();
  if (state.mode && !roundPanel.hidden && !state.locked) {
    queueAiPrefetch(true);
  }
  debugLog("OpenAI key updated.");
});
restartBtn.addEventListener("click", resetGame);
clearDebugLogBtn.addEventListener("click", () => {
  debugState.lines = [];
  debugLogEl.textContent = "";
  debugLog("Debug log cleared.");
});

mergeAdversarialQuestionBank();
shuffleQuestionBanks();
refreshAiFieldVisibility();
geminiKeyEl.value = hardcodedGeminiKey;
openaiKeyEl.value = hardcodedOpenAIKey;
updateAiStatus();
updateScores();
syncConnectionFromSettings();
updateAiPanelVisibility();
debugLog("App initialized.");
