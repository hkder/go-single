// src/Main.ts
import { Board, Stone } from "./board/Board";
import { BoardRenderer } from "./rendering/BoardRenderer";
import { GameStorage } from "./storage/GameStorage";
import { EncryptionUtil } from "./encryption/CryptoUtils";
import { SocketClient, StoneMove } from "./networking/SocketClient";

const PREDEFINED_PASSWORD = "mySecretPassword123";
let savedGameIndexToDelete: number | null = null;

const canvas = document.getElementById("goCanvas") as HTMLCanvasElement;
const boardSizeSelect = document.getElementById("boardSizeSelect") as HTMLSelectElement;
const blackScoreElem = document.getElementById("blackScore") as HTMLElement;
const whiteScoreElem = document.getElementById("whiteScore") as HTMLElement;
const turnIndicatorElem = document.getElementById("turnIndicator") as HTMLElement;
const savedGamesContainer = document.getElementById("savedGames") as HTMLElement;
const deleteModal = document.getElementById("deleteModal") as HTMLElement;

// Declare a mapping to hold the board state for each board size.
const boardStates: { [boardSize: number]: Board } = {};

// Initialize the board from the board size select, or default to 19.
const defaultBoardSize = parseInt(boardSizeSelect.value) || 19;
let board = new Board(defaultBoardSize);
boardStates[defaultBoardSize] = board;

// Initialize the renderer using the initial board.
const renderer = new BoardRenderer(canvas, board);

// Auto-load the current game state if it exists.
const savedCurrentGameStr = localStorage.getItem("goCurrentGame");
if (savedCurrentGameStr) {
  try {
    const gameState = JSON.parse(savedCurrentGameStr);
    if (gameState.boardSize && gameState.grid && gameState.moveHistory !== undefined) {
      board = new Board(gameState.boardSize);
      boardStates[gameState.boardSize] = board;
      GameStorage.loadGame(gameState, board);
      boardSizeSelect.value = gameState.boardSize.toString();
      renderer.setBoard(board);
    }
  } catch (e) {
    console.error("Error loading current game state:", e);
  }
}

// Create and initialize the SocketClient.
const socketClient = new SocketClient();

function isMoveAlreadyMade(i: number, j: number): boolean {
  return board.moveHistory.some(move => move.i === i && move.j === j);
}

// When receiving a stone move from the network, apply it to the board.
socketClient.onStoneMove = (moveData: StoneMove) => {
  console.log("Processing incoming network move", moveData);

  //
  // If the move's board size doesn't match the current board,
  // it means the other player is using a different board size.
  // Update the board state that matches the board
  //
  if (moveData.boardSize !== board.boardSize) {
    if (boardStates[moveData.boardSize]) {
      boardStates[moveData.boardSize].placeStone(moveData.i, moveData.j);
    }
    return;
  }

  // move's board size matches the current board, so we can process the move.
  if (boardStates[moveData.boardSize]) {
    board = boardStates[moveData.boardSize];
  } else {
    board = new Board(moveData.boardSize);
    boardStates[moveData.boardSize] = board;
  }
  boardSizeSelect.value = moveData.boardSize.toString();
  renderer.setBoard(board);

  // Validate the move is not already in the move history.
  if (isMoveAlreadyMade(moveData.i, moveData.j)) {
    alert("This move has already been made.");
    return;
  }

  // Attempt to place the stone.
  if (board.placeStone(moveData.i, moveData.j)) {
    renderer.drawBoard();
    updateScoreBoard();
  }
};

function updateScoreBoard(): void {
  blackScoreElem.textContent = board.blackScore.toString();
  whiteScoreElem.textContent = board.whiteScore.toString();
  turnIndicatorElem.textContent =
    board.currentPlayer === Stone.Black ? "Black" : "White";
}

function redraw(): void {
  renderer.drawBoard();
  updateScoreBoard();
  saveCurrentGame();

}

// Canvas click handler.
canvas.addEventListener("click", (event: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const margin = canvas.width / (board.boardSize + 1);
  const cellSize = (canvas.width - 2 * margin) / (board.boardSize - 1);
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const i = Math.round((x - margin) / cellSize);
  const j = Math.round((y - margin) / cellSize);
  if (i < 0 || i >= board.boardSize || j < 0 || j >= board.boardSize) {
    return;
  }

  // Save the stone that will be placed (the current player's stone).
  const stoneToPlace = board.currentPlayer;
  const success = board.placeStone(i, j);
  if (!success) {
    alert("Invalid move. Only the last stone can be removed or suicide moves are not allowed.");
    return;
  }
  // Broadcast the move over the network with the board size.
  socketClient.broadcastStoneMove(i, j, stoneToPlace, board.currentPlayer, board.boardSize);
  redraw();
});

// Change board size.
boardSizeSelect.addEventListener("change", () => {
  const newBoardSize = parseInt(boardSizeSelect.value);

  // Save the current board state.
  boardStates[board.boardSize] = board;

  // Retrieve an existing board for the new board size or create a new one.
  if (boardStates[newBoardSize]) {
    board = boardStates[newBoardSize];
  } else {
    board = new Board(newBoardSize);
    boardStates[newBoardSize] = board;
  }

  // Update the renderer's board reference.
  renderer.setBoard(board);
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
      GameStorage.loadGame(game, board);
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
  GameStorage.saveGame(board);
  populateSavedGames();
});

(document.getElementById("clearGameBtn") as HTMLButtonElement).addEventListener("click", () => {
  board.initBoard();
  board.currentPlayer = Stone.Black;
  board.blackScore = 0;
  board.whiteScore = 0;
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
    name: `Go ${board.boardSize}x${board.boardSize} - ${new Date().toLocaleString()}`,
    boardSize: board.boardSize,
    grid: board.grid,
    currentPlayer: board.currentPlayer,
    blackScore: board.blackScore,
    whiteScore: board.whiteScore,
    moveHistory: board.moveHistory,
    timestamp: timestamp,
  };
  const jsonString = JSON.stringify(gameState, null, 2);
  try {
    const encryptedData = await EncryptionUtil.encryptData(jsonString, PREDEFINED_PASSWORD);
    const blob = new Blob([encryptedData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `go_game_${board.boardSize}x${board.boardSize}_${timestamp}.enc.json`;
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
      GameStorage.loadGame(gameState, board);
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
    boardSize: board.boardSize,
    grid: board.grid,
    currentPlayer: board.currentPlayer,
    blackScore: board.blackScore,
    whiteScore: board.whiteScore,
    moveHistory: board.moveHistory,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem("goCurrentGame", JSON.stringify(gameState));
}

populateSavedGames();
redraw();
