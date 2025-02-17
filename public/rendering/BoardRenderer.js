"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardRenderer = void 0;
const GoBoard_1 = require("../board/GoBoard");
class BoardRenderer {
    constructor(canvasId, board) {
        const canvasEl = document.getElementById(canvasId);
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext("2d");
        this.board = board;
    }
    getMargin() {
        return this.canvas.width / (this.board.boardSize + 1);
    }
    drawBoard() {
        const margin = this.getMargin();
        const cellSize = (this.canvas.width - 2 * margin) / (this.board.boardSize - 1);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#f5deb3";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = "#000";
        for (let i = 0; i < this.board.boardSize; i++) {
            const pos = margin + i * cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, margin);
            this.ctx.lineTo(pos, this.canvas.height - margin);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(margin, pos);
            this.ctx.lineTo(this.canvas.width - margin, pos);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.board.boardSize; i++) {
            for (let j = 0; j < this.board.boardSize; j++) {
                const stone = this.board.board[i][j];
                if (stone !== null) {
                    this.drawStone(i, j, stone, cellSize, margin);
                }
            }
        }
    }
    drawStone(i, j, stone, cellSize, margin) {
        const x = margin + i * cellSize;
        const y = margin + j * cellSize;
        const radius = cellSize / 2 - 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = stone === GoBoard_1.Stone.Black ? "#000" : "#fff";
        this.ctx.fill();
        this.ctx.strokeStyle = "#000";
        this.ctx.stroke();
    }
}
exports.BoardRenderer = BoardRenderer;
//# sourceMappingURL=BoardRenderer.js.map