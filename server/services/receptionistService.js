import axios from 'axios';

// In-memory storage for conversation states and learning
const conversationStates = new Map();
const learningSystem = {
  symptoms: new Map(), // symptom -> department mapping
  intents: new Map(), // phrase -> intent mapping
  successfulBookings: new Map(),
  lastLearned: new Date()
};

// Initialize with comprehensive medical knowledge
function initializeMedicalKnowledge() {
  // Symptom to department mapping - EXPANDED
  const initialKnowledge = {
    // Cardiology
    'chest pain': 'Cardiology',
    'heart pain': 'Cardiology',
    'palpitations': 'Cardiology',
    'high blood pressure': 'Cardiology',
    'shortness of breath': 'Cardiology',
    'heart attack': 'Cardiology',
    'irregular heartbeat': 'Cardiology',
    
    // Gastroenterology - EXPANDED
    'stomach pain': 'Gastroenterology',
    'abdominal pain': 'Gastroenterology',
    'vomiting': 'Gastroenterology',
    'diarrhea': 'Gastroenterology',
    'constipation': 'Gastroenterology',
    'acid reflux': 'Gastroenterology',
    'heartburn': 'Gastroenterology',
    'bloating': 'Gastroenterology',
    'indigestion': 'Gastroenterology',
    'food poisoning': 'Gastroenterology',
    'liver problem': 'Gastroenterology',
    'jaundice': 'Gastroenterology',
    
    // Orthopedics - EXPANDED
    'back pain': 'Orthopedics',
    'joint pain': 'Orthopedics',
    'knee pain': 'Orthopedics',
    'shoulder pain': 'Orthopedics',
    'fracture': 'Orthopedics',
    'arthritis': 'Orthopedics',
    'bone pain': 'Orthopedics',
    'muscle pain': 'Orthopedics',
    'sciatica': 'Orthopedics',
    'sports injury': 'Orthopedics',
    
    // General Medicine - EXPANDED
    'fever': 'General Medicine',
    'cough': 'General Medicine',
    'cold': 'General Medicine',
    'headache': 'General Medicine',
    'body pain': 'General Medicine',
    'weakness': 'General Medicine',
    'fatigue': 'General Medicine',
    'infection': 'General Medicine',
    
    // ENT - EXPANDED
    'ear pain': 'ENT',
    'sore throat': 'ENT',
    'sinus': 'ENT',
    'hearing loss': 'ENT',
    'nose bleed': 'ENT',
    'tonsils': 'ENT',
    'vertigo': 'ENT',
    'ear infection': 'ENT',
    
    // Ophthalmology - EXPANDED
    'eye pain': 'Ophthalmology',
    'vision problems': 'Ophthalmology',
    'red eyes': 'Ophthalmology',
    'cataract': 'Ophthalmology',
    'glaucoma': 'Ophthalmology',
    'eye infection': 'Ophthalmology',
    
    // Dermatology - EXPANDED
    'skin rash': 'Dermatology',
    'acne': 'Dermatology',
    'itching': 'Dermatology',
    'hair loss': 'Dermatology',
    'psoriasis': 'Dermatology',
    'eczema': 'Dermatology',
    'allergy': 'Dermatology',
    'skin infection': 'Dermatology',
    
    // Gynecology - EXPANDED
    'pregnancy': 'Gynecology',
    'period pain': 'Gynecology',
    'menstrual issues': 'Gynecology',
    'pcos': 'Gynecology',
    'menopause': 'Gynecology',
    'breast pain': 'Gynecology',
    'vaginal infection': 'Gynecology',
    
    // Pediatrics - EXPANDED
    'child fever': 'Pediatrics',
    'child cough': 'Pediatrics',
    'vaccination': 'Pediatrics',
    'teething': 'Pediatrics',
    'growth issues': 'Pediatrics',
    
    // Neurology - EXPANDED
    'migraine': 'Neurology',
    'dizziness': 'Neurology',
    'seizure': 'Neurology',
    'parkinson': 'Neurology',
    'alzheimer': 'Neurology',
    'memory loss': 'Neurology',
    
    // Urology
    'uti': 'Urology',
    'kidney stone': 'Urology',
    'prostate': 'Urology',
    'urinary infection': 'Urology',
    
    // Psychiatry
    'depression': 'Psychiatry',
    'anxiety': 'Psychiatry',
    'stress': 'Psychiatry',
    'insomnia': 'Psychiatry'
  };

  Object.entries(initialKnowledge).forEach(([symptom, department]) => {
    learningSystem.symptoms.set(symptom.toLowerCase(), department);
  });

  // Intent mapping for administrative phrases
  const initialIntents = {
    'book appointment': 'booking_request',
    'make appointment': 'booking_request',
    'schedule appointment': 'booking_request',
    'i want to book': 'booking_request',
    "i'd like to book": 'booking_request',
    'can i book': 'booking_request',
    'need appointment': 'booking_request',
    'want appointment': 'booking_request',
    'cancel appointment': 'cancellation_request',
    'reschedule appointment': 'reschedule_request',
    'change appointment': 'reschedule_request',
    'available slots': 'availability_check',
    'doctor availability': 'availability_check',
    'emergency': 'emergency_situation'
  };

  Object.entries(initialIntents).forEach(([phrase, intent]) => {
    learningSystem.intents.set(phrase.toLowerCase(), intent);
  });
}

