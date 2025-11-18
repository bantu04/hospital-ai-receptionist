import { ReceptionistService } from '../services/receptionistService.js';
import { FirestoreService } from '../services/firestoreService.js';

export class ReceptionistController {
  static async processConversation(req, res) {
    try {
      const { messages, callerPhoneNumber } = req.body;

      let patient = null;
      if (callerPhoneNumber) {
        patient = await FirestoreService.getPatientByPhone(callerPhoneNumber);
      }

      const result = await ReceptionistService.generateResponse(
        messages, 
        patient, 
        callerPhoneNumber
      );

      res.json({
        success: true,
        response: result.text,
        timestamp: result.timestamp,
        state: result.state
      });
    } catch (err) {
      console.error('❌ processConversation error:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  static async getLearningStats(req, res) {
    try {
      const stats = ReceptionistService.getLearningStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      console.error('❌ getLearningStats error:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
}

export default ReceptionistController;