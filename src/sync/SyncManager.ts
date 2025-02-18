import { Socket } from "socket.io-client";
import { Board } from "../board/Board";
import { BoardRenderer } from "../rendering/BoardRenderer";
import { GameStorage } from "../storage/GameStorage";

export class SyncManager {
  private socket: Socket;
  private isOnline: boolean = false;
  private currentSyncTarget: string | null = null; // Target client's socket id.
  private syncButton: HTMLButtonElement;
  private modeSelect: HTMLSelectElement;
  private userListContainer: HTMLElement;
  private board: Board;
  private renderer: BoardRenderer;

  constructor(socket: Socket, board: Board, renderer: BoardRenderer) {
    this.socket = socket;
    this.board = board;
    this.renderer = renderer;

    // Assume these UI elements exist in the DOM.
    this.syncButton = document.getElementById("syncButton") as HTMLButtonElement;
    this.modeSelect = document.getElementById("modeSelect") as HTMLSelectElement;
    this.userListContainer = document.getElementById("userListContainer") as HTMLElement;

    this.initializeUI();
    this.registerSocketEvents();
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  private initializeUI(): void {
    // Toggle offline/online mode.
    this.modeSelect.addEventListener("change", () => {
      const mode = this.modeSelect.value;
      if (mode === "online") {
        this.isOnline = true;
        // Show user list and sync button.
        this.userListContainer.style.display = "block";
        this.syncButton.style.display = "inline-block";
      } else {
        this.isOnline = false;
        // Hide user list and sync button when offline.
        this.userListContainer.style.display = "none";
        this.syncButton.style.display = "none";
        this.currentSyncTarget = null;
        // Optionally, reset sync button style.
        this.syncButton.style.backgroundColor = "";
        this.syncButton.textContent = "Sync";
      }
    });

    // Immediately trigger the change event so the UI reflects the initial mode.
    this.modeSelect.dispatchEvent(new Event("change"));

    // When the sync button is clicked, send a sync request to the selected user.
    this.syncButton.addEventListener("click", () => {
      if (!this.isOnline) return;
      const selectedElem = this.userListContainer.querySelector(".selected");
      if (selectedElem) {
        const targetId = selectedElem.getAttribute("data-id");
        if (targetId) {
          // Send sync request with the current board size.
          this.socket.emit("syncRequest", { targetId, boardSize: this.board.boardSize });
          console.log("Sent sync request to", targetId);
        }
      } else {
        alert("Please select a client to sync with.");
      }
    });
  }

  private registerSocketEvents(): void {
    // Update the connected user list.
    this.socket.on("updateUsers", (users: Array<{ id: string; username: string }>) => {
      this.populateUserList(users);
    });

    // Handle an incoming sync request.
    this.socket.on("syncRequest", (data: { fromSocket: string; fromUsername: string; boardSize: number }) => {
      if (!this.isOnline) return;
      const accept = confirm(`User ${data.fromUsername} requests to sync board size ${data.boardSize}. Accept?`);
      if (accept) {
        // Create board state (a simple snapshot without encryption).
        const boardState = {
          boardSize: this.board.boardSize,
          grid: this.board.grid,
          moveHistory: this.board.moveHistory,
          currentPlayer: this.board.currentPlayer,
          blackScore: this.board.blackScore,
          whiteScore: this.board.whiteScore,
        };
        // Choose a sync color (here, "green"). This color is used to signal active sync.
        const syncColor = "green";
        this.socket.emit("syncAccept", { toSocket: data.fromSocket, boardState, boardColor: syncColor });
        // Update UI to reflect synchronization with the requester.
        this.updateSyncUI(data.fromUsername, this.board.boardSize, syncColor);
      }
    });

    // Handle sync acceptance (from a client that accepted our request).
    this.socket.on("syncAccept", (data: { fromSocket: string; boardState: any; boardColor: string }) => {
      // Update our board state with the synced board info.
      GameStorage.loadGame(data.boardState, this.board);
      this.renderer.setBoard(this.board);
      this.renderer.drawBoard();
      // Update UI to show the sync status.
      this.updateSyncUI(`Synced with ${data.fromSocket}`, data.boardState.boardSize, data.boardColor);
    });

    // (Optional) Also handle a confirmation event on the acceptor side.
    this.socket.on("syncAccepted", (data: { toSocket: string; boardColor: string }) => {
      this.updateSyncUI(`Synced with ${data.toSocket}`, this.board.boardSize, data.boardColor);
    });
  }

  // Helper: populate the user list so that a client can be selected.
  private populateUserList(users: Array<{ id: string; username: string }>): void {
    this.userListContainer.innerHTML = "";
    users.forEach((user) => {
      const userElem = document.createElement("div");
      userElem.textContent = user.username;
      userElem.setAttribute("data-id", user.id);
      userElem.style.cursor = "pointer";
      userElem.style.margin = "4px";
      userElem.addEventListener("click", () => {
        // Mark the selected user.
        this.userListContainer.querySelectorAll(".selected").forEach((el) => {
          el.classList.remove("selected");
          (el as HTMLElement).style.backgroundColor = "";
        });
        userElem.classList.add("selected");
        userElem.style.backgroundColor = "#ddd";
        this.currentSyncTarget = user.id;
      });
      this.userListContainer.appendChild(userElem);
    });
  }

  // Helper: update the sync button UI.
  private updateSyncUI(syncInfo: string, boardSize: number, color: string): void {
    this.syncButton.style.backgroundColor = color;
    this.syncButton.textContent = `Synced with ${syncInfo} on ${boardSize}x${boardSize}`;
  }
} 