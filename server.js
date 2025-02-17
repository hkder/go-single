const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let users = {};

// Serve static files from the "public" folder.
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected: ' + socket.id);
  // Assign a temporary username.
  const username = 'User_' + socket.id.substring(0, 4);
  users[socket.id] = username;
  
  // Notify this client of its username.
  socket.emit('yourUsername', username);
  // Broadcast updated user list to all clients.
  io.emit('updateUsers', Object.values(users));

  // Handle stone moves as before.
  socket.on('stoneMove', (data) => {
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
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});