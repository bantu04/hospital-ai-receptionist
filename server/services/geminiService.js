import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export class GeminiService {
  static async generateResponse(conversationHistory, currentPatient = null) {
    try {
      console.log('🧠 Gemini: generating response...');

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash-latest',
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 500
        }
      });

      const systemPrompt = this.buildSystemPrompt(currentPatient);
      const formatted = this.formatConversation(conversationHistory, systemPrompt);

      const result = await model.generateContent(formatted);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('❌ Gemini error:', err.message);

      const fallbacks = [
        "I'm having trouble processing that right now, could you please repeat?",
        'Sorry, the system is a bit slow. Can you say that again in a simple way?',
        'I am facing a technical issue at the moment. Please try once more.'
      ];

      return {
        text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
        timestamp: new Date().toISOString()
      };
    }
  }

  static buildSystemPrompt(patient) {
    const patientContext = patient
      ? `
Current Patient:
- Name: ${patient.name || 'Unknown'}
- Conditions: ${patient.medicalConditions?.join(', ') || 'None recorded'}
- Last Appointment: ${patient.lastAppointment || 'Not available'}
- Medications: ${patient.medications?.join(', ') || 'None'}
- Allergies: ${patient.allergies?.join(', ') || 'None'}
`.trim()
      : 'No patient identified yet for this phone number.';

    return `
You are an AI receptionist for **Aditya Hospital**, in India.

Your job:
1. Greet callers warmly and naturally.
2. Understand whether they want:
   - new appointment,
   - reschedule/cancel,
   - follow-up about existing issue,
   - information (timings, location, departments, etc.).
3. Ask the right follow-up questions (symptoms, doctor name, preferred time, etc.).
4. Suggest suitable time slots (you will be given available slots).
5. Confirm details clearly and politely.
6. For emergencies (severe pain, breathing issues, chest pain, accidents, etc.) you must say:
   - "This sounds serious. Please go to the nearest emergency department immediately or call emergency services."

Rules:
- DO NOT give medical diagnosis.
- DO NOT prescribe medicines.
- If unsure, say that a human receptionist or doctor will check and get back.
- Speak in **very simple, clear English**.

Patient context:
${patientContext}

Your answers should be:
- 1–3 short sentences max.
- Friendly, calm, and confident.
- Always end with a question that moves the conversation forward (unless call is ending).
`.trim();
  }

  static formatConversation(history, systemPrompt) {
    const msgs = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [
          {
            text: "Understood. I'll act as Aditya Hospital's AI receptionist with empathy and clarity."
          }
        ]
      }
    ];

    history.forEach((msg) => {
      msgs.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });

    return msgs;
  }
}

export default GeminiService;
