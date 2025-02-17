// ---------------------------------------------------------------
// Go Game
// ---------------------------------------------------------------

enum Stone {
  Black = 'black',
  White = 'white'
}

let boardSize: number = 19; // Board size can be 9, 13, or 19
let board: (Stone | null)[][] = [];
let currentPlayer: Stone = Stone.Black;
let blackScore: number = 0;
let whiteScore: number = 0;
let moveHistory: { i: number; j: number; stone: Stone }[] = [];

// Global object to preserve game state for each board size.
let savedGameStates: { 
  [size: number]: {
    board: (Stone | null)[][],
    moveHistory: { i: number; j: number; stone: Stone }[],
    currentPlayer: Stone,
    blackScore: number,
    whiteScore: number
  }
} = {};

// Toggle for displaying the stone order.
let showStoneOrder: boolean = false;

const canvas = document.getElementById("goCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Predefined passphrase used for encryption/decryption.
const PREDEFINED_PASSWORD = "mySecretPassword123";

// Global variable to hold the index of a saved game pending deletion.
let savedGameIndexToDelete: number | null = null;

// ---------------------------------------------------------------
// BOARD CONFIGURATION & INITIALIZATION
// ---------------------------------------------------------------
interface BoardConfig {
  size: number;
  // Other board-specific parameters can be added here
}

const defaultBoard: BoardConfig = { size: 19 };

function getStoredBoard(): BoardConfig | null {
  const stored = localStorage.getItem("selectedBoard");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored board configuration:", e);
    }
  }
  return null;
}

function createBoard(config: BoardConfig) {
  boardSize = config.size;
  if (savedGameStates[boardSize]) {
    const state = savedGameStates[boardSize];
    board = state.board;
    moveHistory = state.moveHistory;
    currentPlayer = state.currentPlayer;
    blackScore = state.blackScore;
    whiteScore = state.whiteScore;
  } else {
    initBoard();
    currentPlayer = Stone.Black;
    blackScore = 0;
    whiteScore = 0;
  }
  drawBoard();
  updateScoreBoard();
}

function selectBoard(newConfig: BoardConfig) {
  localStorage.setItem("selectedBoard", JSON.stringify(newConfig));
  createBoard(newConfig);
}

function initializeBoard() {
  const storedBoard = getStoredBoard();
  const boardConfig: BoardConfig = storedBoard || defaultBoard;
  (document.getElementById("boardSizeSelect") as HTMLSelectElement).value = boardConfig.size.toString();
  createBoard(boardConfig);
}

function getMargin(): number {
  return canvas.width / (boardSize + 1);
}

function initBoard() {
  board = [];
  moveHistory = [];
  for (let i = 0; i < boardSize; i++) {
    board[i] = [];
    for (let j = 0; j < boardSize; j++) {
      board[i][j] = null;
    }
  }
}

// ---------------------------------------------------------------
// DRAWING FUNCTIONS
// ---------------------------------------------------------------
function drawBoard() {
  const margin = getMargin();
  const cellSize = (canvas.width - 2 * margin) / (boardSize - 1);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f5deb3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#000";
  for (let i = 0; i < boardSize; i++) {
    const pos = margin + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(pos, margin);
    ctx.lineTo(pos, canvas.height - margin);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(margin, pos);
    ctx.lineTo(canvas.width - margin, pos);
    ctx.stroke();
  }

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] !== null) {
        drawStone(i, j, board[i][j]!);
      }
    }
  }

  // If toggled, overlay the stone order (from moveHistory) on each stone.
  if (showStoneOrder) {
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let order = 0; order < moveHistory.length; order++) {
      const move = moveHistory[order];
      // Only draw order if the stone is still present.
      if (board[move.i][move.j] === move.stone) {
        const x = margin + move.i * cellSize;
        const y = margin + move.j * cellSize;
        ctx.fillStyle = move.stone === Stone.Black ? "white" : "black";
        ctx.fillText((order + 1).toString(), x, y);
      }
    }
  }
}

