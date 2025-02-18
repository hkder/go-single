// src/networking/SocketClient.ts
import { io, Socket } from "socket.io-client";
import { Stone } from "../board/Board";

export interface StoneMove {
  boardSize: number;
  i: number;
  j: number;
  stone: Stone;
  currentPlayer: Stone;
}

export class SocketClient {
  private socket: Socket;
  // Callback to notify when a stone move is received from the network.
  public onStoneMove: ((move: StoneMove) => void) | null = null;

  constructor() {
    // Create the socket connection (pass URL/options if needed).
    this.socket = io();
    this.registerListeners();
  }

  public getSocket(): Socket {
    return this.socket;
  }

  private registerListeners(): void {
    this.socket.on("stoneMove", (moveData: StoneMove) => {
      console.log("Received move via network:", moveData);
      if (this.onStoneMove) {
        this.onStoneMove(moveData);
      }
    });

    this.socket.on("yourUsername", (username: string) => {
      const myUsernameEl = document.getElementById("myUsername");
      if (myUsernameEl) {
        myUsernameEl.textContent = username;
      }
    });
  }

  public broadcastStoneMove(i: number, j: number, stone: Stone, nextPlayer: Stone, boardSize: number): void {
    const moveData: StoneMove = { boardSize, i, j, stone, currentPlayer: nextPlayer };
    this.socket.emit("stoneMove", moveData);
  }
}
