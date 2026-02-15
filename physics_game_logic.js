// physics_game_logic.js
// A text-based "Will It Fall?" game to test AI intuitive physics.
// Generates ASCII block towers and calculates stability.

/**
 * Generates a random ASCII block tower puzzle.
 * @param {number} width - Width of the ground (e.g. 9 slots).
 * @param {number} height - Max height of the tower.
 */
function generatePhysicsPuzzle(width = 9, height = 6) {
  // 1. Initialize grid (0 = empty, 1 = block)
  // We build from bottom up, so grid[0] is the ground.
  const grid = Array.from({ length: height }, () => new Array(width).fill(0));
  
  // 2. Build the tower randomly but somewhat connected
  // Start with a base block in the middle
  const center = Math.floor(width / 2);
  grid[0][center] = 1;
  
  // Helper to get block range on a row
  function getBlockRange(row) {
    let min = -1, max = -1;
    for(let c=0; c<width; c++) {
      if (grid[row][c] === 1) {
        if (min === -1) min = c;
        max = c;
      }
    }
    return min === -1 ? null : { min, max, count: max - min + 1 };
  }

  // Add more blocks layer by layer
  for (let r = 0; r < height - 1; r++) {
    const range = getBlockRange(r);
    if (!range) break; // Tower stopped

    // Decide next layer's width and offset
    // We want some to be unstable, so we allow offsetting left or right
    const nextWidth = Math.max(1, Math.min(3, range.count + (Math.random() > 0.5 ? 1 : -1)));
    
    // Shift relative to the block below
    // -1: shift left, 0: centered-ish, 1: shift right
    const shift = Math.floor(Math.random() * 3) - 1; 
    
    // Calculate start position for next layer
    let startCol = range.min + shift;
    
    // Bounds check
    if (startCol < 0) startCol = 0;
    if (startCol + nextWidth > width) startCol = width - nextWidth;

    // Place blocks
    for (let c = 0; c < nextWidth; c++) {
      grid[r + 1][startCol + c] = 1;
    }
    
    // Randomly stop building
    if (Math.random() < 0.15) break;
  }

  // 3. Render ASCII Art
  // Invert grid for display (top row first)
  let art = "";
  for (let r = height - 1; r >= 0; r--) {
    let line = "";
    let hasBlock = false;
    for (let c = 0; c < width; c++) {
      if (grid[r][c] === 1) {
        line += "[#]";
        hasBlock = true;
      } else {
        line += " . ";
      }
    }
    if (hasBlock || r === 0) { // Only show rows with blocks (and always the bottom)
       art += line + "\n";
    }
  }
  art += "=".repeat(width * 3) + " (Ground)";

  // 4. Calculate Stability (Simplified Physics)
  // A structure is stable if the Center of Mass (CoM) of all blocks *above* a contact point
  // falls within the support base provided by the layer below.
  
  let isStable = true;
  let failRow = -1;

  for (let r = 0; r < height - 1; r++) {
    // Check stability of the sub-tower starting from r+1 supported by r
    
    // 1. Calculate CoM of everything from r+1 upwards
    let totalMass = 0;
    let weightedSum = 0;
    
    for (let y = r + 1; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] === 1) {
          totalMass += 1;
          weightedSum += (x + 0.5); // Center of block x is x+0.5
        }
      }
    }
    
    if (totalMass === 0) break; // No more blocks above
    
    const centerOfMassX = weightedSum / totalMass;
    
    // 2. Find the support base at row r
    // The support is the range of blocks in row r that are *connected* to the structure above.
    // For this simple 2D grid, we assume the tower is one contiguous piece. 
    // So the support is simply the min/max x of blocks in row r.
    const support = getBlockRange(r);
    
    if (!support) {
      // Floating blocks? Unstable (shouldn't happen with this generator but good to check)
      isStable = false;
      failRow = r;
      break;
    }
    
    // Support range is from left edge of leftmost block to right edge of rightmost block
    // Left edge of block x is x. Right edge is x+1.
    const supportMin = support.min;
    const supportMax = support.max + 1;
    
    // Check if CoM is strictly outside the base
    if (centerOfMassX < supportMin || centerOfMassX > supportMax) {
      isStable = false;
      failRow = r;
      break;
    }
  }

  const correctAnswer = isStable ? "Yes" : "No";

  return {
    prompt: `Physics Challenge:\nLook at this side-view of a block tower. Blocks are marked [#].\nGravity pulls straight down.\n\n${art}\n\nIs this tower stable? (Answer Yes or No)`,
    ascii: art,
    answer: isStable ? 0 : 1, // 0 for Yes, 1 for No
    options: ["Yes", "No"],
    rawAnswer: correctAnswer,
    debug: `Stable: ${isStable}, FailRow: ${failRow}`
  };
}

// Example usage:
// console.log(generatePhysicsPuzzle(9, 8).prompt);
