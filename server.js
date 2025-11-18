import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Add this check for development
if (!process.env.PORT) {
  console.log('⚠️  PORT environment variable not set, using default:', PORT);
  console.log('ℹ️  In production, Render will set PORT automatically');
} else {
  console.log('✅ PORT environment variable:', process.env.PORT);
}

const activeCalls = new Map();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.set('io', io);
app.set('activeCalls', activeCalls);

import routes from './server/routes/index.js';
app.use('/api', routes);

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-call', (callId) => {
    socket.join(callId);
    const callData = activeCalls.get(callId);
    if (callData) {
      socket.emit('call-update', callData);
    }
  });

  socket.on('call-status', (data) => {
    const { callId, status, callerInfo } = data;

    if (status === 'active') {
      activeCalls.set(callId, {
        callId,
        status,
        callerInfo,
        startTime: new Date().toISOString(),
        conversation: []
      });
    } else if (status === 'ended') {
      activeCalls.delete(callId);
    }

    io.to(callId).emit('call-status-update', { callId, status, callerInfo });
  });

  socket.on('conversation-update', (data) => {
    const { callId, message } = data;
    const callData = activeCalls.get(callId);
    if (callData) {
      callData.conversation.push(message);
      io.to(callId).emit('conversation-message', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Aditya Hospital AI Receptionist API',
    environment: process.env.NODE_ENV,
    activeCalls: activeCalls.size
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 Aditya Hospital AI Receptionist running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📞 Twilio Webhook: ${process.env.SERVER_BASE_URL}/api/twilio/voice`);
});

export default app;