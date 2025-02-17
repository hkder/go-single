// ---------------------------------------------------------------
// Go Game
// ---------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
var Stone;
(function (Stone) {
    Stone["Black"] = "black";
    Stone["White"] = "white";
})(Stone || (Stone = {}));
var boardSize = 19; // Board size can be 9, 13, or 19
var board = [];
var currentPlayer = Stone.Black;
var blackScore = 0;
var whiteScore = 0;
var moveHistory = [];
// Global object to preserve game state for each board size.
var savedGameStates = {};
// Toggle for displaying the stone order.
var showStoneOrder = false;
var canvas = document.getElementById("goCanvas");
var ctx = canvas.getContext("2d");
// Predefined passphrase used for encryption/decryption.
var PREDEFINED_PASSWORD = "mySecretPassword123";
// Global variable to hold the index of a saved game pending deletion.
var savedGameIndexToDelete = null;
var defaultBoard = { size: 19 };
function getStoredBoard() {
    var stored = localStorage.getItem("selectedBoard");
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
        var state = savedGameStates[boardSize];
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
    var storedBoard = getStoredBoard();
    var boardConfig = storedBoard || defaultBoard;
    document.getElementById("boardSizeSelect").value = boardConfig.size.toString();
    createBoard(boardConfig);
}
function getMargin() {
    return canvas.width / (boardSize + 1);
}
function initBoard() {
    board = [];
    moveHistory = [];
    for (var i = 0; i < boardSize; i++) {
        board[i] = [];
        for (var j = 0; j < boardSize; j++) {
            board[i][j] = null;
        }
    }
}
// ---------------------------------------------------------------
// DRAWING FUNCTIONS
// ---------------------------------------------------------------
function drawBoard() {
    var margin = getMargin();
    var cellSize = (canvas.width - 2 * margin) / (boardSize - 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f5deb3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";
    for (var i = 0; i < boardSize; i++) {
        var pos = margin + i * cellSize;
        ctx.beginPath();
        ctx.moveTo(pos, margin);
        ctx.lineTo(pos, canvas.height - margin);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(margin, pos);
        ctx.lineTo(canvas.width - margin, pos);
        ctx.stroke();
    }
    for (var i = 0; i < boardSize; i++) {
        for (var j = 0; j < boardSize; j++) {
            if (board[i][j] !== null) {
                drawStone(i, j, board[i][j]);
            }
        }
    }
    // If toggled, overlay the stone order (from moveHistory) on each stone.
    if (showStoneOrder) {
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (var order = 0; order < moveHistory.length; order++) {
            var move = moveHistory[order];
            // Only draw order if the stone is still present.
            if (board[move.i][move.j] === move.stone) {
                var x = margin + move.i * cellSize;
                var y = margin + move.j * cellSize;
                ctx.fillStyle = move.stone === Stone.Black ? "white" : "black";
                ctx.fillText((order + 1).toString(), x, y);
            }
        }
    }
}
function drawStone(i, j, stone) {
    var margin = getMargin();
    var cellSize = (canvas.width - 2 * margin) / (boardSize - 1);
    var x = margin + i * cellSize;
    var y = margin + j * cellSize;
    var radius = cellSize / 2 - 2;
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
// ---------------------------------------------------------------
// MOVE LOGIC & INTERACTIONS
// ---------------------------------------------------------------
function getNeighbors(i, j) {
    var neighbors = [];
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
    var visited = new Set();
    var stack = [[i, j]];
    while (stack.length > 0) {
        var _a = stack.pop(), ci = _a[0], cj = _a[1];
        var key = "".concat(ci, ",").concat(cj);
        if (visited.has(key))
            continue;
        visited.add(key);
        var neighbors = getNeighbors(ci, cj);
        for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
            var _b = neighbors_1[_i], ni = _b[0], nj = _b[1];
            if (board[ni][nj] === null)
                return true;
            if (board[ni][nj] === stone && !visited.has("".concat(ni, ",").concat(nj))) {
                stack.push([ni, nj]);
            }
        }
    }
    return false;
}
function captureStones(i, j, stone) {
    var opponent = stone === Stone.Black ? Stone.White : Stone.Black;
    var neighbors = getNeighbors(i, j);
    for (var _i = 0, neighbors_2 = neighbors; _i < neighbors_2.length; _i++) {
        var _a = neighbors_2[_i], ni = _a[0], nj = _a[1];
        if (board[ni][nj] === opponent) {
            if (!groupHasLiberty(ni, nj, opponent)) {
                var removedCount = removeGroup(ni, nj, opponent);
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
    var visited = new Set();
    var stack = [[i, j]];
    var removedCount = 0;
    while (stack.length > 0) {
        var _a = stack.pop(), ci = _a[0], cj = _a[1];
        var key = "".concat(ci, ",").concat(cj);
        if (visited.has(key))
            continue;
        visited.add(key);
        if (board[ci][cj] !== null) {
            board[ci][cj] = null;
            removedCount++;
        }
        var neighbors = getNeighbors(ci, cj);
        for (var _i = 0, neighbors_3 = neighbors; _i < neighbors_3.length; _i++) {
            var _b = neighbors_3[_i], ni = _b[0], nj = _b[1];
            if (board[ni][nj] === stone && !visited.has("".concat(ni, ",").concat(nj))) {
                stack.push([ni, nj]);
            }
        }
    }
    return removedCount;
}
// Connect to the Socket.IO server (assumes same host/port as served page).
var socket = io();
// Sample function to broadcast a stone move.
function broadcastStoneMove(i, j, stone) {
    // Prepare move data.
    var moveData = {
        i: i,
        j: j,
        stone: stone,
        // Toggle the turn for broadcast.
        currentPlayer: stone === Stone.Black ? Stone.White : Stone.Black
    };
    socket.emit('stoneMove', moveData);
}
// Listen for stone moves broadcasted from other clients.
socket.on('stoneMove', function (moveData) {
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
socket.on('yourUsername', function (username) {
    var myUsernameEl = document.getElementById("myUsername");
    if (myUsernameEl) {
        myUsernameEl.textContent = username;
    }
});
// Listen for updates to the connected users list.
socket.on('updateUsers', function (userList) {
    var userListEl = document.getElementById("userList");
    if (userListEl) {
        userListEl.innerHTML = "";
        userList.forEach(function (username) {
            var li = document.createElement("li");
            li.textContent = username;
            userListEl.appendChild(li);
        });
    }
});
// Example: Adding a click handler to the canvas to place a stone locally
canvas.addEventListener("click", function (event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var margin = getMargin();
    var cellSize = (canvas.width - 2 * margin) / (boardSize - 1);
    // Calculate board coordinate indices (round to nearest integer).
    var i = Math.round((x - margin) / cellSize);
    var j = Math.round((y - margin) / cellSize);
    // Ensure the click is within board bounds.
    if (i < 0 || i >= boardSize || j < 0 || j >= boardSize)
        return;
    // Only place a stone if the cell is empty.
    if (board[i][j] === null) {
        board[i][j] = currentPlayer;
        moveHistory.push({ i: i, j: j, stone: currentPlayer });
        // Toggle the turn.
        currentPlayer = currentPlayer === Stone.Black ? Stone.White : Stone.Black;
        drawBoard();
        updateScoreBoard();
        broadcastStoneMove(i, j, board[i][j]);
    }
});
// When the board size changes, save the current state and restore a previous state (if any).
document.getElementById("boardSizeSelect").addEventListener("change", function () {
    var newBoardSize = parseInt(document.getElementById("boardSizeSelect").value);
    // Save current state
    savedGameStates[boardSize] = {
        board: board,
        moveHistory: moveHistory,
        currentPlayer: currentPlayer,
        blackScore: blackScore,
        whiteScore: whiteScore
    };
    var newConfig = { size: newBoardSize };
    selectBoard(newConfig);
});
// ---------------------------------------------------------------
// SAVE/LOAD/EXPORT/IMPORT FUNCTIONS
// ---------------------------------------------------------------
function saveGame() {
    var timestamp = new Date().toISOString();
    var gameState = {
        name: "Go ".concat(boardSize, "x").concat(boardSize, " - ").concat(new Date().toLocaleString()),
        boardSize: boardSize,
        board: board,
        currentPlayer: currentPlayer,
        blackScore: blackScore,
        whiteScore: whiteScore,
        moveHistory: moveHistory,
        timestamp: timestamp
    };
    var savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
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
    var savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
    savedGames.splice(index, 1);
    localStorage.setItem("goSavedGames", JSON.stringify(savedGames));
    populateSavedGames();
}
function populateSavedGames() {
    var savedGamesContainer = document.getElementById("savedGames");
    savedGamesContainer.innerHTML = "";
    var savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
    savedGames.forEach(function (game, index) {
        var btn = document.createElement("button");
        btn.textContent = game.name ? game.name : "Saved Game ".concat(index + 1);
        btn.style.width = "100%";
        btn.addEventListener("click", function () { return loadGame(game); });
        btn.addEventListener("contextmenu", function (event) {
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
    var modal = document.getElementById("deleteModal");
    modal.classList.remove("hidden");
}
function hideDeleteModal() {
    var modal = document.getElementById("deleteModal");
    modal.classList.add("hidden");
}
document.getElementById("confirmDelete").addEventListener("click", function () {
    if (savedGameIndexToDelete !== null) {
        deleteSavedGame(savedGameIndexToDelete);
        savedGameIndexToDelete = null;
        hideDeleteModal();
    }
});
document.getElementById("cancelDelete").addEventListener("click", function () {
    savedGameIndexToDelete = null;
    hideDeleteModal();
});
document.getElementById("saveGameBtn").addEventListener("click", saveGame);
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
document.getElementById("clearGameBtn").addEventListener("click", clearGameState);
// ---------------------------------------------------------------
// TOGGLE MOVE ORDER FUNCTIONALITY
// ---------------------------------------------------------------
function toggleMoveOrder() {
    showStoneOrder = !showStoneOrder;
    drawBoard();
}
document.getElementById("toggleOrderBtn").addEventListener("click", toggleMoveOrder);
// ---------------------------------------------------------------
// ENCRYPTION UTILS (AES-GCM with PBKDF2)
// ---------------------------------------------------------------
function arrayBufferToBase64(buffer) {
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
function base64ToArrayBuffer(base64) {
    var binary = window.atob(base64);
    var len = binary.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
function encryptData(plaintext, passphrase) {
    return __awaiter(this, void 0, void 0, function () {
        var encoder, salt, iv, keyMaterial, key, ciphertextBuffer, encryptedObject;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    encoder = new TextEncoder();
                    salt = crypto.getRandomValues(new Uint8Array(16));
                    iv = crypto.getRandomValues(new Uint8Array(12));
                    return [4 /*yield*/, crypto.subtle.importKey("raw", encoder.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"])];
                case 1:
                    keyMaterial = _a.sent();
                    return [4 /*yield*/, crypto.subtle.deriveKey({
                            name: "PBKDF2",
                            salt: salt,
                            iterations: 100000,
                            hash: "SHA-256"
                        }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])];
                case 2:
                    key = _a.sent();
                    return [4 /*yield*/, crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, encoder.encode(plaintext))];
                case 3:
                    ciphertextBuffer = _a.sent();
                    encryptedObject = {
                        salt: arrayBufferToBase64(salt.buffer),
                        iv: arrayBufferToBase64(iv.buffer),
                        ciphertext: arrayBufferToBase64(ciphertextBuffer)
                    };
                    return [2 /*return*/, JSON.stringify(encryptedObject)];
            }
        });
    });
}
function decryptData(encryptedStr, passphrase) {
    return __awaiter(this, void 0, void 0, function () {
        var encoder, decoder, encryptedObject, salt, iv, ciphertext, keyMaterial, key, decryptedBuffer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    encoder = new TextEncoder();
                    decoder = new TextDecoder();
                    encryptedObject = JSON.parse(encryptedStr);
                    salt = new Uint8Array(base64ToArrayBuffer(encryptedObject.salt));
                    iv = new Uint8Array(base64ToArrayBuffer(encryptedObject.iv));
                    ciphertext = base64ToArrayBuffer(encryptedObject.ciphertext);
                    return [4 /*yield*/, crypto.subtle.importKey("raw", encoder.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"])];
                case 1:
                    keyMaterial = _a.sent();
                    return [4 /*yield*/, crypto.subtle.deriveKey({
                            name: "PBKDF2",
                            salt: salt,
                            iterations: 100000,
                            hash: "SHA-256"
                        }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])];
                case 2:
                    key = _a.sent();
                    return [4 /*yield*/, crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext)];
                case 3:
                    decryptedBuffer = _a.sent();
                    return [2 /*return*/, decoder.decode(decryptedBuffer)];
            }
        });
    });
}
// ---------------------------------------------------------------
// EXPORT / IMPORT FROM LOCAL FILE
// ---------------------------------------------------------------
function exportGameToFile() {
    return __awaiter(this, void 0, void 0, function () {
        var passphrase, timestamp, gameState, jsonString, encryptedData, blob, url, a, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    passphrase = PREDEFINED_PASSWORD;
                    timestamp = new Date().toISOString();
                    gameState = {
                        name: "Go ".concat(boardSize, "x").concat(boardSize, " - ").concat(new Date().toLocaleString()),
                        boardSize: boardSize,
                        board: board,
                        currentPlayer: currentPlayer,
                        blackScore: blackScore,
                        whiteScore: whiteScore,
                        moveHistory: moveHistory,
                        timestamp: timestamp
                    };
                    jsonString = JSON.stringify(gameState, null, 2);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, encryptData(jsonString, passphrase)];
                case 2:
                    encryptedData = _a.sent();
                    blob = new Blob([encryptedData], { type: "application/json" });
                    url = URL.createObjectURL(blob);
                    a = document.createElement("a");
                    a.href = url;
                    a.download = "go_game_".concat(boardSize, "x").concat(boardSize, "_").concat(timestamp, ".enc.json");
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    alert("Error encrypting game state: " + err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function importGameFromFile(file) {
    return __awaiter(this, void 0, void 0, function () {
        var reader;
        var _this = this;
        return __generator(this, function (_a) {
            reader = new FileReader();
            reader.onload = function (e) { return __awaiter(_this, void 0, void 0, function () {
                var encryptedContent, decryptedContent, gameState, savedGames, err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            encryptedContent = e.target.result;
                            return [4 /*yield*/, decryptData(encryptedContent, PREDEFINED_PASSWORD)];
                        case 1:
                            decryptedContent = _a.sent();
                            gameState = JSON.parse(decryptedContent);
                            savedGames = JSON.parse(localStorage.getItem("goSavedGames") || "[]");
                            savedGames.push(gameState);
                            localStorage.setItem("goSavedGames", JSON.stringify(savedGames));
                            populateSavedGames();
                            loadGame(gameState);
                            return [3 /*break*/, 3];
                        case 2:
                            err_2 = _a.sent();
                            alert("Error loading or decrypting game file.");
                            console.error(err_2);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            reader.readAsText(file);
            return [2 /*return*/];
        });
    });
}
(_a = document.getElementById("exportGameBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", exportGameToFile);
(_b = document.getElementById("importGameInput")) === null || _b === void 0 ? void 0 : _b.addEventListener("change", function (e) {
    var files = e.target.files;
    if (files && files.length > 0) {
        importGameFromFile(files[0]);
    }
});
// ---------------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------------
initializeBoard();
populateSavedGames();
