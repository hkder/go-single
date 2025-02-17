"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoBoard = exports.Stone = void 0;
var Stone;
(function (Stone) {
    Stone["Black"] = "black";
    Stone["White"] = "white";
})(Stone || (exports.Stone = Stone = {}));
class GoBoard {
    constructor(boardSize = 19) {
        this.board = [];
        this.moveHistory = [];
        this.currentPlayer = Stone.Black;
        this.blackScore = 0;
        this.whiteScore = 0;
        this.boardSize = boardSize;
        this.initBoard();
    }
    initBoard() {
        this.board = [];
        this.moveHistory = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = null;
            }
        }
    }
    placeStone(i, j) {
        if (i < 0 || i >= this.boardSize || j < 0 || j >= this.boardSize)
            return false;
        if (this.board[i][j] !== null)
            return false;
        this.board[i][j] = this.currentPlayer;
        this.moveHistory.push({ i, j, stone: this.currentPlayer });
        this.captureStones(i, j);
        this.currentPlayer = this.currentPlayer === Stone.Black ? Stone.White : Stone.Black;
        return true;
    }
    captureStones(i, j) {
    }
}
exports.GoBoard = GoBoard;
//# sourceMappingURL=GoBoard.js.map