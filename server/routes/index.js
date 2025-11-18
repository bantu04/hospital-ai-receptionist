import express from 'express';
import TwilioController from '../controllers/twilioController.js';
import ReceptionistController from '../controllers/receptionistController.js';

const router = express.Router();

// Twilio voice routes
router.post('/twilio/voice', TwilioController.handleIncomingCall);
router.post('/twilio/transcribe', TwilioController.handleTranscription);
router.post('/twilio/status', TwilioController.handleCallStatus);

// Receptionist API routes
router.post('/receptionist/conversation', ReceptionistController.processConversation);
router.get('/receptionist/stats', ReceptionistController.getLearningStats);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Aditya Hospital AI Receptionist API'
  });
});

export default router;