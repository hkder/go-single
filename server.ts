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
  // Assign a temporary username.
  const username = 'User_' + socket.id.substring(0, 4);
  users[socket.id] = username;
  
  // Notify this client of its username.
  socket.emit('yourUsername', username);
  
  // Broadcast updated user list to all clients (each entry now includes socket id).
  const userList = Object.entries(users).map(([id, username]) => ({ id, username }));
  io.emit('updateUsers', userList);

  // Handle stone moves.
  socket.on('stoneMove', (data: any) => {
    console.log('Received stone move:', data);
    // Broadcast the stone move to all other clients.
    socket.broadcast.emit('stoneMove', data);
  });

  // Handle sync requests.
  socket.on('syncRequest', (data: { targetId: string, boardSize: number }) => {
    console.log(`Sync request from ${socket.id} to ${data.targetId} for board size ${data.boardSize}`);
    const fromUsername = users[socket.id];
    // Forward the sync request to the chosen target.
    io.to(data.targetId).emit('syncRequest', { fromSocket: socket.id, fromUsername, boardSize: data.boardSize });
  });

  // Handle sync acceptance (including board information and chosen sync color).
  socket.on('syncAccept', (data: { toSocket: string, boardState: any, boardColor: string }) => {
    console.log(`Sync accepted by ${socket.id} toward ${data.toSocket}`);
    // Forward the accepted sync info (board info and color) to the original requester.
    io.to(data.toSocket).emit('syncAccept', { fromSocket: socket.id, boardState: data.boardState, boardColor: data.boardColor });
    // Also notify the accepting client about the sync.
    socket.emit('syncAccepted', { toSocket: data.toSocket, boardColor: data.boardColor });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected: ' + socket.id);
    delete users[socket.id];
    const updatedUserList = Object.entries(users).map(([id, username]) => ({ id, username }));
    io.emit('updateUsers', updatedUserList);
  });
});

const port = 3000;
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});