// Initialize knowledge base
initializeMedicalKnowledge();

export class ReceptionistService {
  /**
   * Main entry point for receptionist AI
   */
  static async generateResponse(conversationHistory = [], currentPatient = null, phoneNumber = null, callId = null) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    if (!apiKey) {
      console.error('❌ GOOGLE_API_KEY is missing');
      return this.getSmartResponse(conversationHistory, 'no_api_key');
    }

    // Get or create conversation state
    const stateKey = callId || phoneNumber || 'default';
    let conversationState = conversationStates.get(stateKey);
    
    if (!conversationState) {
      conversationState = {
        step: 'welcome', // welcome → medical_issue → doctor_suggestion → timing → patient_info → confirmation → complete
        intent: null,
        medicalIssue: null,
        department: null,
        doctor: null,
        suggestedSlots: [],
        patientName: null,
        patientAge: null,
        confirmedSlot: null,
        lastUpdated: Date.now(),
        conversationCount: 0
      };
      conversationStates.set(stateKey, conversationState);
    }

    // Update conversation count
    conversationState.conversationCount++;
    conversationState.lastUpdated = Date.now();

    // Process user input and update state
    this.processUserInput(conversationHistory, conversationState);
    
    // Build prompt based on current state
    const prompt = this.buildReceptionistPrompt(conversationHistory, currentPatient, conversationState);

