// wire_game_logic.js
// A text-based "Entanglement" game to test AI spatial reasoning.
// Generates ASCII "Ghost Leg" (Amidakuji) puzzles.

/**
 * Generates a random ASCII wire puzzle.
 * @param {number} numWires - Number of vertical wires (3-6 recommended for text).
 * @param {number} height - Height of the ladder (number of potential bridge rows).
 */
function generateWirePuzzle(numWires = 6, height = 12) {
  // Force higher complexity even if caller requests less
  // User feedback: "wayyyy too simple"
  if (numWires < 6) numWires = 6; 
  if (height < 12) height = 12;

  // 1. Initialize the grid structure
  // We need distinct start labels (A, B, C...) and end labels (1, 2, 3...)
  const startLabels = "ABCDEFGH".slice(0, numWires).split("");
  const endLabels = Array.from({ length: numWires }, (_, i) => String(i + 1));
  
  // Bridges: bridges[row][col] is true if there is a horizontal line between wire[col] and wire[col+1]
  const bridges = [];

  // 2. Generate random bridges
  for (let r = 0; r < height; r++) {
    const rowBridges = new Array(numWires - 1).fill(false);
    for (let c = 0; c < numWires - 1; c++) {
      // Randomly place a bridge, but ensure no two bridges are adjacent horizontally
      // Increased probability to 0.65 for more twists
      if (Math.random() < 0.65) {
        if (c > 0 && rowBridges[c - 1]) {
          // Skip to avoid double bridge
        } else {
          rowBridges[c] = true;
        }
      }
    }
    bridges.push(rowBridges);
  }

  // 3. Render the ASCII Art
  let art = "";
  
  // Header: A   B   C   D
  art += " " + startLabels.join("   ") + "\n";
  
  for (let r = 0; r < height; r++) {
    // Vertical segments
    let line = "";
    for (let c = 0; c < numWires; c++) {
      line += "|";
      if (c < numWires - 1) {
        // If there is a bridge, draw "---", otherwise "   "
        line += bridges[r][c] ? "---" : "   ";
      }
    }
    art += " " + line + "\n";
  }
  
  // Footer: 1   2   3   4
  art += " " + endLabels.join("   ") + "\n";

  // 4. Calculate the Solution (Trace the paths)
  // We need to know where EACH start label ends up.
  const solution = {}; // { "A": "3", "B": "1", ... }

  for (let i = 0; i < numWires; i++) {
    let currentWire = i;
    const startChar = startLabels[i];

    // Walk down the ladder
    for (let r = 0; r < height; r++) {
      // Check left bridge
      if (currentWire > 0 && bridges[r][currentWire - 1]) {
        currentWire--; // Move left
      } 
      // Check right bridge
      else if (currentWire < numWires - 1 && bridges[r][currentWire]) {
        currentWire++; // Move right
      }
      // Otherwise just go down (currentWire stays same)
    }
    
    solution[startChar] = endLabels[currentWire];
  }

  // 5. Select a random target for the question
  const targetIndex = Math.floor(Math.random() * numWires);
  const targetStart = startLabels[targetIndex];
  const correctEnd = solution[targetStart];

  // Generate incorrect options
  const otherEnds = endLabels.filter(l => l !== correctEnd);
  // Shuffle and pick 3 wrong answers
  const wrongOptions = otherEnds.sort(() => 0.5 - Math.random()).slice(0, 3);
  const options = [correctEnd, ...wrongOptions].sort(); // Randomize order or keep sorted?
  // Let's just return numeric sorted options to look clean
  options.sort((a, b) => a - b);

  return {
    prompt: `Trace the path for '${targetStart}'. Which number does it connect to?\n\n${art}`,
    ascii: art,
    questionLabel: targetStart,
    answer: options.indexOf(correctEnd), // Index of the correct answer in 'options'
    options: options,
    rawAnswer: correctEnd,
    fullMap: solution
  };
}

// Example usage test:
// const game = generateWirePuzzle(4, 8);
// console.log(game.prompt);
// console.log("Correct Answer:", game.rawAnswer);
