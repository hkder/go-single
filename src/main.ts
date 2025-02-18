// src/Main.ts
import { Board, Stone } from "./board/Board";
import { BoardRenderer } from "./rendering/BoardRenderer";
import { GameStorage } from "./storage/GameStorage";
import { EncryptionUtil } from "./encryption/CryptoUtils";
import { SocketClient, StoneMove } from "./networking/SocketClient";
import { SyncManager } from "./sync/SyncManager";
import { BoardStateManager } from "./board/BoardStateManager";

const PREDEFINED_PASSWORD = "mySecretPassword123";
let savedGameIndexToDelete: number | null = null;

const canvas = document.getElementById("goCanvas") as HTMLCanvasElement;
const boardSizeSelect = document.getElementById("boardSizeSelect") as HTMLSelectElement;
const blackScoreElem = document.getElementById("blackScore") as HTMLElement;
const whiteScoreElem = document.getElementById("whiteScore") as HTMLElement;
const turnIndicatorElem = document.getElementById("turnIndicator") as HTMLElement;
const savedGamesContainer = document.getElementById("savedGames") as HTMLElement;
const deleteModal = document.getElementById("deleteModal") as HTMLElement;

// Create a BoardStateManager instance to manage board states.
const defaultBoardSize = parseInt(boardSizeSelect.value) || 19;
const boardStateManager = new BoardStateManager(defaultBoardSize);

// Initialize the renderer using the initial board.
const renderer = new BoardRenderer(canvas, boardStateManager.getCurrentBoard());

// Create and initialize the SocketClient.
const socketClient = new SocketClient();

// Initialize the sync manager.
const syncManager = new SyncManager(socketClient.getSocket(), boardStateManager, renderer);

// Auto-load the current game state if it exists.
const savedCurrentGameStr = localStorage.getItem("goCurrentGame");
if (savedCurrentGameStr) {
  try {
    const gameState = JSON.parse(savedCurrentGameStr);
    if (gameState.boardSize && gameState.grid && gameState.moveHistory !== undefined) {
      GameStorage.loadGame(gameState, boardStateManager.getCurrentBoard());
      boardSizeSelect.value = gameState.boardSize.toString();
      renderer.setBoard(boardStateManager.getCurrentBoard());
    }
  } catch (e) {
    console.error("Error loading current game state:", e);
  }
}

function isMoveAlreadyMade(i: number, j: number): boolean {
  return boardStateManager.getCurrentBoard().moveHistory.some(move => move.i === i && move.j === j);
}

// When receiving a stone move from the network, apply it to the board.
socketClient.onStoneMove = (moveData: StoneMove) => {
  console.log("Processing incoming network move", moveData);

  if (!syncManager.getIsOnline() || syncManager.getCurrentSyncTarget() === null) return;

  // If the move's board size doesn't match the current board,
  // update the board state for that board size.
  if (moveData.boardSize !== boardStateManager.getCurrentBoard().boardSize) {
    // In Sync mode, we don't need to update the board state for the other board.
    // const otherBoard = boardStateManager.getBoard(moveData.boardSize);
    // otherBoard.placeStone(moveData.i, moveData.j);
    return;
  }

  // Validate the move is not already in the move history.
  if (isMoveAlreadyMade(moveData.i, moveData.j)) {
    alert("This move has already been made.");
    return;
  }

  // Set the renderer board to the current board.
  renderer.setBoard(boardStateManager.getCurrentBoard());

  // Attempt to place the stone.
  if (boardStateManager.getCurrentBoard().placeStone(moveData.i, moveData.j)) {
    renderer.drawBoard();
    updateScoreBoard();
  }
};

function updateScoreBoard(): void {
  blackScoreElem.textContent = boardStateManager.getCurrentBoard().blackScore.toString();
  whiteScoreElem.textContent = boardStateManager.getCurrentBoard().whiteScore.toString();
  turnIndicatorElem.textContent =
    boardStateManager.getCurrentBoard().currentPlayer === Stone.Black ? "Black" : "White";
}

function redraw(): void {
  renderer.drawBoard();
  updateScoreBoard();
  saveCurrentGame();
}

// Canvas click handler.
canvas.addEventListener("click", (event: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const margin = canvas.width / (boardStateManager.getCurrentBoard().boardSize + 1);
  const cellSize = (canvas.width - 2 * margin) / (boardStateManager.getCurrentBoard().boardSize - 1);
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const i = Math.round((x - margin) / cellSize);
  const j = Math.round((y - margin) / cellSize);
  if (i < 0 || i >= boardStateManager.getCurrentBoard().boardSize || j < 0 || j >= boardStateManager.getCurrentBoard().boardSize) {
    return;
  }

  // Save the stone that will be placed (the current player's stone).
  const stoneToPlace = boardStateManager.getCurrentBoard().currentPlayer;
  const success = boardStateManager.getCurrentBoard().placeStone(i, j);
  if (!success) {
    alert("Invalid move. Only the last stone can be removed or suicide moves are not allowed.");
    return;
  }

  // temporary variable to get the current board.
  let currentBoard = boardStateManager.getCurrentBoard();

  // Broadcast the move over the network with the board size.
  if (syncManager.getIsOnline() && syncManager.getCurrentSyncTarget() !== null) {
    socketClient.broadcastStoneMove(i, j, stoneToPlace, currentBoard.currentPlayer, currentBoard.boardSize);
  }

  redraw();
});

