import { Socket } from "socket.io-client";
import { Board } from "../board/Board";
import { BoardRenderer } from "../rendering/BoardRenderer";
import { GameStorage } from "../storage/GameStorage";
import { BoardStateManager } from "../board/BoardStateManager";

export class SyncManager {
  private socket: Socket;
  private isOnline: boolean = false;
  private currentSyncTarget: string | null = null; // Target client's socket id.
  private syncButton: HTMLButtonElement;
  private modeSelect: HTMLSelectElement;
  private userListContainer: HTMLElement;
  private usernameContainer: HTMLElement; // New element for showing username.
  private boardStateManager: BoardStateManager;
  private renderer: BoardRenderer;

  constructor(socket: Socket, boardStateManager: BoardStateManager, renderer: BoardRenderer) {
    this.socket = socket;
    this.boardStateManager = boardStateManager;
    this.renderer = renderer;

    // Assume these UI elements exist in the DOM.
    this.syncButton = document.getElementById("syncButton") as HTMLButtonElement;
    this.modeSelect = document.getElementById("modeSelect") as HTMLSelectElement;
    this.userListContainer = document.getElementById("userListContainer") as HTMLElement;
    this.usernameContainer = document.getElementById("usernameContainer") as HTMLElement; // Grab the username container.

    this.initializeUI();
    this.registerSocketEvents();
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public setCurrentBoard(board: Board): void {
    this.boardStateManager.setBoard(board);
  }

  public isConnectedTo(socketId: string): boolean {
    return this.currentSyncTarget === socketId;
  }

  public getCurrentSyncTarget(): string | null {
    return this.currentSyncTarget;
  }

  public getCurrentSyncTargetUsername(): string {
    // Username is the socket id's first 4 characters.
    if (!this.currentSyncTarget) {
      return "";
    }

    return this.currentSyncTarget.substring(0, 4);
  }

  private initializeUI(): void {
    // Listen for changes in the mode selector.
    this.modeSelect.addEventListener("change", () => {
      const mode = this.modeSelect.value;
      if (mode === "online") {
        if (!this.isOnline) {
          this.isOnline = true;
          // Notify the server that we are now online.
          this.socket.emit("goOnline");
        }
        // Show user list, sync button, and username container.
        this.userListContainer.style.display = "block";
        this.syncButton.style.display = "inline-block";
        this.usernameContainer.style.display = "block";
      } else {  // offline mode
        if (this.isOnline) {
          // Notify the server that we are going offline.
          this.socket.emit("goOffline");
        }
        this.isOnline = false;
        // Hide the user list, sync button, and username container.
        this.userListContainer.style.display = "none";
        this.syncButton.style.display = "none";
        this.usernameContainer.style.display = "none";
        this.currentSyncTarget = null;
        // Optionally reset sync button style.
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
          this.socket.emit("syncRequest", { targetId, boardSize: this.boardStateManager.getCurrentBoard().boardSize });
          console.log("Sent sync request to", targetId);
        }
      } else {
        alert("Please select a client to sync with.");
      }
    });

    // When already synced, on mouse enter, propose resync.
    this.syncButton.addEventListener("mouseenter", () => {
      if (this.currentSyncTarget !== null) {
        // Change the background to a new fancy gradient (or any color you prefer).
        this.syncButton.style.background = "linear-gradient(45deg,rgb(28, 148, 179),rgb(29, 126, 16))";
        // Change the text to prompt resync.
        this.syncButton.textContent = `Resync with ${this.getCurrentSyncTargetUsername()}?`;
      }
    });

    // When the mouse leaves, revert back to the normal synced UI.
    this.syncButton.addEventListener("mouseleave", () => {
      if (this.currentSyncTarget !== null) {
        // Retrieve the current board size and update the sync UI to its synced state.
        const boardSize = this.boardStateManager.getCurrentBoard().boardSize;
        this.updateSyncUI(this.getCurrentSyncTargetUsername(), boardSize);
      }
    });
  }

