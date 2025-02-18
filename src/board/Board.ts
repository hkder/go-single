export enum Stone {
  Black = 'black',
  White = 'white'
}

export interface Move {
  i: number;
  j: number;
  stone: Stone;
}

export class Board {
  public boardSize: number;
  public grid: (Stone | null)[][];
  public moveHistory: Move[];
  public currentPlayer: Stone;
  public blackScore: number;
  public whiteScore: number;

  constructor(boardSize: number = 19) {
    this.boardSize = boardSize;
    this.grid = [];
    this.moveHistory = [];
    this.currentPlayer = Stone.Black;
    this.blackScore = 0;
    this.whiteScore = 0;
    this.initBoard();
  }

  public initBoard(): void {
    this.grid = [];
    this.moveHistory = [];
    for (let i = 0; i < this.boardSize; i++) {
      this.grid[i] = [];
      for (let j = 0; j < this.boardSize; j++) {
        this.grid[i][j] = null;
      }
    }
  }

  public getNeighbors(i: number, j: number): [number, number][] {
    const neighbors: [number, number][] = [];
    if (i > 0) neighbors.push([i - 1, j]);
    if (i < this.boardSize - 1) neighbors.push([i + 1, j]);
    if (j > 0) neighbors.push([i, j - 1]);
    if (j < this.boardSize - 1) neighbors.push([i, j + 1]);
    return neighbors;
  }

  public groupHasLiberty(i: number, j: number, stone: Stone): boolean {
    const visited = new Set<string>();
    const stack: [number, number][] = [[i, j]];

    while (stack.length > 0) {
      const [ci, cj] = stack.pop()!;
      const key = `${ci},${cj}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const neighbors = this.getNeighbors(ci, cj);
      for (const [ni, nj] of neighbors) {
        if (this.grid[ni][nj] === null) return true;
        if (this.grid[ni][nj] === stone && !visited.has(`${ni},${nj}`)) {
          stack.push([ni, nj]);
        }
      }
    }
    return false;
  }

  public removeGroup(i: number, j: number, stone: Stone): number {
    const visited = new Set<string>();
    const stack: [number, number][] = [[i, j]];
    let removedCount = 0;
    while (stack.length > 0) {
      const [ci, cj] = stack.pop()!;
      const key = `${ci},${cj}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (this.grid[ci][cj] !== null) {
        this.grid[ci][cj] = null;
        removedCount++;
      }
      const neighbors = this.getNeighbors(ci, cj);
      for (const [ni, nj] of neighbors) {
        if (this.grid[ni][nj] === stone && !visited.has(`${ni},${nj}`)) {
          stack.push([ni, nj]);
        }
      }
    }
    return removedCount;
  }

  public captureStones(i: number, j: number, stone: Stone): void {
    const opponent = stone === Stone.Black ? Stone.White : Stone.Black;
    const neighbors = this.getNeighbors(i, j);
    for (const [ni, nj] of neighbors) {
      if (this.grid[ni][nj] === opponent) {
        if (!this.groupHasLiberty(ni, nj, opponent)) {
          const removedCount = this.removeGroup(ni, nj, opponent);
          if (stone === Stone.Black) {
            this.blackScore += removedCount;
          } else {
            this.whiteScore += removedCount;
          }
        }
      }
    }
  }

  /**
   * Place a stone at (i, j). Returns true if the move was valid.
   * If a stone is already present, allow removal only if it is the last move.
   */
  public placeStone(i: number, j: number): boolean {
    if (this.grid[i][j] !== null) {
      // Only allow removal if it is the last placed stone.
      if (this.moveHistory.length > 0) {
        const lastMove = this.moveHistory[this.moveHistory.length - 1];
        if (lastMove.i === i && lastMove.j === j) {
          this.grid[i][j] = null;
          this.moveHistory.pop();
          this.currentPlayer = lastMove.stone;
          return true;
        }
      }
      return false;
    }

    // Place the stone
    this.grid[i][j] = this.currentPlayer;
    // Capture opponent stones if any
    this.captureStones(i, j, this.currentPlayer);

    // Check for suicide move
    if (!this.groupHasLiberty(i, j, this.currentPlayer)) {
      this.grid[i][j] = null;
      return false;
    }

    // Record the move and switch turn.
    this.moveHistory.push({ i, j, stone: this.currentPlayer });
    this.currentPlayer =
      this.currentPlayer === Stone.Black ? Stone.White : Stone.Black;
    return true;
  }
}
