// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User and Chat schemas
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  image: String,
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  socketId: String
});

const messageSchema = new mongoose.Schema({
  text: String,
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  timestamp: { type: Date, default: Date.now },
  edited: { type: Boolean, default: false },
  editedAt: Date,
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
});

const chatSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: String,
  lastMessageTimestamp: { type: Date, default: Date.now },
  lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isGroup: { type: Boolean, default: false },
  groupName: String,
  groupImage: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Chat = mongoose.model('Chat', chatSchema);

// In-memory storage for active connections and typing
const activeUsers = new Map(); // socketId -> user data
const userSockets = new Map(); // userId -> socketId
const typingUsers = new Map(); // chatId -> Set of userIds
const chatRooms = new Map(); // chatId -> Set of socketIds

// JWT Authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-__v');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
};

// Use authentication middleware
io.use(authenticateSocket);

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log(`User ${socket.user.fullName} connected with socket ${socket.id}`);

  try {
    // Update user online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      socketId: socket.id
    });

    // Store active user data
    activeUsers.set(socket.id, {
      userId: socket.userId,
      user: socket.user
    });
    userSockets.set(socket.userId, socket.id);

    // Join user to their chats
    const userChats = await Chat.find({ users: socket.userId }).populate('users', 'fullName email image');
    
    for (const chat of userChats) {
      socket.join(chat._id.toString());
      
      // Add to chat rooms tracking
      if (!chatRooms.has(chat._id.toString())) {
        chatRooms.set(chat._id.toString(), new Set());
      }
      chatRooms.get(chat._id.toString()).add(socket.id);
    }

    // Send user's chats
    const formattedChats = userChats.map(chat => ({
      id: chat._id.toString(),
      users: chat.users.map(user => ({
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        image: user.image
      })),
      lastMessage: chat.lastMessage || '',
      lastMessageTimestamp: {
        seconds: Math.floor(chat.lastMessageTimestamp.getTime() / 1000),
        nanoseconds: (chat.lastMessageTimestamp.getTime() % 1000) * 1000000
      },
      isGroup: chat.isGroup,
      groupName: chat.groupName
    }));

    socket.emit('chats:list', formattedChats);

    // Broadcast user online status
    const onlineUserIds = Array.from(userSockets.keys());
    io.emit('users:online', onlineUserIds);
    socket.broadcast.emit('user:online', socket.userId);

    // Handle incoming messages
    socket.on('message:send', async (data) => {
      try {
        const { tempId, chatId, text, timestamp } = data;

        // Validate chat membership
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.users.includes(socket.userId)) {
          socket.emit('message:failed', { 
            tempId, 
            error: 'You are not a member of this chat' 
          });
          return;
        }

        // Create message in database
        const message = new Message({
          text: text.trim(),
          sender: socket.userId,
          chatId: chatId,
          timestamp: new Date(timestamp)
        });

        await message.save();
        await message.populate('sender', 'fullName email image');

        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: text.trim(),
          lastMessageTimestamp: message.timestamp,
          lastMessageSender: socket.userId
        });

        const formattedMessage = {
          id: message._id.toString(),
          text: message.text,
          sender: message.sender._id.toString() === socket.userId ? 'me' : 'other',
          senderName: message.sender.fullName,
          timestamp: message.timestamp.toISOString(),
          status: 'sent'
        };

        // Send confirmation to sender
        socket.emit('message:sent', {
          tempId,
          message: formattedMessage
        });

        // Broadcast to other chat members
        const broadcastMessage = {
          ...formattedMessage,
          sender: 'other',
          senderName: socket.user.fullName
        };

        socket.to(chatId).emit('message:new', {
          chatId,
          message: broadcastMessage
        });

        // Clear typing indicators for this user
        if (typingUsers.has(chatId)) {
          typingUsers.get(chatId).delete(socket.userId);
          socket.to(chatId).emit('user:typing', {
            chatId,
            userId: socket.userId,
            isTyping: false
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message:failed', {
          tempId: data.tempId,
          error: 'Failed to send message'
        });
      }
    });

    // Handle message editing
    socket.on('message:edit', async (data) => {
      try {
        const { chatId, messageId, text } = data;

        const message = await Message.findOne({
          _id: messageId,
          sender: socket.userId,
          chatId: chatId
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found or unauthorized' });
          return;
        }

        message.text = text.trim();
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        const updateData = {
          text: message.text,
          edited: true,
          editedAt: message.editedAt
        };

        // Broadcast to all chat members
        io.to(chatId).emit('message:updated', {
          chatId,
          messageId,
          updates: updateData
        });

      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle message deletion
    socket.on('message:delete', async (data) => {
      try {
        const { chatId, messageId } = data;

        const message = await Message.findOne({
          _id: messageId,
          sender: socket.userId,
          chatId: chatId
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found or unauthorized' });
          return;
        }

        await Message.findByIdAndDelete(messageId);

        // Broadcast to all chat members
        io.to(chatId).emit('message:deleted', {
          chatId,
          messageId
        });

      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle typing indicators
    socket.on('user:typing', (data) => {
      const { chatId, isTyping } = data;

      if (!chatRooms.has(chatId) || !chatRooms.get(chatId).has(socket.id)) {
        return; // User not in this chat
      }

      if (!typingUsers.has(chatId)) {
        typingUsers.set(chatId, new Set());
      }

      const chatTypingUsers = typingUsers.get(chatId);

      if (isTyping) {
        chatTypingUsers.add(socket.userId);
      } else {
        chatTypingUsers.delete(socket.userId);
      }

      // Broadcast to other users in the chat
      socket.to(chatId).emit('user:typing', {
        chatId,
        userId: socket.userId,
        isTyping
      });
    });

    // Handle chat creation
    socket.on('chat:create', async (data) => {
      try {
        const { participants } = data; // Array of user IDs

        // Validate participants
        const users = await User.find({ _id: { $in: participants } });
        if (users.length !== participants.length) {
          socket.emit('error', { message: 'Some participants not found' });
          return;
        }

        // Check if chat already exists (for 1-on-1 chats)
        if (participants.length === 2) {
          const existingChat = await Chat.findOne({
            users: { $all: participants, $size: 2 },
            isGroup: false
          });

          if (existingChat) {
            socket.emit('error', { message: 'Chat already exists' });
            return;
          }
        }

        // Create new chat
        const chat = new Chat({
          users: participants,
          isGroup: participants.length > 2,
          lastMessage: '',
          lastMessageTimestamp: new Date()
        });

        await chat.save();
        await chat.populate('users', 'fullName email image');

        const formattedChat = {
          id: chat._id.toString(),
          users: chat.users.map(user => ({
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            image: user.image
          })),
          lastMessage: chat.lastMessage,
          lastMessageTimestamp: {
            seconds: Math.floor(chat.lastMessageTimestamp.getTime() / 1000),
            nanoseconds: (chat.lastMessageTimestamp.getTime() % 1000) * 1000000
          },
          isGroup: chat.isGroup
        };

        // Join all participants to the chat room
        for (const userId of participants) {
          const userSocketId = userSockets.get(userId);
          if (userSocketId) {
            const userSocket = io.sockets.sockets.get(userSocketId);
            if (userSocket) {
              userSocket.join(chat._id.toString());
            }
          }
        }

        // Broadcast new chat to all participants
        io.to(chat._id.toString()).emit('chat:new', formattedChat);

      } catch (error) {
        console.error('Error creating chat:', error);
        socket.emit('error', { message: 'Failed to create chat' });
      }
    });

    // Handle joining chat room
    socket.on('chat:join', async (data) => {
      const { chatId } = data;
      
      try {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.users.includes(socket.userId)) {
          socket.emit('error', { message: 'Chat not found or unauthorized' });
          return;
        }

        socket.join(chatId);
        
        if (!chatRooms.has(chatId)) {
          chatRooms.set(chatId, new Set());
        }
        chatRooms.get(chatId).add(socket.id);

        // Send chat messages
        const messages = await Message.find({ chatId }).populate('sender', 'fullName email image').sort({ timestamp: 1 });
        
        const formattedMessages = messages.map(msg => ({
          id: msg._id.toString(),
          text: msg.text,
          sender: msg.sender._id.toString() === socket.userId ? 'me' : 'other',
          senderName: msg.sender.fullName,
          timestamp: msg.timestamp.toISOString(),
          edited: msg.edited,
          editedAt: msg.editedAt
        }));

        socket.emit('messages:list', { chatId, messages: formattedMessages });

      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle leaving chat room
    socket.on('chat:leave', (data) => {
      const { chatId } = data;
      socket.leave(chatId);
      
      if (chatRooms.has(chatId)) {
        chatRooms.get(chatId).delete(socket.id);
      }
    });

  } catch (error) {
    console.error('Error in socket connection:', error);
    socket.emit('error', { message: 'Server error' });
  }

  // Handle disconnection
  socket.on('disconnect', async (reason) => {
    console.log(`User ${socket.user.fullName} disconnected: ${reason}`);

    try {
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: null
      });

      // Clean up tracking
      activeUsers.delete(socket.id);
      userSockets.delete(socket.userId);

      // Clean up chat rooms
      for (const [chatId, socketIds] of chatRooms.entries()) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          chatRooms.delete(chatId);
        }
      }

      // Clean up typing indicators
      for (const [chatId, userIds] of typingUsers.entries()) {
        if (userIds.has(socket.userId)) {
          userIds.delete(socket.userId);
          socket.to(chatId).emit('user:typing', {
            chatId,
            userId: socket.userId,
            isTyping: false
          });
        }
      }

      // Broadcast user offline status
      const onlineUserIds = Array.from(userSockets.keys());
      io.emit('users:online', onlineUserIds);
      socket.broadcast.emit('user:offline', socket.userId);

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// REST API endpoints for authentication and user management
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple authentication (you should implement proper password hashing)
    let user = await User.findOne({ email });
    if (!user) {
      // Create user if doesn't exist (for demo purposes)
      user = new User({
        email,
        fullName: email.split('@')[0],
        image: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=06b6d4&color=fff`
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        image: user.image
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    const users = await User.find({
      fullName: { $regex: q, $options: 'i' }
    }).select('fullName email image').limit(10);

    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: activeUsers.size
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
});