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
    this.ctx.fillStyle = "#f5deb3"; // Wooden board color.
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

    // Draw star points (hoshi) for standard board sizes.
    this.drawStarPoints();

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

  /**
   * Draw star points (hoshi) on standard board sizes (9, 13, or 19).
   */
  private drawStarPoints(): void {
    const boardSize = this.board.boardSize;
    if (boardSize !== 9 && boardSize !== 13 && boardSize !== 19) {
      return;
    }
    const margin = this.getMargin();
    const cellSize =
      (this.canvas.width - 2 * margin) / (this.board.boardSize - 1);

    let points: { i: number; j: number }[] = [];
    if (boardSize === 19) {
      points = [
        { i: 3, j: 3 },
        { i: 3, j: 9 },
        { i: 3, j: 15 },
        { i: 9, j: 3 },
        { i: 9, j: 15 },
        { i: 15, j: 3 },
        { i: 15, j: 9 },
        { i: 15, j: 15 },
      ];
    } else if (boardSize === 13) {
      points = [
        { i: 3, j: 3 },
        { i: 3, j: 9 },
        { i: 9, j: 3 },
        { i: 9, j: 9 },
      ];
    } else if (boardSize === 9) {
      points = [
        { i: 2, j: 2 },
        { i: 2, j: 6 },
        { i: 6, j: 2 },
        { i: 6, j: 6 },
      ];
    }

    this.ctx.fillStyle = "#000";
    points.forEach(point => {
      const x = margin + point.i * cellSize;
      const y = margin + point.j * cellSize;
      const radius = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
      this.ctx.fill();
    });
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
    // Optionally add a radial gradient for a more realistic stone appearance.
    if (stone === Stone.Black) {
      this.ctx.fillStyle = "#000";
    } else {
      this.ctx.fillStyle = "#fff";
    }
    this.ctx.fill();
    this.ctx.strokeStyle = "#000";
    this.ctx.stroke();
  }
}
