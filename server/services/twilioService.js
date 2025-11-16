// server/services/twilioService.js
import twilio from 'twilio';

const hasTwilioCreds =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;

let client = null;

if (hasTwilioCreds) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.warn('⚠️ TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set. Twilio REST calls are disabled for this run.');
}

// ✅ Use a more reliable TTS voice
const TTS_VOICE = 'alice'; // More reliable than Polly.Joanna
const LANGUAGE = 'en-IN'; // Changed to Indian English

export class TwilioService {
  static generateTwiMLResponse(message) {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(
      {
        voice: TTS_VOICE,
        language: LANGUAGE,
      },
      message
    );

    twiml.gather({
      input: 'speech',
      action: `${process.env.SERVER_BASE_URL}/api/twilio/transcribe`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      language: 'en-IN',
    });

    return twiml.toString();
  }

  static generateWelcomeTwiML() {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(
      {
        voice: TTS_VOICE,
        language: LANGUAGE,
      },
      'Namaste, Aditya Hospital reception. This is Clara, your AI assistant. How can I help you today?'
    );

    twiml.gather({
      input: 'speech',
      action: `${process.env.SERVER_BASE_URL}/api/twilio/transcribe`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      language: 'en-IN',
    });

    return twiml.toString();
  }

  static generateGoodbyeTwiML() {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(
      {
        voice: TTS_VOICE,
        language: LANGUAGE,
      },
      'Thank you for calling Aditya Hospital. Take care and have a good day.'
    );

    twiml.hangup();

    return twiml.toString();
  }

  static async makeOutboundCall(to, message) {
    if (!client) {
      console.warn('⚠️ Cannot make outbound call: Twilio client not initialized.');
      return null;
    }

    try {
      const call = await client.calls.create({
        twiml: `<Response><Say voice="${TTS_VOICE}" language="${LANGUAGE}">${message}</Say></Response>`,
        to: to,
        from: process.env.TWILIO_PHONE_NUMBER,
      });

      console.log('✅ Outbound call initiated:', call.sid);
      return call.sid;
    } catch (error) {
      console.error('❌ Error making outbound call:', error);
      throw error;
    }
  }
}

export default TwilioService;