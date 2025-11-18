import { GeminiService } from '../services/geminiService.js';
import { FirestoreService } from '../services/firestoreService.js';

export class GeminiController {
  static async processConversation(req, res) {
    try {
      const { messages, callerPhoneNumber } = req.body;

      let patient = null;
      if (callerPhoneNumber) {
        patient = await FirestoreService.getPatientByPhone(callerPhoneNumber);
      }

      const result = await GeminiService.generateResponse(messages, patient);

      res.json({
        success: true,
        response: result.text,
        timestamp: result.timestamp
      });
    } catch (err) {
      console.error('❌ processConversation error:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
}

export default GeminiController;