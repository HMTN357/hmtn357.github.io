const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store job posts and chats
let jobPosts = [];
let chats = {};

app.use(express.json());
app.use(express.static('public'));

// API to create job post
app.post('/api/jobs', (req, res) => {
  const { name, age, skills, rate } = req.body;

  if (age > 12 || rate > 10) {
    return res.status(400).send('Invalid job post data.');
  }

  const job = { id: Date.now(), name, age, skills, rate };
  jobPosts.push(job);
  res.status(201).send(job);
});

// WebSocket for chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('startChat', ({ jobId, user }) => {
    if (!chats[jobId]) {
      chats[jobId] = [];
    }
    socket.join(jobId);
    socket.to(jobId).emit('userJoined', { user });
  });

  socket.on('sendMessage', ({ jobId, message }) => {
    if (!chats[jobId]) return;
    chats[jobId].push(message);
    io.in(jobId).emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
