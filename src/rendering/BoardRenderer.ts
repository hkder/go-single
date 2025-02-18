// src/BoardRenderer.ts
import { Board, Stone } from "../board/Board";

export class BoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private board: Board;
  public showStoneOrder: boolean = false;

  constructor(canvas: HTMLCanvasElement, board: Board) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get 2D context from canvas");
    }
    this.ctx = ctx;
    this.board = board;
  }

  public setBoard(newBoard: Board): void {
    this.board = newBoard;

    // Update the board size selector in the UI to match the board dimensions.
    const boardSizeSelect = document.getElementById("boardSizeSelect") as HTMLSelectElement;
    if (boardSizeSelect) {
      boardSizeSelect.value = this.board.boardSize.toString();
    }
  }

  private getMargin(): number {
    return this.canvas.width / (this.board.boardSize + 1);
  }

  public drawBoard(): void {
    const margin = this.getMargin();
    const cellSize =
      (this.canvas.width - 2 * margin) / (this.board.boardSize - 1);

    // Clear and draw background.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#f5deb3";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid lines.
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

    // Draw stones.
    for (let i = 0; i < this.board.boardSize; i++) {
      for (let j = 0; j < this.board.boardSize; j++) {
        const stone = this.board.grid[i][j];
        if (stone !== null) {
          this.drawStone(i, j, stone);
        }
      }
    }

    // If toggled, overlay the move order.
    if (this.showStoneOrder) {
      this.ctx.font = "bold 16px sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      for (let order = 0; order < this.board.moveHistory.length; order++) {
        const move = this.board.moveHistory[order];
        // Only overlay if the stone is still present.
        if (this.board.grid[move.i][move.j] === move.stone) {
          const x = margin + move.i * cellSize;
          const y = margin + move.j * cellSize;
          this.ctx.fillStyle = move.stone === Stone.Black ? "white" : "black";
          this.ctx.fillText((order + 1).toString(), x, y);
        }
      }
    }
  }

  private drawStone(i: number, j: number, stone: Stone): void {
    const margin = this.getMargin();
    const cellSize =
      (this.canvas.width - 2 * margin) / (this.board.boardSize - 1);
    const x = margin + i * cellSize;
    const y = margin + j * cellSize;
    const radius = cellSize / 2 - 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = stone === Stone.Black ? "#000" : "#fff";
    this.ctx.fill();
    this.ctx.strokeStyle = "#000";
    this.ctx.stroke();
  }
}