// Change board size.
boardSizeSelect.addEventListener("change", () => {
  const newBoardSize = parseInt(boardSizeSelect.value);

  // Save the current board state.
  boardStateManager.setCurrentBoard(newBoardSize);

  // Update the sync manager's board reference.
  syncManager.setCurrentBoard(boardStateManager.getBoard(newBoardSize));

  // Update the renderer's board reference.
  renderer.setBoard(boardStateManager.getCurrentBoard());
  redraw();
});

// Populate saved games list.
function populateSavedGames(): void {
  savedGamesContainer.innerHTML = "";
  const savedGames = GameStorage.getSavedGames();
  savedGames.forEach((game, index) => {
    const btn = document.createElement("button");
    btn.textContent = game.name ? game.name : `Saved Game ${index + 1}`;
    btn.style.width = "100%";
    btn.addEventListener("click", () => {
      GameStorage.loadGame(game, boardStateManager.getCurrentBoard());
      redraw();
    });
    btn.addEventListener("contextmenu", (event: MouseEvent) => {
      event.preventDefault();
      savedGameIndexToDelete = index;
      showDeleteModal();
    });
    savedGamesContainer.appendChild(btn);
  });
}

function showDeleteModal(): void {
  deleteModal.classList.remove("hidden");
}

function hideDeleteModal(): void {
  deleteModal.classList.add("hidden");
}

(document.getElementById("confirmDelete") as HTMLButtonElement).addEventListener("click", () => {
  if (savedGameIndexToDelete !== null) {
    GameStorage.deleteSavedGame(savedGameIndexToDelete);
    savedGameIndexToDelete = null;
    hideDeleteModal();
    populateSavedGames();
  }
});

(document.getElementById("cancelDelete") as HTMLButtonElement).addEventListener("click", () => {
  savedGameIndexToDelete = null;
  hideDeleteModal();
});

(document.getElementById("saveGameBtn") as HTMLButtonElement).addEventListener("click", () => {
  GameStorage.saveGame(boardStateManager.getCurrentBoard());
  populateSavedGames();
});

(document.getElementById("clearGameBtn") as HTMLButtonElement).addEventListener("click", () => {
  boardStateManager.getCurrentBoard().initBoard();
  boardStateManager.getCurrentBoard().currentPlayer = Stone.Black;
  boardStateManager.getCurrentBoard().blackScore = 0;
  boardStateManager.getCurrentBoard().whiteScore = 0;
  localStorage.removeItem("goCurrentGame");
  redraw();
});

(document.getElementById("toggleOrderBtn") as HTMLButtonElement).addEventListener("click", () => {
  renderer.showStoneOrder = !renderer.showStoneOrder;
  redraw();
});

// Export game functionality.
async function exportGameToFile(): Promise<void> {
  const timestamp = new Date().toISOString();
  const gameState = {
    name: `Go ${boardStateManager.getCurrentBoard().boardSize}x${boardStateManager.getCurrentBoard().boardSize} - ${new Date().toLocaleString()}`,
    boardSize: boardStateManager.getCurrentBoard().boardSize,
    grid: boardStateManager.getCurrentBoard().grid,
    currentPlayer: boardStateManager.getCurrentBoard().currentPlayer,
    blackScore: boardStateManager.getCurrentBoard().blackScore,
    whiteScore: boardStateManager.getCurrentBoard().whiteScore,
    moveHistory: boardStateManager.getCurrentBoard().moveHistory,
    timestamp: timestamp,
  };
  const jsonString = JSON.stringify(gameState, null, 2);
  try {
    const encryptedData = await EncryptionUtil.encryptData(jsonString, PREDEFINED_PASSWORD);
    const blob = new Blob([encryptedData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `go_game_${boardStateManager.getCurrentBoard().boardSize}x${boardStateManager.getCurrentBoard().boardSize}_${timestamp}.enc.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    alert("Error encrypting game state: " + err);
  }
}

(document.getElementById("exportGameBtn") as HTMLButtonElement)?.addEventListener("click", exportGameToFile);

// Import game functionality.
async function importGameFromFile(file: File): Promise<void> {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const encryptedContent = e.target!.result as string;
      const decryptedContent = await EncryptionUtil.decryptData(encryptedContent, PREDEFINED_PASSWORD);
      const gameState = JSON.parse(decryptedContent);
      // Save the imported game.
      const savedGames = GameStorage.getSavedGames();
      savedGames.push(gameState);
      localStorage.setItem("goSavedGames", JSON.stringify(savedGames));
      populateSavedGames();
      GameStorage.loadGame(gameState, boardStateManager.getCurrentBoard());
      redraw();
    } catch (err) {
      alert("Error loading or decrypting game file.");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

(document.getElementById("importGameInput") as HTMLInputElement)?.addEventListener("change", (e) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    importGameFromFile(files[0]);
  }
});

// Add listener to delete all saved games.
(document.getElementById("deleteAllGamesBtn") as HTMLButtonElement)?.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all saved games?")) {
    localStorage.removeItem("goSavedGames");
    populateSavedGames();
  }
});

function saveCurrentGame(): void {
  const gameState = {
    boardSize: boardStateManager.getCurrentBoard().boardSize,
    grid: boardStateManager.getCurrentBoard().grid,
    currentPlayer: boardStateManager.getCurrentBoard().currentPlayer,
    blackScore: boardStateManager.getCurrentBoard().blackScore,
    whiteScore: boardStateManager.getCurrentBoard().whiteScore,
    moveHistory: boardStateManager.getCurrentBoard().moveHistory,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem("goCurrentGame", JSON.stringify(gameState));
}

populateSavedGames();
redraw();