function drawStone(i: number, j: number, stone: Stone) {
  const margin = getMargin();
  const cellSize = (canvas.width - 2 * margin) / (boardSize - 1);
  const x = margin + i * cellSize;
  const y = margin + j * cellSize;
  const radius = cellSize / 2 - 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = stone === Stone.Black ? "#000" : "#fff";
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.stroke();
}

function updateScoreBoard() {
  (document.getElementById("blackScore") as HTMLElement).textContent = blackScore.toString();
  (document.getElementById("whiteScore") as HTMLElement).textContent = whiteScore.toString();
  (document.getElementById("turnIndicator") as HTMLElement).textContent = currentPlayer === Stone.Black ? "Black" : "White";
}

// ---------------------------------------------------------------
// MOVE LOGIC & INTERACTIONS
// ---------------------------------------------------------------
function getNeighbors(i: number, j: number): [number, number][] {
  const neighbors: [number, number][] = [];
  if (i > 0) neighbors.push([i - 1, j]);
  if (i < boardSize - 1) neighbors.push([i + 1, j]);
  if (j > 0) neighbors.push([i, j - 1]);
  if (j < boardSize - 1) neighbors.push([i, j + 1]);
  return neighbors;
}

function groupHasLiberty(i: number, j: number, stone: Stone): boolean {
  const visited = new Set<string>();
  const stack: [number, number][] = [[i, j]];

  while (stack.length > 0) {
    const [ci, cj] = stack.pop()!;
    const key = `${ci},${cj}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const neighbors = getNeighbors(ci, cj);
    for (const [ni, nj] of neighbors) {
      if (board[ni][nj] === null) return true;
      if (board[ni][nj] === stone && !visited.has(`${ni},${nj}`)) {
        stack.push([ni, nj]);
      }
    }
  }
  return false;
}

function captureStones(i: number, j: number, stone: Stone) {
  const opponent = stone === Stone.Black ? Stone.White : Stone.Black;
  const neighbors = getNeighbors(i, j);
  for (const [ni, nj] of neighbors) {
    if (board[ni][nj] === opponent) {
      if (!groupHasLiberty(ni, nj, opponent)) {
        const removedCount = removeGroup(ni, nj, opponent);
        if (stone === Stone.Black) {
          blackScore += removedCount;
        } else {
          whiteScore += removedCount;
        }
      }
    }
  }
}

function removeGroup(i: number, j: number, stone: Stone): number {
  const visited = new Set<string>();
  const stack: [number, number][] = [[i, j]];
  let removedCount = 0;
  while (stack.length > 0) {
    const [ci, cj] = stack.pop()!;
    const key = `${ci},${cj}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (board[ci][cj] !== null) {
      board[ci][cj] = null;
      removedCount++;
    }
    const neighbors = getNeighbors(ci, cj);
    for (const [ni, nj] of neighbors) {
      if (board[ni][nj] === stone && !visited.has(`${ni},${nj}`)) {
        stack.push([ni, nj]);
      }
    }
  }
  return removedCount;
}

// ---- SOCKET.IO MULTIPLAYER INTEGRATION ----
// Declare the global "io" provided by the Socket.IO client script.
declare var io: any;

// Connect to the Socket.IO server (assumes same host/port as served page).
const socket = io();

// Sample function to broadcast a stone move.
function broadcastStoneMove(i: number, j: number, stone: Stone) {
  // Prepare move data.
  const moveData = { 
    i, 
    j, 
    stone, 
    // Toggle the turn for broadcast.
    currentPlayer: stone === Stone.Black ? Stone.White : Stone.Black 
  };
  socket.emit('stoneMove', moveData);
}

// Listen for stone moves broadcasted from other clients.
socket.on('stoneMove', (moveData: { i: number; j: number; stone: Stone; currentPlayer: Stone }) => {
  console.log("Received move via network:", moveData);
  // If the board cell is empty, apply the move.
  if (board[moveData.i][moveData.j] === null) {
    board[moveData.i][moveData.j] = moveData.stone;
    moveHistory.push({ i: moveData.i, j: moveData.j, stone: moveData.stone });
    currentPlayer = moveData.currentPlayer;
    drawBoard();
    updateScoreBoard();
  }
});

// Listen for our temporary username.
socket.on('yourUsername', (username: string) => {
  const myUsernameEl = document.getElementById("myUsername");
  if(myUsernameEl) {
    myUsernameEl.textContent = username;
  }
});

