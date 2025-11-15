// server/services/twilioService.js
import twilio from 'twilio';

// Twilio client using env vars
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Choose Twilio / Polly neural voice
// Some options: Polly.Joanna, Polly.Matthew, Polly.Aditi, Polly.Raveena
const POLLY_VOICE = process.env.TWILIO_VOICE || 'Polly.Joanna';

export class TwilioService {
  static generateTwiMLResponse(message) {
    const twiml = new twilio.twiml.VoiceResponse();

    // Clara's reply
    twiml.say(
      {
        voice: POLLY_VOICE,
        language: 'en-US'
      },
      message
    );

    // Ask for caller's next speech
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

    // 👇 First line the caller hears
    twiml.say(
      {
        voice: POLLY_VOICE,
        language: 'en-US'
      },
      'Namaste. Aditya Hospital reception, this is Clara. How can I help you today?'
    );

    // Wait for the first response
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
