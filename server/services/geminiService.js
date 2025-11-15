// server/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export class GeminiService {
  /**
   * conversationHistory: array like [
   *   { role: 'user'|'assistant', content: 'text', timestamp: ... }
   * ]
   * currentPatient: null or patient object from Firestore
   */
  static async generateResponse(conversationHistory, currentPatient = null) {
    try {
      console.log('🧠 Gemini: generating response...');

      const model = genAI.getGenerativeModel({
        // Use a stable model that works with v1beta
        model: 'gemini-1.0-pro-latest',
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 300,
        },
      });

      const prompt = this.buildPrompt(conversationHistory, currentPatient);

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('✅ Gemini: response OK');
      return {
        text,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Gemini error:', error);

      const fallbacks = [
        'Sorry, I am having a technical issue right now. Could you please repeat that once?',
        'I am facing some connection issues. Please say that again slowly.',
        'I could not process that properly. Can you repeat in simple words?',
      ];

      return {
        text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Build one big prompt string for Gemini.
   */
  static buildPrompt(conversationHistory, currentPatient) {
    const patientContext = currentPatient
      ? `
Current Patient
- Name: ${currentPatient.name || 'Unknown'}
- Phone: ${currentPatient.phoneNumbers?.[0] || 'Unknown'}
- Known conditions: ${currentPatient.medicalConditions?.join(', ') || 'None recorded'}
- Allergies: ${currentPatient.allergies?.join(', ') || 'None recorded'}
- Active medications: ${currentPatient.medications?.join(', ') || 'None recorded'}
- Last appointment: ${currentPatient.lastAppointment || 'No recent appointment on record'}
      `.trim()
      : 'No patient record matched to this phone number yet. Treat as new patient.';

    // Simple conversation transcript
    const convoText =
      conversationHistory && conversationHistory.length
        ? conversationHistory
            .map(
              (msg) =>
                `${msg.role === 'user' ? 'Patient' : 'Clara'}: ${msg.content}`
            )
            .join('\n')
        : 'No previous messages, this is the first thing the patient said.';

    // Very simple “router” for departments – Gemini will use these as guidelines
    const departments = `
DEPARTMENTS & DOCTORS (DUMMY INTERNAL DATA – DO NOT SAY "THIS IS FAKE")
- General Medicine
  • Dr. Arjun Rao – Mon–Sat, 10:00–13:00 & 17:00–20:00
  • Common issues: fever, cold, cough, mild infections, general checkup.

- Cardiology
  • Dr. Kavya Menon – Mon, Wed, Fri, 10:00–14:00
  • Handles: chest pain, heart disease, high BP with heart issues, palpitations.

- Gastroenterology
  • Dr. Rohan Desai – Tue, Thu, Sat, 11:00–15:00
  • Handles: stomach pain, acidity, gastric issues, vomiting, loose motion.

- Orthopedics
  • Dr. Nisha Kapoor – Mon–Sat, 09:00–12:30
  • Handles: back pain, knee pain, joint pain, fractures, sprains.

- Neurology
  • Dr. Vikram Shah – Tue, Thu, Sat, 16:00–20:00
  • Handles: seizures, fits, migraine, stroke follow-up, nerve problems.

- Gynecology
  • Dr. Anjali Reddy – Mon–Sat, 11:00–15:00
  • Handles: pregnancy follow-up, periods issues, women’s health problems.

RULES:
- Route stomach / gastric issues → Gastroenterology.
- Chest pain / heart issues → Cardiology.
- Joint / bone / back pain → Orthopedics.
- Headache with neuro symptoms / seizures → Neurology.
- Pregnancy / periods / women’s issues → Gynecology.
- Fever / cold / general symptoms → General Medicine.
    `.trim();

    const system = `
You are **Clara**, an AI voice receptionist for **Aditya Hospital** in Hyderabad.

🔊 PHONE STYLE
- Start the very first answer with: 
  "Namaste, Aditya Hospital reception. This is Clara speaking. How can I help you today?"
- After that, speak naturally in simple, clear English.
- Keep answers short and friendly (2–4 sentences).
- Do NOT give medical diagnosis or prescribe medicines.
- If the caller asks for medical advice, say:
  "I am not a doctor, but I can book an appointment with the right specialist for you."

📂 PATIENT CONTEXT
${patientContext}

🏥 HOSPITAL LOGIC
${departments}

BOOKING / SCHEDULING BEHAVIOUR
- If the patient clearly wants to book an appointment:
  1) Confirm what problem they have and which doctor they prefer (if any).
  2) Pick a **reasonable** slot from the doctor’s schedule above 
     (you don’t know real-time occupancy, so just propose a suitable time).
  3) Confirm day + time clearly, repeat it once more.
  4) Keep a summary you would send to the hospital staff (but just say it to the patient).
- If they mention a previous visit or same problem again:
  - Acknowledge: "Last time you visited for similar issue, right?"
  - Then continue to book/reschedule logically.

LANGUAGE RULES
- Assume the Twilio call audio is coming in English. If you detect a Hindi word like "Namaste", you can sprinkle small Hindi phrases like "ji" or "thoda" naturally, but keep the main response English.
- Always remain respectful, calm, and empathetic.

SAFETY / EMERGENCY
- If the caller describes severe emergency (chest pain + sweating, difficulty breathing, unconscious patient, accident with heavy bleeding, stroke symptoms, etc.):
  - Say: "This sounds serious. Please go to the nearest emergency department or call your local emergency number immediately."
  - Do NOT try to handle emergency bookings – always push them to emergency care.

Your job is:
- Understand the caller’s intent from the transcript.
- Answer like a real, kind human receptionist.
- Book / suggest appointments with the correct doctor as per the problem.
- Ask follow-up questions if needed.
- End the call politely if the user is done, with something like:
  "Thank you for calling Aditya Hospital. Take care!"
`.trim();

    return `
${system}

==== CONVERSATION SO FAR ====
${convoText}

Now, reply as Clara in a single turn. Do NOT show any of these internal notes, just speak as if you are talking on the phone.
`.trim();
  }
}

export default GeminiService;