// Listen for updates to the connected users list.
socket.on('updateUsers', (userList: string[]) => {
  const userListEl = document.getElementById("userList");
  if (userListEl) {
    userListEl.innerHTML = "";
    userList.forEach((username: string) => {
      const li = document.createElement("li");
      li.textContent = username;
      userListEl.appendChild(li);
    });
  }
});

// Example: Adding a click handler to the canvas to place a stone locally
canvas.addEventListener("click", (event: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const margin = getMargin();
  const cellSize = (canvas.width - 2 * margin) / (boardSize - 1);

  // Calculate board coordinate indices (round to nearest integer).
  const i = Math.round((x - margin) / cellSize);
  const j = Math.round((y - margin) / cellSize);

  // Ensure the click is within board bounds.
  if (i < 0 || i >= boardSize || j < 0 || j >= boardSize) return;

  // Only place a stone if the cell is empty.
  if (board[i][j] === null) {
    board[i][j] = currentPlayer;
    moveHistory.push({ i, j, stone: currentPlayer });
    // Toggle the turn.
    currentPlayer = currentPlayer === Stone.Black ? Stone.White : Stone.Black;
    drawBoard();
    updateScoreBoard();
    broadcastStoneMove(i, j, board[i][j]!);
  }
});

// When the board size changes, save the current state and restore a previous state (if any).
(document.getElementById("boardSizeSelect") as HTMLSelectElement).addEventListener("change", () => {
  const newBoardSize = parseInt((document.getElementById("boardSizeSelect") as HTMLSelectElement).value);
  // Save current state
  savedGameStates[boardSize] = {
    board: board,
    moveHistory: moveHistory,
    currentPlayer: currentPlayer,
    blackScore: blackScore,
    whiteScore: whiteScore
  };
  const newConfig: BoardConfig = { size: newBoardSize };
  selectBoard(newConfig);
});

// ---------------------------------------------------------------
// SAVE/LOAD/EXPORT/IMPORT FUNCTIONS
// ---------------------------------------------------------------
function saveGame() {
  const timestamp = new Date().toISOString();
  const gameState = {
    name: `Go ${boardSize}x${boardSize} - ${new Date().toLocaleString()}`,
    boardSize: boardSize,
    board: board,
    currentPlayer: currentPlayer,
    blackScore: blackScore,
    whiteScore: whiteScore,
    moveHistory: moveHistory,
    timestamp: timestamp
  };

  let savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
  savedGames.push(gameState);
  localStorage.setItem("goSavedGames", JSON.stringify(savedGames));
  populateSavedGames();
}

function loadGame(gameState: any) {
  boardSize = gameState.boardSize;
  board = gameState.board;
  currentPlayer = gameState.currentPlayer;
  blackScore = gameState.blackScore;
  whiteScore = gameState.whiteScore;
  moveHistory = gameState.moveHistory || [];
  (document.getElementById("boardSizeSelect") as HTMLSelectElement).value = boardSize.toString();
  drawBoard();
  updateScoreBoard();
}

function deleteSavedGame(index: number) {
  let savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
  savedGames.splice(index, 1);
  localStorage.setItem("goSavedGames", JSON.stringify(savedGames));
  populateSavedGames();
}

function populateSavedGames() {
  const savedGamesContainer = document.getElementById("savedGames")!;
  savedGamesContainer.innerHTML = "";
  const savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
  savedGames.forEach((game: any, index: number) => {
    const btn = document.createElement("button");
    btn.textContent = game.name ? game.name : `Saved Game ${index + 1}`;
    btn.style.width = "100%";
    btn.addEventListener("click", () => loadGame(game));
    btn.addEventListener("contextmenu", (event: MouseEvent) => {
      event.preventDefault();
      savedGameIndexToDelete = index;
      showDeleteModal();
    });
    savedGamesContainer.appendChild(btn);
  });
}

// ---------------------------------------------------------------
// Modal Functions - updated for Tailwind UI
// ---------------------------------------------------------------
function showDeleteModal() {
  const modal = document.getElementById("deleteModal") as HTMLElement;
  modal.classList.remove("hidden");
}

