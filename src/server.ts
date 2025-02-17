import express from 'express';
import * as http from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

// Define a type for our user mapping.
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
  // Broadcast updated user list to all clients.
  io.emit('updateUsers', Object.values(users));

  // Handle stone moves.
  socket.on('stoneMove', (data: any) => {
    console.log('Received stone move:', data);
    // Broadcast the stone move to all other clients.
    socket.broadcast.emit('stoneMove', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected: ' + socket.id);
    // Remove the user and update others.
    delete users[socket.id];
    io.emit('updateUsers', Object.values(users));
  });
});

const port = 3000;
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});