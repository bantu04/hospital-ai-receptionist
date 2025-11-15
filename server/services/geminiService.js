// server/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export class GeminiService {
  static async generateResponse(conversationHistory = [], currentPatient = null) {
    try {
      console.log('🧠 Gemini: generating response...');

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash-latest',
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 500,
        },
      });

      const systemPrompt = this.buildSystemPrompt(currentPatient);
      const contents = this.formatConversation(conversationHistory, systemPrompt);

      // ⬅️ IMPORTANT: wrap in { contents: [...] }
      const result = await model.generateContent({ contents });
      const response = result.response;
      const text = response.text();

      console.log('✅ Gemini response OK');

      return {
        text,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Gemini error:', error);

      const fallbacks = [
        "I'm having a bit of trouble understanding that. Could you say it again in a different way?",
        "Sorry, I ran into a technical issue. Could you please repeat that?",
        "I’m experiencing a small glitch. Please try once more.",
      ];

      return {
        text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
        timestamp: new Date().toISOString(),
      };
    }
  }

  static buildSystemPrompt(currentPatient) {
    const patientContext = currentPatient
      ? `
Current Patient: ${currentPatient.name}
Medical History: ${currentPatient.medicalConditions?.join(', ') || 'None recorded'}
Last Appointment: ${currentPatient.lastAppointment || 'No recent appointments'}
Active Medications: ${currentPatient.medications?.join(', ') || 'None'}
Known Allergies: ${currentPatient.allergies?.join(', ') || 'None'}
    `.trim()
      : 'No patient identified yet. You are speaking to a caller whose identity is not yet verified.';

    // You can rename City General Hospital → Aditya Hospital here later if you want
    return `
You are an AI receptionist for a real hospital. You answer phone calls and speak naturally.

ROLE:
- You are a warm, professional hospital receptionist.
- You help patients with appointments, basic information, and routing — you do NOT give medical advice.

PATIENT CONTEXT:
${patientContext}

CORE RESPONSIBILITIES:
1. Greet callers politely and ask how you can help.
2. Help with:
   - Booking, rescheduling, and cancelling appointments
   - Checking approximate doctor/department availability (use reasonable assumptions)
   - Answering basic hospital questions (timings, location, departments).
3. If someone describes serious or emergency symptoms (e.g. chest pain, difficulty breathing, heavy bleeding, accident):
   - Tell them clearly to seek emergency services or visit the emergency department immediately.
4. Never give diagnosis, prescriptions, or detailed medical advice. Always say a doctor must decide that.

SPEAKING STYLE:
- Short, clear sentences as if you are talking on the phone.
- Friendly but professional.
- Use the caller’s name if they give it.
- Ask one question at a time.
- If you didn’t understand, politely ask them to repeat.
- End the call by summarising what you’ve done (e.g. “I’ve booked your appointment…”) and a friendly goodbye.

OUTPUT FORMAT:
- Answer ONLY with what you would say aloud to the caller. No labels like "AI:" or "Assistant:".
- Keep each response 1–3 sentences so it feels natural in a phone call.

Today’s date: ${new Date().toLocaleDateString()}
    `.trim();
  }

  static formatConversation(conversationHistory, systemPrompt) {
    const contents = [];

    // System-style priming as if user told you the instructions
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }],
    });

    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will act as the hospital receptionist and speak naturally on the phone.' }],
    });

    // Add actual caller conversation history
    for (const msg of conversationHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    return contents;
  }
}

export default GeminiService;