function hideDeleteModal() {
  const modal = document.getElementById("deleteModal") as HTMLElement;
  modal.classList.add("hidden");
}

(document.getElementById("confirmDelete") as HTMLButtonElement).addEventListener("click", () => {
  if (savedGameIndexToDelete !== null) {
    deleteSavedGame(savedGameIndexToDelete);
    savedGameIndexToDelete = null;
    hideDeleteModal();
  }
});
(document.getElementById("cancelDelete") as HTMLButtonElement).addEventListener("click", () => {
  savedGameIndexToDelete = null;
  hideDeleteModal();
});

(document.getElementById("saveGameBtn") as HTMLButtonElement).addEventListener("click", saveGame);

// ---------------------------------------------------------------
// CLEAR GAME FUNCTIONALITY
// ---------------------------------------------------------------
function clearGameState() {
  initBoard();
  currentPlayer = Stone.Black;
  blackScore = 0;
  whiteScore = 0;
  savedGameStates[boardSize] = {
    board: board,
    moveHistory: moveHistory,
    currentPlayer: currentPlayer,
    blackScore: blackScore,
    whiteScore: whiteScore
  };
  drawBoard();
  updateScoreBoard();
}

(document.getElementById("clearGameBtn") as HTMLButtonElement).addEventListener("click", clearGameState);

// ---------------------------------------------------------------
// TOGGLE MOVE ORDER FUNCTIONALITY
// ---------------------------------------------------------------
function toggleMoveOrder() {
  showStoneOrder = !showStoneOrder;
  drawBoard();
}

(document.getElementById("toggleOrderBtn") as HTMLButtonElement).addEventListener("click", toggleMoveOrder);

// ---------------------------------------------------------------
// ENCRYPTION UTILS (AES-GCM with PBKDF2)
// ---------------------------------------------------------------
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function encryptData(plaintext: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(plaintext)
  );
  const encryptedObject = {
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertextBuffer)
  };
  return JSON.stringify(encryptedObject);
}

async function decryptData(encryptedStr: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const encryptedObject = JSON.parse(encryptedStr);
  const salt = new Uint8Array(base64ToArrayBuffer(encryptedObject.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedObject.iv));
  const ciphertext = base64ToArrayBuffer(encryptedObject.ciphertext);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );
  return decoder.decode(decryptedBuffer);
}

// ---------------------------------------------------------------
// EXPORT / IMPORT FROM LOCAL FILE
// ---------------------------------------------------------------
async function exportGameToFile() {
  const passphrase = PREDEFINED_PASSWORD;
  const timestamp = new Date().toISOString();
  const gameState = {
    name: `Go ${boardSize}x${boardSize} - ${new Date().toLocaleString()}`,
    boardSize: boardSize,
    board: board,
    currentPlayer: currentPlayer,
    blackScore: blackScore,
    whiteScore: whiteScore,
    moveHistory: moveHistory,
    timestamp: timestamp
  };
  const jsonString = JSON.stringify(gameState, null, 2);
  try {
    const encryptedData = await encryptData(jsonString, passphrase);
    const blob = new Blob([encryptedData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `go_game_${boardSize}x${boardSize}_${timestamp}.enc.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    alert("Error encrypting game state: " + err);
  }
}

async function importGameFromFile(file: File) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const encryptedContent = e.target!.result as string;
      const decryptedContent = await decryptData(encryptedContent, PREDEFINED_PASSWORD);
      const gameState = JSON.parse(decryptedContent);
      // Add the imported game to the saved games list and auto-load it.
      let savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
      savedGames.push(gameState);
      localStorage.setItem("goSavedGames", JSON.stringify(savedGames));
      populateSavedGames();
      loadGame(gameState);
    } catch (err) {
      alert("Error loading or decrypting game file.");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

(document.getElementById("exportGameBtn") as HTMLButtonElement)?.addEventListener("click", exportGameToFile);
(document.getElementById("importGameInput") as HTMLInputElement)?.addEventListener("change", (e) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    importGameFromFile(files[0]);
  }
});

// ---------------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------------
initializeBoard();
populateSavedGames();
