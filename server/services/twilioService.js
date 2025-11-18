import twilio from 'twilio';

const hasTwilioCreds =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;

let client = null;

if (hasTwilioCreds) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} else {
  console.warn(
    '⚠️ Twilio credentials not set. REST calls disabled.'
  );
}

const TTS_VOICE = process.env.TWILIO_TTS_VOICE || 'Polly.Amy';
const LANGUAGE = process.env.TWILIO_TTS_LANG || 'en-GB';

export class TwilioService {
  static generateTwiMLResponse(message) {
    const twiml = new twilio.twiml.VoiceResponse();

    const cleanMessage = message
      .replace(/^(okay|ok|alright|sure),?\s*/i, '')
      .replace(/^i understand,?\s*/i, '')
      .trim();

    twiml.say(
      {
        voice: TTS_VOICE,
        language: LANGUAGE
      },
      cleanMessage
    );

    twiml.gather({
      input: 'speech',
      action: `${process.env.SERVER_BASE_URL}/api/twilio/transcribe`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      language: 'en-IN'
    });

    return twiml.toString();
  }

  static generateWelcomeTwiML() {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(
      {
        voice: TTS_VOICE,
        language: LANGUAGE
      },
      'Namaste, welcome to Aditya Hospital. This is Clara, your AI receptionist. How can I assist you today?'
    );

    twiml.gather({
      input: 'speech',
      action: `${process.env.SERVER_BASE_URL}/api/twilio/transcribe`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      language: 'en-IN'
    });

    return twiml.toString();
  }

  static generateGoodbyeTwiML() {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(
      {
        voice: TTS_VOICE,
        language: LANGUAGE
      },
      'Thank you for calling Aditya Hospital. Have a wonderful day!'
    );

    twiml.hangup();

    return twiml.toString();
  }

  static async makeOutboundCall(to, message) {
    if (!client) {
      console.warn('⚠️ Twilio client not initialized.');
      return null;
    }

    try {
      const call = await client.calls.create({
        twiml: `<Response><Say voice="${TTS_VOICE}" language="${LANGUAGE}">${message}</Say></Response>`,
        to: to,
        from: process.env.TWILIO_PHONE_NUMBER
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