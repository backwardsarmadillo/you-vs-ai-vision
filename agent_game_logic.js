// agent_game_logic.js
// A "Human vs AI Agent" warehouse race game.
// Advanced logic with separate static/dynamic layers and validity checks.

const AGENT_GAME = {
  width: 10,
  height: 10,
  chars: {
    empty: '.',
    wall: '#',
    target: 'x', // Generic floor marker
    player: 'P',
    playerBox: 'B',
    ai: 'A',
    aiBox: 'b'
  },
  dirs: {
    UP: { r: -1, c: 0, label: "UP" },
    DOWN: { r: 1, c: 0, label: "DOWN" },
    LEFT: { r: 0, c: -1, label: "LEFT" },
    RIGHT: { r: 0, c: 1, label: "RIGHT" }
  }
};

/**
 * Generates a complex Warehouse Race map.
 * Separates static geometry (walls, targets) from dynamic entities.
 */
function generateAgentPuzzle() {
  const w = AGENT_GAME.width;
  const h = AGENT_GAME.height;
  let layout, entities;
  let attempts = 0;

  // Simple retry loop to avoid completely broken maps
  while (attempts < 50) {
    attempts++;
    
    // 1. Initialize empty layout
    layout = Array.from({ length: h }, () => new Array(w).fill(AGENT_GAME.chars.empty));

    // 2. Borders
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (r === 0 || r === h - 1 || c === 0 || c === w - 1) {
          layout[r][c] = AGENT_GAME.chars.wall;
        }
      }
    }

    // 3. Random obstacles (structured density)
    const obstacleCount = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < obstacleCount; i++) {
      const r = 2 + Math.floor(Math.random() * (h - 4));
      const c = 2 + Math.floor(Math.random() * (w - 4));
      layout[r][c] = AGENT_GAME.chars.wall;
    }

    // 4. Define Targets (Static)
    // Player target (Top Rightish)
    const pTr = 1 + Math.floor(Math.random() * 3);
    const pTc = w - 2 - Math.floor(Math.random() * 3);
    
    // AI target (Bottom Leftish)
    const aTr = h - 2 - Math.floor(Math.random() * 3);
    const aTc = 1 + Math.floor(Math.random() * 3);

    // 5. Place Entities (Dynamic)
    entities = {
      player: { r: 1, c: 1, label: 'P' },
      playerBox: { r: 2, c: 2, label: 'B' },
      playerTarget: { r: pTr, c: pTc }, // Target coords stored in state
      ai: { r: h - 2, c: w - 2, label: 'A' },
      aiBox: { r: h - 3, c: w - 3, label: 'b' },
      aiTarget: { r: aTr, c: aTc }
    };

    // Ensure entities don't spawn on walls
    if (isBlocked(layout, entities.player) || isBlocked(layout, entities.playerBox) || 
        isBlocked(layout, entities.ai) || isBlocked(layout, entities.aiBox) ||
        isBlocked(layout, entities.playerTarget) || isBlocked(layout, entities.aiTarget)) {
      continue;
    }

    // Basic distance check (don't spawn box on target)
    if ((entities.playerBox.r === entities.playerTarget.r && entities.playerBox.c === entities.playerTarget.c) ||
        (entities.aiBox.r === entities.aiTarget.r && entities.aiBox.c === entities.aiTarget.c)) {
      continue;
    }

    // Valid map found
    break;
  }

  return {
    width: w,
    height: h,
    layout: layout, // 2D array of chars (walls, empty)
    entities: entities, // Object with positions
    turn: 0,
    finished: false,
    winner: null
  };
}

function isBlocked(layout, pos) {
  return layout[pos.r][pos.c] === AGENT_GAME.chars.wall;
}

/**
 * Moves an entity.
 * Checks against static layout AND dynamic entities.
 */
