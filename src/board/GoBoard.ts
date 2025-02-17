export enum Stone {
  Black = 'black',
  White = 'white'
}

export interface Move {
  i: number;
  j: number;
  stone: Stone;
}

export interface BoardState {
  board: (Stone | null)[][];
  moveHistory: Move[];
  currentPlayer: Stone;
  blackScore: number;
  whiteScore: number;
}

export class GoBoard {
  public board: (Stone | null)[][] = [];
  public moveHistory: Move[] = [];
  public boardSize: number;
  public currentPlayer: Stone = Stone.Black;
  public blackScore: number = 0;
  public whiteScore: number = 0;

  constructor(boardSize: number = 19) {
    this.boardSize = boardSize;
    this.initBoard();
  }

  initBoard(): void {
    this.board = [];
    this.moveHistory = [];
    for (let i = 0; i < this.boardSize; i++) {
      this.board[i] = [];
      for (let j = 0; j < this.boardSize; j++) {
        this.board[i][j] = null;
      }
    }
  }

  placeStone(i: number, j: number): boolean {
    if (i < 0 || i >= this.boardSize || j < 0 || j >= this.boardSize) return false;
    if (this.board[i][j] !== null) return false;

    this.board[i][j] = this.currentPlayer;
    this.moveHistory.push({ i, j, stone: this.currentPlayer });

    // After placing, run capture logic (you can move this to its own method or module)
    this.captureStones(i, j);

    // Toggle current player
    this.currentPlayer = this.currentPlayer === Stone.Black ? Stone.White : Stone.Black;
    return true;
  }

  // A placeholder for the capture logic (you might extract this further)
  captureStones(i: number, j: number): void {
    // Implement capture logic here...
  }
}