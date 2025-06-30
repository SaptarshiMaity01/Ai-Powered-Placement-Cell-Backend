import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import academicInfoRoutes from './routes/academicInfoRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import certificationRoutes from './routes/certifications.js';
import experienceRoutes from './routes/experienceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import eventRoutes from './routes/eventRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { Server } from 'socket.io';
import http from 'http';
import Message from './models/Message.js';
import announcementRoutes from './routes/announcementRoutes.js'
import studentRoutes from './routes/studentRoutes.js';
import companyRoutes from './routes/companyRoutes.js'
import jobsRouter from './routes/jobsRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js'
import statsRoutes from './routes/statsRoutes.js';

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

const connectedUsers = new Map();

// Update your existing Socket.IO code in server.js:

io.on("connection", (socket) => {
  console.log(`⚡ New client connected: ${socket.id}`);

  socket.on("join", ({ userId }) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} joined with socket ID: ${socket.id}`);
    
    // Notify others about user's online status
    socket.broadcast.emit("userStatus", { 
      userId, 
      isOnline: true 
    });
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { receiverId, message } = data;
      
      // Save to database first
      const newMessage = new Message({
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        timestamp: message.timestamp,
        read: false
      });
      
      const savedMessage = await newMessage.save();
      
      // Populate sender info
      const populatedMessage = await Message.populate(savedMessage, {
        path: 'senderId',
        select: 'name avatar'
      });

      // Send to receiver if online
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", {
          ...populatedMessage.toObject(),
          hasNewMessage: true  // Add this flag for the frontend
        });
        
        console.log(`Message sent to ${receiverId} with new message flag`);
      }

      // Send delivery confirmation to sender
      socket.emit("messageDelivered", { 
        tempId: message.id,
        messageId: savedMessage._id
      });
    } catch (err) {
      console.error("Error sending message:", err);
      socket.emit("messageError", { 
        tempId: message.id,
        error: "Failed to send message"
      });
    }
  });

  socket.on("typing", ({ receiverId, isTyping }) => {
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", {
        senderId: socket.userId,
        isTyping
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`⚡ Client disconnected: ${socket.id}`);
    
    // Find and remove the disconnected user
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        
        // Notify others about user's offline status
        io.emit("userStatus", { 
          userId, 
          isOnline: false 
        });
        break;
      }
    }
  });
});

server.listen(5000, () => {
  console.log("🚀 Server listening on port 5000");
});



// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Connect Database
connectDB();


// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials:true,
  optionsSuccessStatus: 200
};

// Helmet Configuration with CSP
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'frame-ancestors': [
        "'self'",
        process.env.FRONTEND_URL || 'http://localhost:3000'
      ],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" } // Needed for PDFs
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet(helmetConfig));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Special CSP headers for PDF routes
app.use('/uploads/resumes', (req, res, next) => {
  res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/academic-info', academicInfoRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/certifications', certificationRoutes);
app.use("/api/experiences", experienceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companys', companyRoutes);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationRoutes )
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`CSP configured to allow frames from: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});