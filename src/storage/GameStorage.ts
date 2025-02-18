// src/GameStorage.ts
import { Board, Stone, Move } from "../board/Board";

export interface SavedGameState {
  name: string;
  boardSize: number;
  grid: (Stone | null)[][];
  currentPlayer: Stone;
  blackScore: number;
  whiteScore: number;
  moveHistory: Move[];
  timestamp: string;
}

export class GameStorage {
  static saveGame(board: Board): void {
    const timestamp = new Date().toISOString();
    const gameState: SavedGameState = {
      name: `Go ${board.boardSize}x${board.boardSize} - ${new Date().toLocaleString()}`,
      boardSize: board.boardSize,
      grid: board.grid,
      currentPlayer: board.currentPlayer,
      blackScore: board.blackScore,
      whiteScore: board.whiteScore,
      moveHistory: board.moveHistory,
      timestamp: timestamp,
    };

    const savedGames: SavedGameState[] =
      JSON.parse(localStorage.getItem("goSavedGames") || "[]");
    savedGames.push(gameState);
    localStorage.setItem("goSavedGames", JSON.stringify(savedGames));
  }

  static loadGame(gameState: SavedGameState, board: Board): void {
    board.boardSize = gameState.boardSize;
    board.grid = gameState.grid;
    board.currentPlayer = gameState.currentPlayer;
    board.blackScore = gameState.blackScore;
    board.whiteScore = gameState.whiteScore;
    board.moveHistory = gameState.moveHistory;
  }

  static deleteSavedGame(index: number): void {
    const savedGames: SavedGameState[] =
      JSON.parse(localStorage.getItem("goSavedGames") || "[]");
    savedGames.splice(index, 1);
    localStorage.setItem("goSavedGames", JSON.stringify(savedGames));
  }

  static getSavedGames(): SavedGameState[] {
    return JSON.parse(localStorage.getItem("goSavedGames") || "[]");
  }
}
