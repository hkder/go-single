// src/Main.ts
import { Board, Stone } from "./board/Board";
import { BoardRenderer } from "./rendering/BoardRenderer";
import { GameStorage } from "./storage/GameStorage";
import { EncryptionUtil } from "./encryption/CryptoUtils";
// import { SocketClient, StoneMove } from "./networking/SocketClient";

const PREDEFINED_PASSWORD = "mySecretPassword123";
let savedGameIndexToDelete: number | null = null;

const canvas = document.getElementById("goCanvas") as HTMLCanvasElement;
const boardSizeSelect = document.getElementById("boardSizeSelect") as HTMLSelectElement;
const blackScoreElem = document.getElementById("blackScore") as HTMLElement;
const whiteScoreElem = document.getElementById("whiteScore") as HTMLElement;
const turnIndicatorElem = document.getElementById("turnIndicator") as HTMLElement;
const savedGamesContainer = document.getElementById("savedGames") as HTMLElement;
const deleteModal = document.getElementById("deleteModal") as HTMLElement;

const board = new Board(19);
const renderer = new BoardRenderer(canvas, board);

// Create and initialize the SocketClient.
// const socketClient = new SocketClient();

// When receiving a stone move from the network, apply it to the board.
// socketClient.onStoneMove = (moveData: StoneMove) => {
//   console.log("Processing incoming network move", moveData);
//   // Optional: Validate that the move does not already exist in the move history.
//   // For now, simply place the stone (if the spot is free).
//   if (board.grid[moveData.i][moveData.j] === null) {
//     // Set the stone and update the board's turn.
//     board.grid[moveData.i][moveData.j] = moveData.stone;
//     board.moveHistory.push({ i: moveData.i, j: moveData.j, stone: moveData.stone });
//     board.currentPlayer = moveData.currentPlayer;
//     renderer.drawBoard();
//     updateScoreBoard();
//   }
// };

function updateScoreBoard(): void {
  blackScoreElem.textContent = board.blackScore.toString();
  whiteScoreElem.textContent = board.whiteScore.toString();
  turnIndicatorElem.textContent =
    board.currentPlayer === Stone.Black ? "Black" : "White";
}

function redraw(): void {
  renderer.drawBoard();
  updateScoreBoard();
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
  // Broadcast the move over the network.
  // socketClient.broadcastStoneMove(i, j, stoneToPlace, board.currentPlayer);
  redraw();
});

// Change board size.
boardSizeSelect.addEventListener("change", () => {
  const newBoardSize = parseInt(boardSizeSelect.value);
  // (Optionally, you can store the current board state per board size.)
  const newBoard = new Board(newBoardSize);
  // Update the global board.
  board.boardSize = newBoard.boardSize;
  board.grid = newBoard.grid;
  board.moveHistory = newBoard.moveHistory;
  board.currentPlayer = newBoard.currentPlayer;
  board.blackScore = newBoard.blackScore;
  board.whiteScore = newBoard.whiteScore;
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

populateSavedGames();
redraw();
