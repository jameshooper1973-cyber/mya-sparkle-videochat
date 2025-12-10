const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

// Serve frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        socket.to(room).emit('ready', socket.id);
    });

    socket.on('signal', (data) => {
        socket.to(data.room).emit('signal', data);
    });
});

http.listen(PORT, () => console.log(`Server running on ${PORT}`));