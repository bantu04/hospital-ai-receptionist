// server/services/geminiService.js
import axios from 'axios';

export class GeminiService {
  static async generateResponse(conversationHistory = [], currentPatient = null) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('❌ GOOGLE_API_KEY is missing from environment variables');
      return this.getSmartResponse(conversationHistory, 'no_api_key');
    }

    // Build the conversation
    const prompt = this.buildCompletePrompt(conversationHistory, currentPatient);

    try {
      console.log('🧠 Attempting Gemini API call...');
      
      // ✅ FIXED: Use the correct model that you have access to
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 500,
          }
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = response.data.candidates[0].content.parts[0].text.trim();
        console.log('✅ Gemini API SUCCESS:', text.substring(0, 100) + '...');
        return {
          text: text,
          timestamp: new Date().toISOString(),
          source: 'gemini'
        };
      } else {
        console.error('❌ Unexpected response format from Gemini');
        return this.getSmartResponse(conversationHistory, 'invalid_response');
      }
    } catch (error) {
      console.error('❌ Gemini API failed:', {
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message,
        code: error.code
      });
      
      return this.getSmartResponse(conversationHistory, 'api_error');
    }
  }

  static getSmartResponse(conversationHistory, errorType) {
    const lastMessage = conversationHistory[conversationHistory.length - 1]?.content?.toLowerCase() || '';
    
    console.log(`🔄 Using smart response for: "${lastMessage.substring(0, 50)}..."`);

    // Emergency situations
    if (this.isEmergency(lastMessage)) {
      return {
        text: "This sounds like a medical emergency. Please go to the nearest hospital emergency department immediately or call 108 for an ambulance. Do not delay.",
        timestamp: new Date().toISOString(),
        source: 'emergency_fallback'
      };
    }

    // First message in conversation
    if (conversationHistory.length === 0) {
      return {
        text: "Namaste! Thank you for calling Aditya Hospital. I'm Clara, your AI assistant. How can I help you today?",
        timestamp: new Date().toISOString(),
        source: 'welcome_fallback'
      };
    }

    // Appointment related
    if (lastMessage.includes('appointment') || lastMessage.includes('book') || lastMessage.includes('see doctor')) {
      return {
        text: "I'd be happy to help you book an appointment. Could you please tell me your full name and what symptoms you're experiencing?",
        timestamp: new Date().toISOString(),
        source: 'appointment_fallback'
      };
    }

    // Specific symptoms
    if (lastMessage.includes('chest pain') || lastMessage.includes('heart')) {
      return {
        text: "I understand you're experiencing chest pain. Let me book you an appointment with our cardiology department. Could you please tell me your full name?",
        timestamp: new Date().toISOString(),
        source: 'cardiology_fallback'
      };
    }

    if (lastMessage.includes('stomach') || lastMessage.includes('abdomen') || lastMessage.includes('vomit')) {
      return {
        text: "I understand you're having stomach issues. Let me connect you with our gastroenterology department. May I have your full name please?",
        timestamp: new Date().toISOString(),
        source: 'gastro_fallback'
      };
    }

    if (lastMessage.includes('fever') || lastMessage.includes('cough') || lastMessage.includes('cold')) {
      return {
        text: "I understand you're not feeling well. Let me book you an appointment with our general medicine department. Could you please tell me your name?",
        timestamp: new Date().toISOString(),
        source: 'general_medicine_fallback'
      };
    }

    // Name provided
    if (lastMessage.match(/\b(my name is|i am|call me)\s+([a-z]+)/i)) {
      const nameMatch = lastMessage.match(/\b(my name is|i am|call me)\s+([a-z]+)/i);
      const name = nameMatch ? nameMatch[2] : 'there';
      return {
        text: `Thank you ${name}. How can I help you today? Are you looking to book an appointment or do you have questions about our services?`,
        timestamp: new Date().toISOString(),
        source: 'name_fallback'
      };
    }

    // Generic responses
    const genericResponses = [
      "I understand. How can I assist you with that?",
      "Thank you for that information. How may I help you further?",
      "I'm here to help. Could you tell me a bit more about what you need?",
      "Let me see how I can best assist you. What would you like to know?",
      "Namaste! How can I help you today at Aditya Hospital?"
    ];

    return {
      text: genericResponses[Math.floor(Math.random() * genericResponses.length)],
      timestamp: new Date().toISOString(),
      source: 'generic_fallback'
    };
  }

  static isEmergency(message) {
    const emergencyKeywords = [
      'heart attack', 'chest pain', 'difficulty breathing', 'can\'t breathe',
      'unconscious', 'passed out', 'heavy bleeding', 'severe bleeding',
      'stroke', 'paralysis', 'accident', 'emergency', 'dying', 'critical'
    ];
    
    return emergencyKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  static buildCompletePrompt(conversationHistory, currentPatient) {
    const patientInfo = currentPatient ? 
      `Patient: ${currentPatient.name}, Phone: ${currentPatient.phoneNumber}` : 
      'New patient';

    const conversationText = conversationHistory.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    return `
You are Clara, an AI receptionist for Aditya Hospital in India. You are having a REAL phone conversation.

PATIENT: ${patientInfo}
CONVERSATION HISTORY:
${conversationText}

IMPORTANT INSTRUCTIONS:
- Respond in 2-3 short sentences maximum (this is a phone call)
- Sound natural, warm, and empathetic
- Use Indian English phrasing
- Be conversational and helpful
- Ask one question at a time
- Never give medical advice

YOUR ROLE:
- Book appointments with appropriate departments
- Provide basic hospital information
- Route to correct specialists based on symptoms
- Handle emergencies appropriately

EMERGENCY PROTOCOL:
If patient mentions chest pain, breathing difficulty, severe bleeding, stroke symptoms, or unconsciousness → immediately direct to emergency services.

DEPARTMENT MAPPING:
- Chest/heart issues → Cardiology (Dr. Meera Sharma)
- Stomach/digestion → Gastroenterology (Dr. Kavya Nair) 
- Bone/joint pain → Orthopaedics (Dr. Rohit Verma)
- Fever/cough → General Medicine (Dr. Arjun Reddy)
- Women's health → Gynaecology (Dr. Priya Patel)
- Children's health → Paediatrics (Dr. Anil Kumar)

APPOINTMENT PROCESS:
1. Listen to symptoms
2. Suggest appropriate department
3. Ask for patient's full name
4. Offer available time slots
5. Confirm appointment

AVAILABLE SLOTS: 10:00 AM, 11:30 AM, 2:00 PM, 3:30 PM, 5:00 PM

RESPONSE STYLE:
- First message: Warm Indian English greeting
- Keep it short and natural
- One question per response
- Use patient's name when known

Current date: ${new Date().toLocaleDateString('en-IN')}

Now respond to the last patient message appropriately:
`;
  }
}

export default GeminiService;