    try {
      console.log('🧠 Receptionist AI processing...');
      console.log('📊 Current State:', conversationState);

      const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            maxOutputTokens: 200
          }
        },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const candidate = response.data?.candidates?.[0];
      const rawText = candidate?.content?.parts?.[0]?.text;

      if (rawText && typeof rawText === 'string') {
        const cleaned = this.cleanResponse(rawText, conversationHistory);
        
        // Update state and learn from interaction
        conversationStates.set(stateKey, conversationState);
        this.learnFromInteraction(conversationHistory, conversationState);
        
        console.log('✅ Receptionist AI Success:', cleaned.substring(0, 100) + '...');
        return {
          text: cleaned,
          timestamp: new Date().toISOString(),
          source: 'receptionist_ai',
          state: { ...conversationState }
        };
      }

      console.error('❌ Unexpected response format');
      return this.getSmartResponse(conversationHistory, 'invalid_response');
    } catch (error) {
      console.error('❌ Receptionist AI failed:', error.message);
      return this.getSmartResponse(conversationHistory, 'api_error');
    }
  }

  /**
   * Process user input and update conversation state
   */
  static processUserInput(conversationHistory, state) {
    const lastUserMessage = conversationHistory[conversationHistory.length - 1]?.content?.toLowerCase() || '';
    
    if (!lastUserMessage) return;

    console.log('🔄 Processing user input for state:', state.step);

    // STEP 1: Welcome → Detect Symptom or Intent
    if (state.step === 'welcome') {
      // Check if user directly mentions symptoms
      const directSymptom = this.extractMedicalIssue(lastUserMessage);
      if (directSymptom) {
        state.medicalIssue = directSymptom;
        state.department = this.getDepartmentForSymptom(directSymptom);
        state.doctor = this.getDoctorForDepartment(state.department);
        state.step = 'doctor_suggestion';
        console.log(`🔄 State: welcome → doctor_suggestion (Direct symptom: ${directSymptom})`);
        return;
      }

      // Check for booking intent
      const intent = this.detectIntent(lastUserMessage);
      if (intent) {
        state.intent = intent;
        state.step = intent === 'booking_request' ? 'medical_issue' : 'handle_special_intent';
        console.log(`🔄 State: welcome → ${state.step} (Intent: ${intent})`);
        return;
      }

      // If no symptom or intent detected, stay in welcome
      console.log('🔄 State: welcome → welcome (No clear intent/symptom)');
      return;
    }

    // STEP 2: Handle Medical Issue for Booking
    if (state.step === 'medical_issue' && !state.medicalIssue) {
      const medicalIssue = this.extractMedicalIssue(lastUserMessage);
      if (medicalIssue) {
        state.medicalIssue = medicalIssue;
        state.department = this.getDepartmentForSymptom(medicalIssue);
        state.doctor = this.getDoctorForDepartment(state.department);
        state.step = 'doctor_suggestion';
        console.log('🔄 State: medical_issue → doctor_suggestion');
        return;
      }
    }

    // STEP 3: Doctor Suggestion → Timing Preference
    if (state.step === 'doctor_suggestion') {
      // If user confirms or asks for timing, OR if they came from direct symptom
      if (
        lastUserMessage.includes('yes') || 
        lastUserMessage.includes('available') || 
        lastUserMessage.includes('time') || 
        lastUserMessage.includes('okay') ||
        lastUserMessage.includes('book') || 
        lastUserMessage.includes('schedule')
      ) {
        state.suggestedSlots = this.generateAvailableSlots();
        state.step = 'timing';
        console.log('🔄 State: doctor_suggestion → timing');
        return;
      }
      
      // If user says no or wants different doctor
      if (
        lastUserMessage.includes('no') || 
        lastUserMessage.includes('other') || 
        lastUserMessage.includes('different')
      ) {
        state.step = 'medical_issue';
        console.log('🔄 State: doctor_suggestion → medical_issue (User wants different doctor)');
        return;
      }
    }

    // STEP 4: Timing → Patient Info
    if (state.step === 'timing') {
      const slotMatch = this.extractTimeSlot(lastUserMessage);
      if (slotMatch) {
        state.confirmedSlot = slotMatch;
        state.step = 'patient_info';
        console.log('🔄 State: timing → patient_info');
        return;
      }
      
      // If user says they're available at specific time
      if (lastUserMessage.match(/(10|11|2|3|4|5|9|1|6|7|8)/)) {
        const timeMatch = this.extractTimeFromMessage(lastUserMessage);
        if (timeMatch) {
          state.confirmedSlot = timeMatch;
          state.step = 'patient_info';
          console.log('🔄 State: timing → patient_info (Time specified)');
          return;
        }
      }
    }

    // STEP 5: Patient Info → Confirmation
    if (state.step === 'patient_info') {
      // Extract name
      if (!state.patientName) {
        const name = this.extractName(lastUserMessage);
        if (name) {
          state.patientName = name;
          console.log('📝 Extracted patient name:', name);
          return;
        }
      }

      // Extract age
      if (state.patientName && !state.patientAge) {
        const age = this.extractAge(lastUserMessage);
        if (age) {
          state.patientAge = age;
          state.step = 'confirmation';
          console.log('🔄 State: patient_info → confirmation');
          return;
        }
      }
    }

    // STEP 6: Confirmation → Complete
    if (state.step === 'confirmation') {
      if (
        lastUserMessage.includes('yes') || 
        lastUserMessage.includes('confirm') || 
        lastUserMessage.includes('okay') || 
        lastUserMessage.includes('correct')
      ) {
        state.step = 'complete';
        console.log('🔄 State: confirmation → complete');
        // Learn from successful booking
        this.learnFromSuccessfulBooking(state.medicalIssue, state.department);
        return;
      }
      
      // If user says no, go back to timing
      if (lastUserMessage.includes('no') || lastUserMessage.includes('wrong')) {
        state.step = 'timing';
        console.log('🔄 State: confirmation → timing (Need to reschedule)');
        return;
      }
    }

    console.log('🔄 No state change detected');
  }

  /**
   * Detect user intent
   */
  static detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check against known intents
    for (const [phrase, intent] of learningSystem.intents) {
      if (lowerMessage.includes(phrase)) {
        return intent;
      }
    }

    // Auto-learn common booking phrases (but not if it's a direct symptom)
    const bookingPhrases = ['book', 'appointment', 'schedule', 'see doctor', 'meet doctor', 'want to see'];
    const isBookingRelated = bookingPhrases.some(phrase => lowerMessage.includes(phrase));
    
    if (isBookingRelated) {
      // Check if this is actually a direct symptom mention
      const potentialSymptom = this.extractMedicalIssue(lowerMessage);
      if (!potentialSymptom) {
        // Learn this new phrase only if it's not a symptom
        if (!learningSystem.intents.has(lowerMessage)) {
          learningSystem.intents.set(lowerMessage, 'booking_request');
          console.log(`🧠 Learned new intent: "${lowerMessage}" -> booking_request`);
        }
        return 'booking_request';
      }
    }

    return null;
  }

  /**
   * Extract medical issue from user message
   */
  static extractMedicalIssue(message) {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced patterns for direct symptom mentions
    const symptomPatterns = [
      /(i have|i'm having|i feel|feeling|suffering from|experiencing|got|having)\s+([^,.!?]+)/i,
      /(my|the)\s+([^,.!?]+)\s+(hurts|pain|ache|problem|issue)/i,
      /(pain|ache|problem|issue)\s+(in|with)\s+([^,.!?]+)/i
    ];

    // Try to extract symptom using patterns first
    for (const pattern of symptomPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        const potentialSymptom = match[2] || match[3] || match[1];
        const cleanSymptom = potentialSymptom.trim();
        
        // Check if this matches known symptoms
        for (const [symptom] of learningSystem.symptoms) {
          if (cleanSymptom.includes(symptom) || symptom.includes(cleanSymptom)) {
            return symptom;
          }
        }
        
        // If it's a new symptom, learn it
        if (cleanSymptom.length > 3 && cleanSymptom.length < 50) {
          const department = this.guessDepartmentFromSymptom(cleanSymptom);
          learningSystem.symptoms.set(cleanSymptom, department);
          console.log(`🧠 Learned new symptom: "${cleanSymptom}" -> ${department}`);
          return cleanSymptom;
        }
      }
    }

    // Direct check against known symptoms
    for (const [symptom] of learningSystem.symptoms) {
      if (lowerMessage.includes(symptom)) {
        return symptom;
      }
    }

    // Enhanced body part detection
    const bodyParts = [
      'head', 'eye', 'ear', 'nose', 'throat', 'mouth', 'tooth', 'gum', 'jaw', 'neck',
      'shoulder', 'chest', 'heart', 'lung', 'stomach', 'abdomen', 'back', 'spine',
      'arm', 'elbow', 'wrist', 'hand', 'finger', 'leg', 'thigh', 'knee', 'ankle',
      'foot', 'heel', 'hip', 'pelvis', 'kidney', 'liver', 'bladder', 'prostate',
      'skin', 'hair', 'nail', 'bone', 'joint', 'muscle', 'tongue', 'lip', 'face'
    ];

    for (const part of bodyParts) {
      if (lowerMessage.includes(part)) {
        // Check for pain patterns
        const painPatterns = [
          `${part} pain`,
          `pain in ${part}`,
          `hurting ${part}`,
          `sore ${part}`,
          `${part} ache`,
          `ache in ${part}`
        ];

        for (const pattern of painPatterns) {
          if (lowerMessage.includes(pattern)) {
            const symptom = pattern;
            if (!learningSystem.symptoms.has(symptom)) {
              const department = this.guessDepartmentFromBodyPart(part);
              learningSystem.symptoms.set(symptom, department);
              console.log(`🧠 Learned new symptom: "${symptom}" -> ${department}`);
            }
            return symptom;
          }
        }
      }
    }

    return null;
  }

  /**
   * Guess department based on symptom content
   */
  static guessDepartmentFromSymptom(symptom) {
    const lowerSymptom = symptom.toLowerCase();
    
    if (lowerSymptom.includes('chest') || lowerSymptom.includes('heart')) 
      return 'Cardiology';
    if (lowerSymptom.includes('stomach') || lowerSymptom.includes('abdomen') || lowerSymptom.includes('vomit'))
      return 'Gastroenterology';
    if (lowerSymptom.includes('back') || lowerSymptom.includes('joint') || lowerSymptom.includes('bone'))
      return 'Orthopedics';
    if (lowerSymptom.includes('eye') || lowerSymptom.includes('vision'))
      return 'Ophthalmology';
    if (lowerSymptom.includes('ear') || lowerSymptom.includes('nose') || lowerSymptom.includes('throat'))
      return 'ENT';
    if (lowerSymptom.includes('skin') || lowerSymptom.includes('rash') || lowerSymptom.includes('hair'))
      return 'Dermatology';
    if (lowerSymptom.includes('pregnancy') || lowerSymptom.includes('period') || lowerSymptom.includes('breast'))
      return 'Gynecology';
    if (lowerSymptom.includes('child') || lowerSymptom.includes('baby'))
      return 'Pediatrics';
    if (lowerSymptom.includes('mental') || lowerSymptom.includes('depression') || lowerSymptom.includes('anxiety'))
      return 'Psychiatry';
    
    return 'General Medicine';
  }

  /**
   * Guess department based on body part
   */
  static guessDepartmentFromBodyPart(bodyPart) {
    const departmentMapping = {
      head: 'General Medicine',
      eye: 'Ophthalmology',
      ear: 'ENT',
      nose: 'ENT',
      throat: 'ENT',
      mouth: 'Dentistry',
      tooth: 'Dentistry',
      gum: 'Dentistry',
      jaw: 'Dentistry',
      neck: 'Orthopedics',
      shoulder: 'Orthopedics',
      chest: 'Cardiology',
      heart: 'Cardiology',
      lung: 'Pulmonology',
      stomach: 'Gastroenterology',
      abdomen: 'Gastroenterology',
      back: 'Orthopedics',
      spine: 'Orthopedics',
      arm: 'Orthopedics',
      elbow: 'Orthopedics',
      wrist: 'Orthopedics',
      hand: 'Orthopedics',
      finger: 'Orthopedics',
      leg: 'Orthopedics',
      thigh: 'Orthopedics',
      knee: 'Orthopedics',
      ankle: 'Orthopedics',
      foot: 'Orthopedics',
      heel: 'Orthopedics',
      hip: 'Orthopedics',
      pelvis: 'Orthopedics',
      kidney: 'Urology',
      liver: 'Gastroenterology',
      bladder: 'Urology',
      prostate: 'Urology',
      skin: 'Dermatology',
      hair: 'Dermatology',
      nail: 'Dermatology',
      bone: 'Orthopedics',
      joint: 'Orthopedics',
      muscle: 'Orthopedics',
      tongue: 'Dentistry',
      lip: 'Dentistry',
      face: 'Dermatology'
    };

    return departmentMapping[bodyPart] || 'General Medicine';
  }

  /**
   * Get department for symptom
   */
  static getDepartmentForSymptom(symptom) {
    if (!symptom) return 'General Medicine';
    const key = symptom.toLowerCase();
    return learningSystem.symptoms.get(key) || 'General Medicine';
  }

  /**
   * Get doctor for department
   */
  static getDoctorForDepartment(department) {
    const doctorMapping = {
      Cardiology: 'Dr. Meera Sharma',
      Gastroenterology: 'Dr. Kavya Nair',
      Orthopedics: 'Dr. Rohit Verma',
      'General Medicine': 'Dr. Arjun Reddy',
      ENT: 'Dr. Rajesh Kumar',
      Ophthalmology: 'Dr. Anjali Mehta',
      Dermatology: 'Dr. Shruti Jain',
      Gynecology: 'Dr. Priya Patel',
      Pediatrics: 'Dr. Anil Kumar',
      Neurology: 'Dr. Nikhil Rao',
      Dentistry: 'Dr. Priya Sharma',
      Urology: 'Dr. Arvind Patel',
      Psychiatry: 'Dr. Riya Desai',
      Pulmonology: 'Dr. Sameer Khan'
    };

    return doctorMapping[department] || 'Dr. Arjun Reddy';
  }

  /**
   * Generate available time slots
   */
  static generateAvailableSlots() {
    const baseSlots = ['9:00 AM', '10:30 AM', '11:00 AM', '2:00 PM', '3:30 PM', '4:00 PM', '5:00 PM'];
    // Simulate some slots being booked
    return baseSlots.filter(() => Math.random() > 0.3).slice(0, 4);
  }

  /**
   * Extract time slot from user message
   */
  static extractTimeSlot(message) {
    const timePatterns = [
      /(10|11|2|3|4|5)\s*(am|pm|:00)/i,
      /(9|10|11|2|3|4|5)\s*(o'clock|clock)/i,
      /(morning|afternoon|evening)/i
    ];

    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  /**
   * Extract time from message (more flexible)
   */
  static extractTimeFromMessage(message) {
    const timeMatch = message.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] || '00';
      const period = timeMatch[3] ? timeMatch[3].toLowerCase() : (hour < 12 ? 'am' : 'pm');
      
      // Convert to 12-hour format if needed
      if (hour > 12 && period === 'pm') hour -= 12;
      
      return `${hour}:${minutes} ${period.toUpperCase()}`;
    }
    return null;
  }

  /**
   * Extract name from user message
   */
  static extractName(message) {
    const nameMatch = message.match(/(my name is|i am|call me|this is)\s+([a-z\s]{2,30})/i);
    if (nameMatch) {
      return nameMatch[2].trim();
    }
    
    // Simple name extraction for short responses
    const words = message.trim().split(/\s+/);
    if (
      words.length >= 1 && 
      words.length <= 3 && 
      !message.match(/\d/) && 
      message.length < 30
    ) {
      return message.trim();
    }
    
    return null;
  }

  /**
   * Extract age from user message
   */
  static extractAge(message) {
    const ageMatch = message.match(/(\d{1,3})\s*(years|yrs|year|yo)?/i);
    if (ageMatch) {
      const age = parseInt(ageMatch[1], 10);
      if (age > 1 && age < 120) {
        return age;
      }
    }
    return null;
  }

  /**
   * Learn from successful booking
   */
  static learnFromSuccessfulBooking(medicalIssue, department) {
    if (!medicalIssue || !department) return;
    
    const key = `${medicalIssue}->${department}`;
    const currentCount = learningSystem.successfulBookings.get(key) || 0;
    learningSystem.successfulBookings.set(key, currentCount + 1);
    
    console.log(`📊 Learning: Successful booking ${medicalIssue} -> ${department} (count: ${currentCount + 1})`);
  }

  /**
   * Learn from interaction
   */
  static learnFromInteraction(conversationHistory, state) {
    // Additional learning logic can be implemented here
    learningSystem.lastLearned = new Date();
  }

  /**
   * Build receptionist prompt based on current state
   */
  static buildReceptionistPrompt(conversationHistory, currentPatient, state) {
    const limitedHistory = conversationHistory.slice(-6);
    
    const conversationText = limitedHistory
      .map((msg) => {
        const speaker = msg.role === 'assistant' ? 'Assistant' : 'Caller';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    const today = new Date().toLocaleDateString('en-IN');

    // Determine response based on current state
    let systemInstruction = '';
    let expectedResponse = '';

    switch (state.step) {
      case 'welcome':
        systemInstruction = 'Welcome the caller and ask how you can help them. Be ready to handle both booking requests and direct symptom mentions.';
        expectedResponse = 'Welcome to Aditya Hospital. How can I assist you today?';
        break;
      
      case 'medical_issue':
        systemInstruction = 'The caller wants to book an appointment. Ask what health issue or symptom they are experiencing.';
        expectedResponse = 'What health issue or symptom would you like to see the doctor for?';
        break;
      
      case 'doctor_suggestion':
        if (state.medicalIssue && state.doctor) {
          systemInstruction = `Caller mentioned: "${state.medicalIssue}". This is handled by ${state.department}. Suggest ${state.doctor} and ask if they would like to book with them. If they came from direct symptom, make it natural.`;
          expectedResponse = `For ${state.medicalIssue}, I recommend ${state.doctor} in ${state.department}. Would you like to book an appointment with them?`;
        } else {
          systemInstruction = 'Suggest an appropriate doctor based on the symptom mentioned.';
          expectedResponse = 'I can help you book an appointment with the right specialist.';
        }
        break;
      
      case 'timing':
        systemInstruction = `Caller is booking with ${state.doctor} for ${state.medicalIssue}. Offer available time slots. Be flexible if they suggest their own time.`;
        expectedResponse = `Available slots with ${state.doctor}: ${state.suggestedSlots.join(', ')}. Which time works for you?`;
        break;
      
      case 'patient_info':
        if (!state.patientName) {
          systemInstruction = 'Caller has selected a time slot. Ask for their full name.';
          expectedResponse = 'What is your full name?';
        } else if (!state.patientAge) {
          systemInstruction = `Caller provided name: ${state.patientName}. Now ask for their age.`;
          expectedResponse = `Thank you ${state.patientName}. What is your age?`;
        }
        break;
      
      case 'confirmation':
        systemInstruction = `Confirm appointment: ${state.patientName} (${state.patientAge}) with ${state.doctor} for ${state.medicalIssue} at ${state.confirmedSlot}.`;
        expectedResponse = `Confirming: ${state.patientName}, appointment with ${state.doctor} for ${state.medicalIssue} at ${state.confirmedSlot}. Is this correct?`;
        break;
      
      case 'complete':
        systemInstruction = 'Appointment is confirmed. Provide final details and thank the caller.';
        expectedResponse = `Your appointment is confirmed ${state.patientName}. Please arrive 15 minutes early. Thank you for choosing Aditya Hospital!`;
        break;
      
      default:
        systemInstruction = 'Help the caller with their inquiry.';
        expectedResponse = 'How can I help you today?';
    }

    const prompt = `
You are Clara, an AI receptionist for Aditya Hospital. You are having a REAL-TIME PHONE CALL.

CURRENT CONVERSATION STATE:
- Step: ${state.step}
- Intent: ${state.intent || 'Not detected'}
- Medical Issue: ${state.medicalIssue || 'Not provided'}
- Department: ${state.department || 'Not assigned'}
- Doctor: ${state.doctor || 'Not assigned'}
- Patient Name: ${state.patientName || 'Not provided'}
- Selected Slot: ${state.confirmedSlot || 'Not selected'}

CONVERSATION HISTORY:
${conversationText}

SYSTEM INSTRUCTION: ${systemInstruction}

CRITICAL RULES - FOLLOW EXACTLY:
1. ${expectedResponse}
2. Keep response to 1-2 SHORT sentences maximum
3. Speak naturally like a human receptionist
4. Use patient's name if known: ${state.patientName || 'not known yet'}
5. NEVER ask for information we already have
6. NEVER backtrack in conversation flow
7. If confirming appointment, be very clear about details
8. NEVER start with "Okay," "Alright," or "I understand"
9. If patient mentions symptom directly, acknowledge it naturally

TODAY'S DATE: ${today}

Now respond naturally (1-2 short sentences) following the rules above:`;

    return prompt;
  }

  /**
   * Clean up response
   */
  static cleanResponse(rawText, conversationHistory = []) {
    let text = (rawText || '').trim();
    if (!text) {
      return 'How can I help you with your appointment today?';
    }

    // Remove common filler patterns
    const fillerPatterns = [
      /^(okay|ok|alright|sure|yes|no)[\s,\.\-!]+/i,
      /^i\s+understand[\s,\.\-!]*/i,
      /^i\s+see[\s,\.\-!]*/i,
      /^thank you for that[\s,\.\-!]*/i,
      /^great[,\s!]*/i
    ];

    fillerPatterns.forEach(pattern => {
      text = text.replace(pattern, '').trim();
    });

    return text || 'How can I help you with your appointment today?';
  }

  /**
   * Fallback responses
   */
  static getSmartResponse(conversationHistory, errorType) {
    const genericResponses = [
      'How can I help you with your appointment today?',
      'What would you like to schedule an appointment for?',
      'How can I assist you with your healthcare needs?'
    ];

    return {
      text: genericResponses[Math.floor(Math.random() * genericResponses.length)],
      timestamp: new Date().toISOString(),
      source: 'fallback'
    };
  }

  /**
   * Get learning statistics
   */
  static getLearningStats() {
    return {
      totalSymptoms: learningSystem.symptoms.size,
      totalIntents: learningSystem.intents.size,
      successfulBookings: Array.from(learningSystem.successfulBookings.entries()),
      lastLearned: learningSystem.lastLearned,
      activeConversations: conversationStates.size
    };
  }

  /**
   * Clean up old conversation states
   */
  static cleanupOldStates(maxAge = 30 * 60 * 1000) {
    const now = Date.now();
    for (const [key, state] of conversationStates.entries()) {
      if (now - state.lastUpdated > maxAge) {
        conversationStates.delete(key);
        console.log('🧹 Cleaned up old conversation state:', key);
      }
    }
  }
}

// Clean up every 10 minutes
setInterval(() => {
  ReceptionistService.cleanupOldStates();
}, 10 * 60 * 1000);

export default ReceptionistService;
