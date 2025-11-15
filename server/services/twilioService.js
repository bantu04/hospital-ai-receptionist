import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 👇 choose the voice once here so it's easy to tweak
// Some nice Polly options:
//   - Polly.Joanna  (US female, natural)
//   - Polly.Matthew (US male, natural)
//   - Polly.Aditi   (Indian English / Hindi mix accent)
//   - Polly.Raveena (Indian English female)
const POLLY_VOICE = process.env.TWILIO_VOICE || 'Polly.Joanna';

export class TwilioService {

  static generateTwiMLResponse(message) {
    const twiml = new twilio.twiml.VoiceResponse();

    // Main reply – use Polly neural voice
    twiml.say(
      {
        voice: POLLY_VOICE,
        language: 'en-US'
      },
      message
    );

    // Then ask for the next utterance
    twiml.gather({
      input: 'speech',
      action: `${process.env.SERVER_BASE_URL}/api/twilio/transcribe`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      language: 'en-US'
    });

    return twiml.toString();
  }

  static generateWelcomeTwiML() {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(
      {
        voice: POLLY_VOICE,
        language: 'en-US'
      },
      'Hello. Thank you for calling Aditya Hospital. ' +
        'My name is your AI receptionist. How can I help you today?'
    );

    twiml.gather({
      input: 'speech',
      action: `${process.env.SERVER_BASE_URL}/api/twilio/transcribe`,
      method: 'POST',
      speechTimeout: 'auto',
      speechModel: 'phone_call',
      language: 'en-US'
    });

    return twiml.toString();
  }

  static generateGoodbyeTwiML() {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(
      {
        voice: POLLY_VOICE,
        language: 'en-US'
      },
      'Thank you for calling Aditya Hospital. Take care and have a good day.'
    );

    twiml.hangup();
    return twiml.toString();
  }

  static async makeOutboundCall(to, message) {
    try {
      const call = await client.calls.create({
        twiml: `
          <Response>
            <Say voice="${POLLY_VOICE}">
              ${message}
            </Say>
          </Response>
        `,
        to,
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
