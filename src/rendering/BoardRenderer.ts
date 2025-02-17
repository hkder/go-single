import { GoBoard, Stone } from "../board/GoBoard";

export class BoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private board: GoBoard;

  constructor(canvasId: string, board: GoBoard) {
    const canvasEl = document.getElementById(canvasId) as HTMLCanvasElement;
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext("2d")!;
    this.board = board;
  }

  private getMargin(): number {
    return this.canvas.width / (this.board.boardSize + 1);
  }

  drawBoard(): void {
    const margin = this.getMargin();
    const cellSize = (this.canvas.width - 2 * margin) / (this.board.boardSize - 1);
    
    // Clear canvas and draw background
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#f5deb3";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid lines
    this.ctx.strokeStyle = "#000";
    for (let i = 0; i < this.board.boardSize; i++) {
      const pos = margin + i * cellSize;
      // Vertical line
      this.ctx.beginPath();
      this.ctx.moveTo(pos, margin);
      this.ctx.lineTo(pos, this.canvas.height - margin);
      this.ctx.stroke();
      // Horizontal line
      this.ctx.beginPath();
      this.ctx.moveTo(margin, pos);
      this.ctx.lineTo(this.canvas.width - margin, pos);
      this.ctx.stroke();
    }

    // Draw stones
    for (let i = 0; i < this.board.boardSize; i++) {
      for (let j = 0; j < this.board.boardSize; j++) {
        const stone = this.board.board[i][j];
        if (stone !== null) {
          this.drawStone(i, j, stone, cellSize, margin);
        }
      }
    }
  }

  private drawStone(i: number, j: number, stone: Stone, cellSize: number, margin: number): void {
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