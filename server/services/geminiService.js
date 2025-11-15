// server/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Simple department + doctor mapping (dummy data for Aditya Hospital)
const DEPARTMENTS = [
  {
    name: 'General Medicine',
    keywords: ['fever', 'cold', 'cough', 'viral', 'weakness', 'general checkup'],
    doctor: 'Dr. Rohan Iyer',
    days: 'Mon–Sat',
    timing: '9:00 AM – 1:00 PM, 5:00 PM – 8:00 PM'
  },
  {
    name: 'Cardiology',
    keywords: ['heart', 'chest pain', 'bp', 'hypertension', 'palpitation', 'angina'],
    doctor: 'Dr. Meera Singh',
    days: 'Mon, Wed, Fri',
    timing: '10:00 AM – 2:00 PM'
  },
  {
    name: 'Orthopaedics',
    keywords: ['knee pain', 'joint', 'back pain', 'fracture', 'bone', 'shoulder'],
    doctor: 'Dr. Aditya Reddy',
    days: 'Tue, Thu, Sat',
    timing: '11:00 AM – 3:00 PM'
  },
  {
    name: 'Neurology',
    keywords: ['migraine', 'seizure', 'fits', 'stroke', 'paralysis', 'nerve'],
    doctor: 'Dr. Kavya Nair',
    days: 'Mon–Sat',
    timing: '4:00 PM – 7:00 PM'
  },
  {
    name: 'Gastroenterology',
    keywords: ['stomach', 'acidity', 'ulcer', 'vomiting', 'loose motion', 'liver'],
    doctor: 'Dr. Vikas Sharma',
    days: 'Mon–Sat',
    timing: '10:30 AM – 1:30 PM'
  },
  {
    name: 'Pulmonology',
    keywords: ['asthma', 'breathing', 'shortness of breath', 'lung', 'covid'],
    doctor: 'Dr. Sneha Kulkarni',
    days: 'Tue, Thu, Sat',
    timing: '9:30 AM – 12:30 PM'
  },
  {
    name: 'Dermatology',
    keywords: ['skin', 'rashes', 'pimples', 'acne', 'allergy', 'itching'],
    doctor: 'Dr. Priya Jain',
    days: 'Mon–Sat',
    timing: '3:00 PM – 6:00 PM'
  },
  {
    name: 'Gynaecology',
    keywords: ['pregnancy', 'period', 'gyne', 'women health', 'pcos', 'fertility'],
    doctor: 'Dr. Anusha Rao',
    days: 'Mon–Sat',
    timing: '10:00 AM – 2:00 PM'
  }
];

export class GeminiService {
  static async generateResponse(conversationHistory, currentPatient = null) {
    try {
      console.log('🧠 Gemini: generating response...');

      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 400
        }
      });

      const systemPrompt = this.buildSystemPrompt(currentPatient);
      const contents = this.formatConversation(conversationHistory, systemPrompt);

      // 🔴 IMPORTANT: pass { contents } object, not just array
      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response.text();

      console.log('✅ Gemini response OK');

      return {
        text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Gemini error:', error);
      const fallbacks = [
        "Sorry, I’m having a technical issue right now. Could you please repeat that once?",
        "I’m facing some connectivity issues. Please try asking again in a simple way.",
        "I’m not able to process that properly at the moment. Let me try again, could you repeat slowly?"
      ];
      return {
        text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
        timestamp: new Date().toISOString()
      };
    }
  }

  static buildSystemPrompt(currentPatient) {
    const patientContext = currentPatient
      ? `
Current Patient:
- Name: ${currentPatient.name || 'Unknown'}
- Known Conditions: ${currentPatient.medicalConditions?.join(', ') || 'None recorded'}
- Last Appointment: ${currentPatient.lastAppointment || 'Not recorded'}
- Medications: ${currentPatient.medications?.join(', ') || 'None recorded'}
- Allergies: ${currentPatient.allergies?.join(', ') || 'None recorded'}
    `.trim()
      : 'No verified patient identity yet. Speak generally and ask for basic details if needed.';

    const departmentText = DEPARTMENTS.map((d, i) => {
      return `${i + 1}. Department: ${d.name}
   - Typical problems: ${d.keywords.join(', ')}
   - Main doctor: ${d.doctor}
   - Availability: ${d.days}, ${d.timing}`;
    }).join('\n\n');

    return `
You are **Clara**, the AI voice receptionist for **Aditya Hospital**, a multi-speciality hospital in Hyderabad, India.

🎯 PRIMARY GOAL  
Handle phone calls like a real human receptionist:
- Greet patients politely.
- Understand why they are calling.
- Route them to the correct department/doctor.
- Offer appointment options (date + approximate time).
- Speak in **simple, clear English** with light Indian style.
- If patient speaks Hindi or Telugu words, you can mix a few words to sound natural, but keep replies mostly in simple English.

📞 FIRST GREETING RULE  
On the **first turn of every new call**, your greeting must be:

"Namaste. Aditya Hospital reception, this is Clara. How can I help you today?"

Do **not** repeat this full line every time, only at the very start.  
On follow-up turns you can say things like:
- "Okay, sure. Please tell me a bit more."
- "I understand. Let me check the doctor’s availability."

🏥 HOSPITAL DEPARTMENTS & DOCTORS (DUMMY BUT CONSISTENT)  
Use this mapping to decide which doctor/department is relevant:

${departmentText}

📌 ROUTING LOGIC (VERY IMPORTANT)
- Based on the caller’s symptoms/words, map to the closest department above.
- Clearly mention: department + doctor name + available days/timing.
- Example:  
  "From your symptoms, this comes under **Cardiology**. I would suggest an appointment with **Dr. Meera Singh**. She is available on **Monday, Wednesday and Friday between 10 AM and 2 PM**."

👤 PATIENT CONTEXT  
${patientContext}

If patient has called before and we know their name/condition, acknowledge it, e.g.:
- "Last time you visited for back pain. How is your back pain now?"
- If they say it is fine, respond positively and continue.
- If they say it is worse, gently suggest appointment again.

🩺 WHAT YOU MUST NOT DO  
- Do **NOT** give medical diagnosis or exact treatment.
- Do **NOT** prescribe medicines.
- For any emergency keywords (e.g. severe chest pain, unconscious, heavy bleeding, accident), say:
  "This sounds like an emergency. Please go to the nearest emergency department immediately or call local emergency services."

🎙️ SPEAKING STYLE  
- Talk like a calm, kind receptionist.
- Short, clear sentences (suitable for phone).
- Leave small pauses in text using commas and full stops.
- Don’t speak like a robot list; speak like natural conversation.
- Use the patient’s name when known.

Your output must be only what Clara will **say aloud to the caller**. No JSON, no labels, no explanations.
    `.trim();
  }

  static formatConversation(conversationHistory, systemPrompt) {
    const contents = [];

    // System behaviour as a user "instruction" to the model
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });

    // Model acknowledges internally (helps stabilise behaviour)
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will act as Clara, the AI receptionist for Aditya Hospital and speak naturally on calls.' }]
    });

    // Add real conversation turns
    conversationHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });

    return contents;
  }
}

export default GeminiService;
