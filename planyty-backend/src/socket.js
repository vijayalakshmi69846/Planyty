const socketIO = require('socket.io');
const setupChannelCleanupJob = require('./socket.controller').setupChannelCleanupJob;
setupChannelCleanupJob();
const initSocket = (server) => {
  const io = socketIO(server, {
    cors: { origin: "http://localhost:5173", credentials: true }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a specific room (Channel ID or Team ID)
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    });

    // Handle sending message
    socket.on('send_message', (data) => {
      // Broadcast to everyone in the room INCLUDING the sender
      io.to(data.roomId).emit('receive_message', data);
    });

    // Handle reactions
    socket.on('send_reaction', (data) => {
      io.to(data.roomId).emit('receive_reaction', data);
    });

    // Handle message deletion
    socket.on('delete_message', (data) => {
      io.to(data.roomId).emit('message_deleted', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io;
};

module.exports = initSocket;