  private registerSocketEvents(): void {
    // Update the connected user list.
    this.socket.on("updateUsers", (users: Array<{ id: string; username: string }>) => {
      // Exclude ourselves from the user list.
      const filteredUsers = users.filter(user => user.id !== this.socket.id);
      this.populateUserList(filteredUsers);

      // Check if the current sync target is still online.
      if (this.currentSyncTarget && !filteredUsers.some(user => user.id === this.currentSyncTarget)) {
        // The synced target is no longer in the updated user list.
        this.currentSyncTarget = null;
        // Reset the sync button's UI.
        this.syncButton.style.backgroundColor = "";
        this.syncButton.textContent = "Sync";
        console.log("Synced user is no longer online. Resetting sync state.");
      }
    });

    // Handle an incoming sync request.
    this.socket.on("syncRequestReceived", async (data: { fromSocket: string; fromUsername: string; boardSize: number }) => {
      console.log(`Received sync request from ${data.fromUsername}`);
      if (!this.isOnline) return;
      if (this.currentSyncTarget !== null) {
        // if we are already connected only service the request if the connector is the same as the requester
        if (!this.isConnectedTo(data.fromSocket)){
          console.log("Already synced with", this.currentSyncTarget, "so don't service the request from", data.fromUsername);
          return;
        }
        else {
          console.log("Already synced with", this.currentSyncTarget, "so service the request from", data.fromUsername);
        }
      }

      // Use a custom fancy modal pop-up to get user input.
      const accept = await this.showSyncRequestModal(data);
      if (accept) {
        // Create board state (a simple snapshot without encryption).
        const boardState = {
          boardSize: this.boardStateManager.getCurrentBoard().boardSize,
          grid: this.boardStateManager.getCurrentBoard().grid,
          moveHistory: this.boardStateManager.getCurrentBoard().moveHistory,
          currentPlayer: this.boardStateManager.getCurrentBoard().currentPlayer,
          blackScore: this.boardStateManager.getCurrentBoard().blackScore,
          whiteScore: this.boardStateManager.getCurrentBoard().whiteScore,
        };

        this.socket.emit("syncAccept", { toSocket: data.fromSocket, boardState });
        console.log("Sent sync accept to", data.fromSocket);
      }
    });

    // Handle sync acceptance (from a client that accepted our request).
    this.socket.on("syncAccepted", (data: { fromSocket: string; fromUsername: string; boardState: any; }) => {
      // Update our board state with the synced board info.
      // Update the board that is cached in the renderer
      console.log("Received sync accepted from", data.fromSocket);

      // populate the board state manager with the synced board info.
      this.boardStateManager.updateBoard(data.boardState);

      // Update the board that is cached in the board state manager.
      this.boardStateManager.setCurrentBoard(data.boardState.boardSize);
      this.renderer.setBoard(this.boardStateManager.getCurrentBoard());
      this.renderer.drawBoard();
      console.log("Updated board state and renderer");

      // Update UI to show the sync status.
      this.currentSyncTarget = data.fromSocket;
      this.updateSyncUI(`${data.fromUsername}`, data.boardState.boardSize);
      this.socket.emit(`syncFinalAck`, { toSocket: data.fromSocket });
    });

    // Also handle a confirmation event on the acceptor side.
    this.socket.on("syncAcceptedFinalAck", (data: { fromSocket: string; fromUsername: string; }) => {
      console.log("Received sync final ack from", data.fromSocket);
      this.currentSyncTarget = data.fromSocket;
      this.updateSyncUI(`${data.fromUsername}`, this.boardStateManager.getCurrentBoard().boardSize);
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
      });
      this.userListContainer.appendChild(userElem);
    });
  }

  // Helper: update the sync button UI.
  private updateSyncUI(syncInfo: string, boardSize: number, color?: string): void {
    // Use the provided color or default to a fancy linear gradient.
    const fancyBackground = color || "linear-gradient(45deg, #FF8A00, #E52E71)";
    this.syncButton.style.background = fancyBackground;
    this.syncButton.textContent = `Synced with ${syncInfo} on ${boardSize}x${boardSize}`;
  }

  // New helper method for the fancy sync request modal.
  private showSyncRequestModal(data: { fromSocket: string; fromUsername: string; boardSize: number }): Promise<boolean> {
    return new Promise((resolve) => {
      // Create an overlay for the modal.
      const modalOverlay = document.createElement("div");
      modalOverlay.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

      // Create the modal content container.
      const modalContent = document.createElement("div");
      modalContent.className = "bg-white rounded shadow-lg p-6 w-96 text-center";

      // Create a message element.
      const modalText = document.createElement("p");
      modalText.className = "mb-4 text-lg";
      modalText.textContent = `User ${data.fromUsername} requests to sync board size ${data.boardSize} Accept?`;

      // Create a container for the buttons.
      const buttonContainer = document.createElement("div");
      buttonContainer.className = "flex justify-around";

      // Create the 'Accept' button.
      const acceptButton = document.createElement("button");
      acceptButton.className = "bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600";
      acceptButton.textContent = "Accept";
      acceptButton.addEventListener("click", () => {
        document.body.removeChild(modalOverlay);
        resolve(true);
      });

      // Create the 'Decline' button.
      const declineButton = document.createElement("button");
      declineButton.className = "bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600";
      declineButton.textContent = "Decline";
      declineButton.addEventListener("click", () => {
        document.body.removeChild(modalOverlay);
        resolve(false);
      });

      // Append buttons to the container.
      buttonContainer.appendChild(acceptButton);
      buttonContainer.appendChild(declineButton);

      // Append the message and button container to the modal content.
      modalContent.appendChild(modalText);
      modalContent.appendChild(buttonContainer);

      // Append the modal content to the overlay.
      modalOverlay.appendChild(modalContent);

      // Add the modal overlay to the body.
      document.body.appendChild(modalOverlay);
    });
  }
} 