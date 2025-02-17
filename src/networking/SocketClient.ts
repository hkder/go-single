import { io, Socket } from "socket.io-client";
import { Stone } from "../board/GoBoard";

interface StoneMove {
  i: number;
  j: number;
  stone: Stone;
  currentPlayer: Stone;
}

export class SocketClient {
  private socket: Socket;

  constructor() {
    // Now we're importing io correctly from the 'socket.io-client' package.
    this.socket = io(); // You can pass options or a URL if necessary.
    this.registerListeners();
  }

  private registerListeners(): void {
    this.socket.on("stoneMove", (moveData: StoneMove) => {
      console.log("Received move via network:", moveData);
      // You can add a callback or event emitter here to handle an incoming move.
    });

    this.socket.on("yourUsername", (username: string) => {
      const myUsernameEl = document.getElementById("myUsername");
      if (myUsernameEl) {
        myUsernameEl.textContent = username;
      }
    });

    this.socket.on("updateUsers", (userList: string[]) => {
      const userListEl = document.getElementById("userList");
      if (userListEl) {
        userListEl.innerHTML = "";
        userList.forEach((username: string) => {
          const li = document.createElement("li");
          li.textContent = username;
          userListEl.appendChild(li);
        });
      }
    });
  }

  broadcastStoneMove(i: number, j: number, stone: Stone, nextPlayer: Stone): void {
    const moveData = { i, j, stone, currentPlayer: nextPlayer };
    this.socket.emit("stoneMove", moveData);
  }
}