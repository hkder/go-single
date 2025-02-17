import { GoBoard, Stone } from "./board/GoBoard";
import { BoardRenderer } from "./rendering/BoardRenderer";
import { SocketClient } from "./networking/SocketClient";
// Import additional modules like GameStorage and CryptoUtils as needed

// Initialize board logic
const board = new GoBoard(19);

// Initialize renderer
const renderer = new BoardRenderer("goCanvas", board);
renderer.drawBoard();

// Initialize network client
const socketClient = new SocketClient();

// Example: Adding a click handler to the canvas to place a stone.
const canvas = document.getElementById("goCanvas") as HTMLCanvasElement;
canvas.addEventListener("click", (event: MouseEvent) => {
  // Calculate board coordinates based on your rendering logic...
  const rect = canvas.getBoundingClientRect();
  const margin = canvas.width / (board.boardSize + 1);
  const cellSize = (canvas.width - 2 * margin) / (board.boardSize - 1);
  const i = Math.round((event.clientX - rect.left - margin) / cellSize);
  const j = Math.round((event.clientY - rect.top - margin) / cellSize);

  if (board.placeStone(i, j)) {
    renderer.drawBoard();
    // Broadcast the move to other players
    const nextPlayer = board.currentPlayer;
    socketClient.broadcastStoneMove(i, j, board.board[i][j] as Stone, nextPlayer);
  }
});