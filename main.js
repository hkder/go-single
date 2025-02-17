"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
var Stone;
(function (Stone) {
    Stone["Black"] = "black";
    Stone["White"] = "white";
})(Stone || (Stone = {}));
let boardSize = 19;
let board = [];
let currentPlayer = Stone.Black;
let blackScore = 0;
let whiteScore = 0;
let moveHistory = [];
let savedGameStates = {};
let showStoneOrder = false;
const canvas = document.getElementById("goCanvas");
const ctx = canvas.getContext("2d");
const PREDEFINED_PASSWORD = "mySecretPassword123";
let savedGameIndexToDelete = null;
const defaultBoard = { size: 19 };
function getStoredBoard() {
    const stored = localStorage.getItem("selectedBoard");
    if (stored) {
        try {
            return JSON.parse(stored);
        }
        catch (e) {
            console.error("Error parsing stored board configuration:", e);
        }
    }
    return null;
}
function createBoard(config) {
    boardSize = config.size;
    if (savedGameStates[boardSize]) {
        const state = savedGameStates[boardSize];
        board = state.board;
        moveHistory = state.moveHistory;
        currentPlayer = state.currentPlayer;
        blackScore = state.blackScore;
        whiteScore = state.whiteScore;
    }
    else {
        initBoard();
        currentPlayer = Stone.Black;
        blackScore = 0;
        whiteScore = 0;
    }
    drawBoard();
    updateScoreBoard();
}
function selectBoard(newConfig) {
    localStorage.setItem("selectedBoard", JSON.stringify(newConfig));
    createBoard(newConfig);
}
function initializeBoard() {
    const storedBoard = getStoredBoard();
    const boardConfig = storedBoard || defaultBoard;
    document.getElementById("boardSizeSelect").value = boardConfig.size.toString();
    createBoard(boardConfig);
}
function getMargin() {
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
                drawStone(i, j, board[i][j]);
            }
        }
    }
    if (showStoneOrder) {
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let order = 0; order < moveHistory.length; order++) {
            const move = moveHistory[order];
            if (board[move.i][move.j] === move.stone) {
                const x = margin + move.i * cellSize;
                const y = margin + move.j * cellSize;
                ctx.fillStyle = move.stone === Stone.Black ? "white" : "black";
                ctx.fillText((order + 1).toString(), x, y);
            }
        }
    }
}
function drawStone(i, j, stone) {
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
    document.getElementById("blackScore").textContent = blackScore.toString();
    document.getElementById("whiteScore").textContent = whiteScore.toString();
    document.getElementById("turnIndicator").textContent = currentPlayer === Stone.Black ? "Black" : "White";
}
function getNeighbors(i, j) {
    const neighbors = [];
    if (i > 0)
        neighbors.push([i - 1, j]);
    if (i < boardSize - 1)
        neighbors.push([i + 1, j]);
    if (j > 0)
        neighbors.push([i, j - 1]);
    if (j < boardSize - 1)
        neighbors.push([i, j + 1]);
    return neighbors;
}
function groupHasLiberty(i, j, stone) {
    const visited = new Set();
    const stack = [[i, j]];
    while (stack.length > 0) {
        const [ci, cj] = stack.pop();
        const key = `${ci},${cj}`;
        if (visited.has(key))
            continue;
        visited.add(key);
        const neighbors = getNeighbors(ci, cj);
        for (const [ni, nj] of neighbors) {
            if (board[ni][nj] === null)
                return true;
            if (board[ni][nj] === stone && !visited.has(`${ni},${nj}`)) {
                stack.push([ni, nj]);
            }
        }
    }
    return false;
}
function captureStones(i, j, stone) {
    const opponent = stone === Stone.Black ? Stone.White : Stone.Black;
    const neighbors = getNeighbors(i, j);
    for (const [ni, nj] of neighbors) {
        if (board[ni][nj] === opponent) {
            if (!groupHasLiberty(ni, nj, opponent)) {
                const removedCount = removeGroup(ni, nj, opponent);
                if (stone === Stone.Black) {
                    blackScore += removedCount;
                }
                else {
                    whiteScore += removedCount;
                }
            }
        }
    }
}
function removeGroup(i, j, stone) {
    const visited = new Set();
    const stack = [[i, j]];
    let removedCount = 0;
    while (stack.length > 0) {
        const [ci, cj] = stack.pop();
        const key = `${ci},${cj}`;
        if (visited.has(key))
            continue;
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
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const margin = getMargin();
    const cellSize = (canvas.width - 2 * margin) / (boardSize - 1);
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const i = Math.round((x - margin) / cellSize);
    const j = Math.round((y - margin) / cellSize);
    if (i < 0 || i >= boardSize || j < 0 || j >= boardSize) {
        return;
    }
    if (board[i][j] !== null) {
        if (moveHistory.length > 0) {
            const lastMove = moveHistory[moveHistory.length - 1];
            if (lastMove.i === i && lastMove.j === j) {
                board[i][j] = null;
                moveHistory.pop();
                currentPlayer = lastMove.stone;
                drawBoard();
                updateScoreBoard();
            }
            else {
                alert("Only the last placed stone can be removed.");
            }
        }
        return;
    }
    board[i][j] = currentPlayer;
    captureStones(i, j, currentPlayer);
    if (!groupHasLiberty(i, j, currentPlayer)) {
        board[i][j] = null;
        alert("Suicide move is not allowed!");
        drawBoard();
        updateScoreBoard();
        return;
    }
    moveHistory.push({ i, j, stone: currentPlayer });
    currentPlayer = currentPlayer === Stone.Black ? Stone.White : Stone.Black;
    drawBoard();
    updateScoreBoard();
});
document.getElementById("boardSizeSelect").addEventListener("change", () => {
    const newBoardSize = parseInt(document.getElementById("boardSizeSelect").value);
    savedGameStates[boardSize] = {
        board: board,
        moveHistory: moveHistory,
        currentPlayer: currentPlayer,
        blackScore: blackScore,
        whiteScore: whiteScore
    };
    const newConfig = { size: newBoardSize };
    selectBoard(newConfig);
});
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
function loadGame(gameState) {
    boardSize = gameState.boardSize;
    board = gameState.board;
    currentPlayer = gameState.currentPlayer;
    blackScore = gameState.blackScore;
    whiteScore = gameState.whiteScore;
    moveHistory = gameState.moveHistory || [];
    document.getElementById("boardSizeSelect").value = boardSize.toString();
    drawBoard();
    updateScoreBoard();
}
function deleteSavedGame(index) {
    let savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
    savedGames.splice(index, 1);
    localStorage.setItem("goSavedGames", JSON.stringify(savedGames));
    populateSavedGames();
}
function populateSavedGames() {
    const savedGamesContainer = document.getElementById("savedGames");
    savedGamesContainer.innerHTML = "";
    const savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
    savedGames.forEach((game, index) => {
        const btn = document.createElement("button");
        btn.textContent = game.name ? game.name : `Saved Game ${index + 1}`;
        btn.style.width = "100%";
        btn.addEventListener("click", () => loadGame(game));
        btn.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            savedGameIndexToDelete = index;
            showDeleteModal();
        });
        savedGamesContainer.appendChild(btn);
    });
}
function showDeleteModal() {
    const modal = document.getElementById("deleteModal");
    modal.style.display = "block";
}
function hideDeleteModal() {
    const modal = document.getElementById("deleteModal");
    modal.style.display = "none";
}
document.getElementById("confirmDelete").addEventListener("click", () => {
    if (savedGameIndexToDelete !== null) {
        deleteSavedGame(savedGameIndexToDelete);
        savedGameIndexToDelete = null;
        hideDeleteModal();
    }
});
document.getElementById("cancelDelete").addEventListener("click", () => {
    savedGameIndexToDelete = null;
    hideDeleteModal();
});
document.getElementById("saveGameBtn").addEventListener("click", saveGame);
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
document.getElementById("clearGameBtn").addEventListener("click", clearGameState);
function toggleMoveOrder() {
    showStoneOrder = !showStoneOrder;
    drawBoard();
}
document.getElementById("toggleOrderBtn").addEventListener("click", toggleMoveOrder);
function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
function encryptData(plaintext, passphrase) {
    return __awaiter(this, void 0, void 0, function* () {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const keyMaterial = yield crypto.subtle.importKey("raw", encoder.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"]);
        const key = yield crypto.subtle.deriveKey({
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
        const ciphertextBuffer = yield crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, encoder.encode(plaintext));
        const encryptedObject = {
            salt: arrayBufferToBase64(salt.buffer),
            iv: arrayBufferToBase64(iv.buffer),
            ciphertext: arrayBufferToBase64(ciphertextBuffer)
        };
        return JSON.stringify(encryptedObject);
    });
}
function decryptData(encryptedStr, passphrase) {
    return __awaiter(this, void 0, void 0, function* () {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const encryptedObject = JSON.parse(encryptedStr);
        const salt = new Uint8Array(base64ToArrayBuffer(encryptedObject.salt));
        const iv = new Uint8Array(base64ToArrayBuffer(encryptedObject.iv));
        const ciphertext = base64ToArrayBuffer(encryptedObject.ciphertext);
        const keyMaterial = yield crypto.subtle.importKey("raw", encoder.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"]);
        const key = yield crypto.subtle.deriveKey({
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
        const decryptedBuffer = yield crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
        return decoder.decode(decryptedBuffer);
    });
}
function exportGameToFile() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const encryptedData = yield encryptData(jsonString, passphrase);
            const blob = new Blob([encryptedData], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `go_game_${boardSize}x${boardSize}_${timestamp}.enc.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        catch (err) {
            alert("Error encrypting game state: " + err);
        }
    });
}
function importGameFromFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const reader = new FileReader();
        reader.onload = (e) => __awaiter(this, void 0, void 0, function* () {
            try {
                const encryptedContent = e.target.result;
                const decryptedContent = yield decryptData(encryptedContent, PREDEFINED_PASSWORD);
                const gameState = JSON.parse(decryptedContent);
                let savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
                savedGames.push(gameState);
                localStorage.setItem("goSavedGames", JSON.stringify(savedGames));
                populateSavedGames();
                loadGame(gameState);
            }
            catch (err) {
                alert("Error loading or decrypting game file.");
                console.error(err);
            }
        });
        reader.readAsText(file);
    });
}
(_a = document.getElementById("exportGameBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", exportGameToFile);
(_b = document.getElementById("importGameInput")) === null || _b === void 0 ? void 0 : _b.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        importGameFromFile(files[0]);
    }
});
initializeBoard();
populateSavedGames();
//# sourceMappingURL=main.js.map