function moveAgent(state, who, direction) {
  if (state.finished) return { success: false, message: "Game Over" };

  const agent = who === 'player' ? state.entities.player : state.entities.ai;
  const myBox = who === 'player' ? state.entities.playerBox : state.entities.aiBox;
  const otherAgent = who === 'player' ? state.entities.ai : state.entities.player;
  const otherBox = who === 'player' ? state.entities.aiBox : state.entities.playerBox;

  const dir = AGENT_GAME.dirs[direction];
  if (!dir) return { success: false, message: "Invalid Dir" };

  const newR = agent.r + dir.r;
  const newC = agent.c + dir.c;

  // 1. Check Static Wall
  if (state.layout[newR][newC] === AGENT_GAME.chars.wall) {
    return { success: false, message: "Hit Wall" };
  }

  // 2. Check Dynamic Collision (Agent vs Agent)
  if (newR === otherAgent.r && newC === otherAgent.c) {
    return { success: false, message: "Hit Opponent" };
  }

  // 3. Check Dynamic Collision (Agent vs Box)
  let pushingBox = null;
  if (newR === myBox.r && newC === myBox.c) pushingBox = myBox;
  else if (newR === otherBox.r && newC === otherBox.c) pushingBox = otherBox;

  if (pushingBox) {
    // Attempt Push
    const boxNewR = newR + dir.r;
    const boxNewC = newC + dir.c;

    // Check what's behind the box
    // Wall?
    if (state.layout[boxNewR][boxNewC] === AGENT_GAME.chars.wall) {
      return { success: false, message: "Box Blocked by Wall" };
    }
    // Another Agent?
    if (boxNewR === otherAgent.r && boxNewC === otherAgent.c) {
      return { success: false, message: "Box Blocked by Opponent" };
    }
    // Another Box? (The one we aren't pushing)
    const remainingBox = pushingBox === myBox ? otherBox : myBox;
    if (boxNewR === remainingBox.r && boxNewC === remainingBox.c) {
      return { success: false, message: "Box Blocked by Box" };
    }

    // Success! Update Box Pos
    pushingBox.r = boxNewR;
    pushingBox.c = boxNewC;
    
    // Update Agent Pos
    agent.r = newR;
    agent.c = newC;
    
    checkWinCondition(state);
    return { success: true, message: "Pushed Box" };
  }

  // 4. Move into Empty Space
  agent.r = newR;
  agent.c = newC;
  return { success: true, message: "Moved" };
}

function checkWinCondition(state) {
  const pBox = state.entities.playerBox;
  const pTarget = state.entities.playerTarget;
  const aBox = state.entities.aiBox;
  const aTarget = state.entities.aiTarget;

  const playerWin = (pBox.r === pTarget.r && pBox.c === pTarget.c);
  const aiWin = (aBox.r === aTarget.r && aBox.c === aTarget.c);

  if (playerWin && aiWin) {
    state.finished = true;
    state.winner = "Draw";
  } else if (playerWin) {
    state.finished = true;
    state.winner = "Player";
  } else if (aiWin) {
    state.finished = true;
    state.winner = "AI";
  }
}

/**
 * Renders the game state to a string grid.
 * Merges layout and entities.
 */
function renderAgentGame(state) {
  // Deep copy layout to temporary grid
  const grid = state.layout.map(row => [...row]);

  // Overlay Targets
  grid[state.entities.playerTarget.r][state.entities.playerTarget.c] = 'T'; // Player Goal
  grid[state.entities.aiTarget.r][state.entities.aiTarget.c] = 't'; // AI Goal

  // Overlay Dynamic Entities
  const ents = [
    state.entities.playerBox,
    state.entities.aiBox,
    state.entities.player,
    state.entities.ai
  ];

  for (const ent of ents) {
    grid[ent.r][ent.c] = ent.label;
  }

  return grid.map(row => row.join(" ")).join("\n");
}

function getAgentAiPrompt(state) {
  const mapStr = renderAgentGame(state);
  const ai = state.entities.ai;
  const box = state.entities.aiBox;
  const target = state.entities.aiTarget;
  
  return `
You are an AI Agent in a warehouse game.
Your Character: 'A' at (${ai.c}, ${ai.r})
Your Box: 'b' at (${box.c}, ${box.r})
Your Target: 't' at (${target.c}, ${target.r})
Opponent: 'P' (ignore them, focus on your goal)

Map Legend:
# = Wall
. = Empty Floor
A = You
b = Your Box
t = Your Target
P = Player
B = Player Box
T = Player Target

Current Map:
${mapStr}

Objective: Push box 'b' onto target 't'.
Constraint: You can only push the box if you are behind it. You cannot pull.
Task: Output the best next move (UP, DOWN, LEFT, RIGHT).
Format JSON: {"move": "DIRECTION", "reason": "brief reasoning"}
`.trim();
}