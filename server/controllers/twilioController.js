import { TwilioService } from '../services/twilioService.js';
import { ReceptionistService } from '../services/receptionistService.js';
import { FirestoreService } from '../services/firestoreService.js';

export class TwilioController {
  static async handleIncomingCall(req, res) {
    try {
      const callerPhone = req.body.From;
      const callSid = req.body.CallSid;

      console.log(`📞 Incoming call from ${callerPhone}, CallSid: ${callSid}`);

      // Log the call
      FirestoreService.logCall({
        callId: callSid,
        callerPhone,
        type: 'incoming',
        status: 'connected'
      });

      // Notify dashboard
      const io = req.app.get('io');
      io.emit('call-incoming', {
        callId: callSid,
        callerPhone,
        timestamp: new Date().toISOString()
      });

      const twiml = TwilioService.generateWelcomeTwiML();
      res.type('text/xml');
      res.send(twiml);
    } catch (err) {
      console.error('❌ handleIncomingCall error:', err);
      res.status(500).send('Error');
    }
  }

  static async handleTranscription(req, res) {
    try {
      const speechResult = req.body.SpeechResult;
      const callerPhone = req.body.From;
      const callSid = req.body.CallSid;

      console.log(`🎤 Speech from ${callerPhone}:`, speechResult);

      if (!speechResult) {
        const twiml = TwilioService.generateTwiMLResponse(
          "I didn't catch that clearly. Could you please repeat?"
        );
        res.type('text/xml');
        return res.send(twiml);
      }

      // Get patient info if exists
      const patient = await FirestoreService.getPatientByPhone(callerPhone);

      // Process with receptionist AI
      const conversationHistory = [
        {
          role: 'user',
          content: speechResult,
          timestamp: new Date().toISOString()
        }
      ];

      const aiResponse = await ReceptionistService.generateResponse(
        conversationHistory, 
        patient, 
        callerPhone, 
        callSid
      );

      // Notify dashboard
      const io = req.app.get('io');
      io.emit('conversation-message', {
        callId: callSid,
        message: {
          role: 'user',
          content: speechResult,
          timestamp: new Date().toISOString()
        }
      });
      io.emit('conversation-message', {
        callId: callSid,
        message: {
          role: 'assistant',
          content: aiResponse.text,
          timestamp: aiResponse.timestamp
        }
      });

      // Check if conversation should end
      const lower = aiResponse.text.toLowerCase();
      const shouldEnd = 
        lower.includes('goodbye') || 
        lower.includes('thank you for calling') ||
        lower.includes('appointment confirmed') ||
        (aiResponse.state && aiResponse.state.step === 'complete');

      let twiml;
      if (shouldEnd) {
        twiml = TwilioService.generateGoodbyeTwiML();
        FirestoreService.logCall({
          callId: callSid,
          callerPhone,
          type: 'incoming',
          status: 'completed'
        });
        io.emit('call-ended', { callId: callSid });
      } else {
        twiml = TwilioService.generateTwiMLResponse(aiResponse.text);
      }

      res.type('text/xml');
      res.send(twiml);
    } catch (err) {
      console.error('❌ handleTranscription error:', err);
      const twiml = TwilioService.generateTwiMLResponse(
        'Sorry, there was a technical issue. Please try again in a moment.'
      );
      res.type('text/xml');
      res.send(twiml);
    }
  }

  static async handleCallStatus(req, res) {
    try {
      const callStatus = req.body.CallStatus;
      const callSid = req.body.CallSid;

      console.log(`📞 Call status update [${callSid}]: ${callStatus}`);

      if (['completed', 'failed', 'busy', 'no-answer'].includes(callStatus)) {
        const io = req.app.get('io');
        io.emit('call-ended', { callId: callSid });
        FirestoreService.logCall({
          callId: callSid,
          status: callStatus
        });
      }

      res.status(200).end();
    } catch (err) {
      console.error('❌ handleCallStatus error:', err);
      res.status(500).end();
    }
  }
}

export default TwilioController;