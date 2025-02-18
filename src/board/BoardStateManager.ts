import { Board } from "./Board";

export class BoardStateManager {
  private boardStates: { [boardSize: number]: Board } = {};
  private currentBoardSize: number;

  constructor(defaultBoardSize: number) {
    this.currentBoardSize = defaultBoardSize;
  }

  /**
   * Retrieve a board for the given boardSize.
   * If it doesn't exist, create a new Board instance.
   * @param boardSize number
   * @returns Board
   */
  public getBoard(boardSize: number): Board {
    if (!this.boardStates[boardSize]) {
      this.boardStates[boardSize] = new Board(boardSize);
    }
    return this.boardStates[boardSize];
  }

  /**
   * Update or store the board for a given board size.
   * @param boardSize number
   * @param board Board
   */
  public setBoard(board: Board): void {
    this.boardStates[board.boardSize] = board;
  }

  public setCurrentBoard(boardSize: number): void {
    this.currentBoardSize = boardSize;
  }

  public getCurrentBoard(): Board {
    return this.getBoard(this.currentBoardSize);
  }

  public updateBoard(boardState: any): void {
    // create a new board if it doesn't exist.
    if (!this.boardStates[boardState.boardSize]) {
      this.boardStates[boardState.boardSize] = new Board(boardState.boardSize);
    }

    // update the board with the new state.
    this.boardStates[boardState.boardSize].grid = boardState.grid;
    this.boardStates[boardState.boardSize].currentPlayer = boardState.currentPlayer;
    this.boardStates[boardState.boardSize].blackScore = boardState.blackScore;
    this.boardStates[boardState.boardSize].whiteScore = boardState.whiteScore;
    this.boardStates[boardState.boardSize].moveHistory = boardState.moveHistory;
  }
}