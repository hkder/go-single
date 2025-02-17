"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketClient = void 0;
const socket_io_client_1 = require("socket.io-client");
class SocketClient {
    constructor() {
        this.socket = (0, socket_io_client_1.io)();
        this.registerListeners();
    }
    registerListeners() {
        this.socket.on("stoneMove", (moveData) => {
            console.log("Received move via network:", moveData);
        });
        this.socket.on("yourUsername", (username) => {
            const myUsernameEl = document.getElementById("myUsername");
            if (myUsernameEl) {
                myUsernameEl.textContent = username;
            }
        });
        this.socket.on("updateUsers", (userList) => {
            const userListEl = document.getElementById("userList");
            if (userListEl) {
                userListEl.innerHTML = "";
                userList.forEach((username) => {
                    const li = document.createElement("li");
                    li.textContent = username;
                    userListEl.appendChild(li);
                });
            }
        });
    }
    broadcastStoneMove(i, j, stone, nextPlayer) {
        const moveData = { i, j, stone, currentPlayer: nextPlayer };
        this.socket.emit("stoneMove", moveData);
    }
}
exports.SocketClient = SocketClient;
//# sourceMappingURL=SocketClient.js.map