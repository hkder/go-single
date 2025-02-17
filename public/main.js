"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GoBoard_1 = require("./board/GoBoard");
const BoardRenderer_1 = require("./rendering/BoardRenderer");
const SocketClient_1 = require("./networking/SocketClient");
const board = new GoBoard_1.GoBoard(19);
const renderer = new BoardRenderer_1.BoardRenderer("goCanvas", board);
renderer.drawBoard();
const socketClient = new SocketClient_1.SocketClient();
const canvas = document.getElementById("goCanvas");
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const margin = canvas.width / (board.boardSize + 1);
    const cellSize = (canvas.width - 2 * margin) / (board.boardSize - 1);
    const i = Math.round((event.clientX - rect.left - margin) / cellSize);
    const j = Math.round((event.clientY - rect.top - margin) / cellSize);
    if (board.placeStone(i, j)) {
        renderer.drawBoard();
        const nextPlayer = board.currentPlayer;
        socketClient.broadcastStoneMove(i, j, board.board[i][j], nextPlayer);
    }
});
//# sourceMappingURL=main.js.map