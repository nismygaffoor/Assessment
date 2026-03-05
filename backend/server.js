const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Make io accessible to controllers
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Collaborative Note-Taking API is running...');
});

// Socket.io — real-time collaboration
io.on('connection', (socket) => {
    // Join a note room
    socket.on('join-note', ({ noteId, token }) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.user.id;
            socket.join(`note:${noteId}`);
            socket.to(`note:${noteId}`).emit('user-joined', { userId: decoded.user.id });
        } catch (err) {
            socket.disconnect();
        }
    });

    // Broadcast note content changes to all others in the room
    socket.on('note-change', ({ noteId, content, title }) => {
        socket.to(`note:${noteId}`).emit('note-update', { content, title, from: socket.userId });
    });

    // Leave note room
    socket.on('leave-note', ({ noteId }) => {
        socket.leave(`note:${noteId}`);
        socket.to(`note:${noteId}`).emit('user-left', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
        // cleanup handled automatically by socket.io
    });
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB.');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });
