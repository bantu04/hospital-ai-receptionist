import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export class TwilioService {
  static generateTwiMLResponse(message) {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say(
      {
        voice: 'woman',
        language: 'en-IN'
      },
      message
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
        voice: 'woman',
        language: 'en-IN'
      },
      'Namaste! Thank you for calling Aditya Hospital. I am your AI assistant. How can I help you today?'
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
        voice: 'woman',
        language: 'en-IN'
      },
      'Thank you for calling Aditya Hospital. Take care and have a good day.'
    );

    twiml.hangup();
    return twiml.toString();
  }

  static async makeOutboundCall(to, message) {
    const call = await client.calls.create({
      twiml: `<Response><Say voice="woman" language="en-IN">${message}</Say></Response>`,
      to,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    console.log('✅ Outbound call initiated:', call.sid);
    return call.sid;
  }
}

export default TwilioService;
