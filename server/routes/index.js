import express from 'express';
import TwilioController from '../controllers/twilioController.js';
import GeminiController from '../controllers/geminiController.js';

const router = express.Router();

router.post('/twilio/voice', TwilioController.handleIncomingCall);
router.post('/twilio/transcribe', TwilioController.handleTranscription);
router.post('/twilio/status', TwilioController.handleCallStatus);

router.post('/conversation', GeminiController.processConversation);

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Aditya Hospital AI Receptionist API'
  });
});

export default router;
