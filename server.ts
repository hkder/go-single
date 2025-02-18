import express from 'express';
import * as http from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

// Define a mapping for users.
interface Users {
  [socketId: string]: string;
}
const users: Users = {};

// Serve static files from the "public" folder.
app.use(express.static('public'));

io.on('connection', (socket: Socket) => {
  console.log('New client connected: ' + socket.id);

  // Listen for the goOnline event to mark the user as online.
  socket.on('goOnline', () => {
    const username = socket.id.substring(0, 4);
    users[socket.id] = username;

    // Notify this client of its username.
    socket.emit('yourUsername', username);

    // Broadcast updated user list to all online clients.
    const userList = Object.entries(users).map(([id, username]) => ({ id, username }));
    io.emit('updateUsers', userList);
    console.log(`User ${socket.id} is now online as ${username}`);
  });

  // Listen for the goOffline event to mark the user as offline.
  socket.on('goOffline', () => {
    if (users[socket.id]) {
      console.log(`User ${socket.id} going offline`);
      delete users[socket.id];
      const updatedUserList = Object.entries(users).map(([id, username]) => ({ id, username }));
      io.emit('updateUsers', updatedUserList);
    }
  });

  // Handle other events as usual...
  socket.on('stoneMove', (data: any) => {
    console.log('Received stone move:', data);
    socket.broadcast.emit('stoneMove', data);
  });

  socket.on('syncRequest', (data: { targetId: string, boardSize: number }) => {
    console.log(`Sync request from ${socket.id} to ${data.targetId} for board size ${data.boardSize}`);
    const fromUsername = users[socket.id];
    io.to(data.targetId).emit('syncRequestReceived', { fromSocket: socket.id, fromUsername, boardSize: data.boardSize });
  });

  socket.on('syncAccept', (data: { toSocket: string, boardState: any }) => {
    console.log(`Sync accepted by ${socket.id} toward ${data.toSocket}`);
    const fromUsername = users[socket.id];
    io.to(data.toSocket).emit('syncAccepted', { fromSocket: socket.id, fromUsername, boardState: data.boardState });
  });

  socket.on(`syncFinalAck`, (data: { toSocket: string }) => {
    console.log(`Sync accepted final ack from ${socket.id} toward ${data.toSocket}`);
    const fromUsername = users[socket.id];
    io.to(data.toSocket).emit(`syncAcceptedFinalAck`, { fromSocket: socket.id, fromUsername });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected: ' + socket.id);
    if (users[socket.id]) {
      delete users[socket.id];
      const updatedUserList = Object.entries(users).map(([id, username]) => ({ id, username }));
      io.emit('updateUsers', updatedUserList);
    }
  });
});

const port = 3000;
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});