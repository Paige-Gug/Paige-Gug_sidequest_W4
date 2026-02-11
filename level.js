/*
Level.js

A Level represents ONE maze grid loaded from levels.json. 

Tile legend (from your original example): 
0 = floor
1 = wall
2 = start
3 = goal

Responsibilities:
- Store the grid
- Find the start tile
- Provide collision/meaning queries (isWall, isGoal, inBounds)
- Draw the tiles (including a goal highlight)
*/

class Level {
  constructor(grid, tileSize) {
    // Store the tile grid and tile size (pixels per tile).
    this.grid = grid;
    this.ts = tileSize;

    // Start position in grid coordinates (row/col).
    // We compute this by scanning for tile value 2.
    this.start = this.findStart();

    // Optional: if you don't want the start tile to remain "special"
    // after you’ve used it to spawn the player, you can normalize it
    // to floor so it draws like floor and behaves like floor.
    if (this.start) {
      this.grid[this.start.r][this.start.c] = 0;
    }
  }

  // ----- Size helpers -----

  rows() {
    return this.grid.length;
  }

  cols() {
    return this.grid[0].length;
  }

  pixelWidth() {
    return this.cols() * this.ts;
  }

  pixelHeight() {
    return this.rows() * this.ts;
  }

  // ----- Semantic helpers -----

  inBounds(r, c) {
    return r >= 0 && c >= 0 && r < this.rows() && c < this.cols();
  }

  tileAt(r, c) {
    // Caller should check inBounds first.
    return this.grid[r][c];
  }

  isWall(r, c) {
    return this.tileAt(r, c) === 1;
  }

  isGoal(r, c) {
    return this.tileAt(r, c) === 3;
  }

  // ----- Start-finding -----

  findStart() {
    // Scan entire grid to locate the tile value 2 (start).
    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.cols(); c++) {
        if (this.grid[r][c] === 2) {
          return { r, c };
        }
      }
    }

    // If a level forgets to include a start tile, return null.
    // (Then the game can choose a default spawn.)
    return null;
  }

  // Find the goal tile (value 3) in the grid.
  findGoal() {
    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.cols(); c++) {
        if (this.grid[r][c] === 3) return { r, c };
      }
    }
    return null;
  }

  // Compute a shortest path (BFS) from `start` to `goal`.
  // Returns an array of {r,c} positions including start and goal, or null.
  findPath(start, goal) {
    if (!start || !goal) return null;

    const startKey = `${start.r},${start.c}`;
    const goalKey = `${goal.r},${goal.c}`;

    const q = [start];
    const visited = new Set([startKey]);
    const parent = {}; // key -> parentKey

    const dirs = [
      { r: -1, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: -1 },
      { r: 0, c: 1 },
    ];

    while (q.length > 0) {
      const cur = q.shift();
      const curKey = `${cur.r},${cur.c}`;

      if (curKey === goalKey) break;

      for (const d of dirs) {
        const nr = cur.r + d.r;
        const nc = cur.c + d.c;
        const nKey = `${nr},${nc}`;

        if (!this.inBounds(nr, nc)) continue;
        if (visited.has(nKey)) continue;
        // Treat walls (1) as impassable, but allow goal (3).
        const v = this.grid[nr][nc];
        if (v === 1) continue;

        visited.add(nKey);
        parent[nKey] = curKey;
        q.push({ r: nr, c: nc });
      }
    }

    // If goal wasn't reached, return null.
    if (!visited.has(goalKey)) return null;

    // Reconstruct path from goal back to start.
    const path = [];
    let key = goalKey;
    while (key) {
      const [rs, cs] = key.split(",").map((s) => parseInt(s, 10));
      path.push({ r: rs, c: cs });
      if (key === startKey) break;
      key = parent[key];
    }

    path.reverse();
    return path;
  }

  // Pick a random tile along the shortest path (excluding start & goal)
  // and turn it into a wall (1). No-op if no path or path too short.
  addRandomBlockOnPath() {
    const goal = this.findGoal();
    if (!this.start || !goal) return;

    const path = this.findPath(this.start, goal);
    if (!path || path.length <= 2) return; // nothing to block

    // Choose a random index excluding endpoints.
    const idx = Math.floor(Math.random() * (path.length - 2)) + 1;
    const p = path[idx];

    // Only place a block if it's currently floor (0) to avoid
    // accidentally overwriting special tiles.
    if (this.grid[p.r][p.c] === 0) {
      this.grid[p.r][p.c] = 1;
    }
  }

  // ----- Drawing -----

  draw() {
    /*
    Draw each tile as a rectangle.

    Visual rules (matches your original logic): 
    - Walls (1): dark teal
    - Everything else: light floor
    - Goal tile (3): add a highlighted inset rectangle
    */
    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.cols(); c++) {
        const v = this.grid[r][c];

        // Base tile fill
        if (v === 1) fill(59, 12, 102);
        else fill(232);

        rect(c * this.ts, r * this.ts, this.ts, this.ts);

        // Goal highlight overlay (only on tile 3).
        if (v === 3) {
          noStroke();
          fill(102, 12, 96, 200);
          rect(c * this.ts + 4, r * this.ts + 4, this.ts - 8, this.ts - 8, 6);
        }
      }
    }
  }
}
