import speech from '@google-cloud/speech';
import textToSpeech from '@google-cloud/text-to-speech';

const speechClient = new speech.SpeechClient();
const ttsClient = new textToSpeech.TextToSpeechClient();

export class SpeechService {
  static async transcribeAudio(audioBuffer) {
    const request = {
      audio: {
        content: audioBuffer.toString('base64')
      },
      config: {
        encoding: 'MULAW',
        sampleRateHertz: 8000,
        languageCode: 'en-IN',
        model: 'phone_call',
        enableAutomaticPunctuation: true
      }
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      .map((r) => r.alternatives[0].transcript)
      .join('\n');

    console.log('🎤 Transcription:', transcription);
    return transcription;
  }

  static async textToSpeech(text) {
    const request = {
      input: { text },
      voice: {
        languageCode: 'en-IN',
        name: 'en-IN-Neural2-A'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0
      }
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    return response.audioContent;
  }
}

export default SpeechService;
