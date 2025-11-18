// server/services/geminiService.js
import axios from 'axios';
import admin from 'firebase-admin';

// In-memory conversation state and learning data
const conversationStates = new Map();
const learningData = {
  symptoms: new Map(),
  departments: new Map(),
  successfulMappings: new Map(),
  failedMappings: new Map()
};

// Initialize with comprehensive medical knowledge
function initializeMedicalKnowledge() {
  // Comprehensive symptom-to-department mapping
  const initialSymptoms = {
    // Head & Neurological
    'headache': 'Neurology', 'migraine': 'Neurology', 'dizziness': 'Neurology',
    'vertigo': 'ENT', 'seizure': 'Neurology', 'memory loss': 'Neurology',
    'confusion': 'Neurology', 'fainting': 'Cardiology', 'blackout': 'Neurology',
    
    // Eyes
    'blurred vision': 'Ophthalmology', 'eye pain': 'Ophthalmology', 'red eyes': 'Ophthalmology',
    'dry eyes': 'Ophthalmology', 'cataract': 'Ophthalmology', 'glaucoma': 'Ophthalmology',
    'vision loss': 'Ophthalmology', 'eye floaters': 'Ophthalmology', 'double vision': 'Neurology',
    
    // Ears
    'ear pain': 'ENT', 'hearing loss': 'ENT', 'tinnitus': 'ENT', 'ear discharge': 'ENT',
    'ear infection': 'ENT', 'ear popping': 'ENT', 'balance problems': 'ENT',
    
    // Nose
    'nose bleed': 'ENT', 'sinus': 'ENT', 'nasal congestion': 'ENT', 'loss of smell': 'ENT',
    'runny nose': 'ENT', 'sneezing': 'ENT', 'allergic rhinitis': 'ENT',
    
    // Throat & Mouth
    'sore throat': 'ENT', 'tonsils': 'ENT', 'hoarse voice': 'ENT', 'toothache': 'Dentistry',
    'gum bleeding': 'Dentistry', 'mouth ulcers': 'Dentistry', 'jaw pain': 'Dentistry',
    'difficulty swallowing': 'Gastroenterology', 'oral thrush': 'Dentistry', 'bad breath': 'Dentistry',
    
    // Neck & Shoulders
    'neck pain': 'Orthopedics', 'stiff neck': 'Orthopedics', 'whiplash': 'Orthopedics',
    'shoulder pain': 'Orthopedics', 'frozen shoulder': 'Orthopedics',
    
    // Respiratory
    'cough': 'Pulmonology', 'shortness of breath': 'Pulmonology', 'wheezing': 'Pulmonology',
    'chest congestion': 'Pulmonology', 'asthma': 'Pulmonology', 'pneumonia': 'Pulmonology',
    'bronchitis': 'Pulmonology', 'copd': 'Pulmonology', 'lung pain': 'Pulmonology',
    
    // Cardiovascular
    'chest pain': 'Cardiology', 'palpitations': 'Cardiology', 'high blood pressure': 'Cardiology',
    'low blood pressure': 'Cardiology', 'swelling legs': 'Cardiology', 'varicose veins': 'Vascular Surgery',
    'heart murmur': 'Cardiology', 'arrhythmia': 'Cardiology',
    
    // Gastrointestinal
    'stomach pain': 'Gastroenterology', 'vomiting': 'Gastroenterology', 'diarrhea': 'Gastroenterology',
    'constipation': 'Gastroenterology', 'acidity': 'Gastroenterology', 'heartburn': 'Gastroenterology',
    'bloating': 'Gastroenterology', 'indigestion': 'Gastroenterology', 'ibs': 'Gastroenterology',
    'liver issues': 'Gastroenterology', 'jaundice': 'Gastroenterology', 'gallstones': 'Gastroenterology',
    'appendicitis': 'General Surgery', 'food poisoning': 'Gastroenterology', 'hemorrhoids': 'General Surgery',
    'gerd': 'Gastroenterology', 'stomach ulcer': 'Gastroenterology', 'nausea': 'Gastroenterology',
    
    // Urological
    'urinary tract infection': 'Urology', 'kidney stones': 'Urology', 'frequent urination': 'Urology',
    'burning urination': 'Urology', 'prostate issues': 'Urology', 'incontinence': 'Urology',
    'blood in urine': 'Urology', 'kidney infection': 'Urology',
    
    // Musculoskeletal
    'back pain': 'Orthopedics', 'joint pain': 'Orthopedics', 'arthritis': 'Orthopedics',
    'fracture': 'Orthopedics', 'sprain': 'Orthopedics', 'muscle pain': 'Orthopedics',
    'sciatica': 'Orthopedics', 'osteoporosis': 'Orthopedics', 'leg pain': 'Orthopedics',
    'knee pain': 'Orthopedics', 'hip pain': 'Orthopedics', 'ankle pain': 'Orthopedics',
    'foot pain': 'Orthopedics', 'heel pain': 'Orthopedics', 'wrist pain': 'Orthopedics',
    'elbow pain': 'Orthopedics', 'muscle strain': 'Orthopedics',
    
    // Dermatological
    'skin rash': 'Dermatology', 'acne': 'Dermatology', 'eczema': 'Dermatology',
    'psoriasis': 'Dermatology', 'allergy': 'Dermatology', 'itching': 'Dermatology',
    'hair loss': 'Dermatology', 'dandruff': 'Dermatology', 'fungal infection': 'Dermatology',
    'boil': 'Dermatology', 'warts': 'Dermatology', 'skin growth': 'Dermatology',
    'hives': 'Dermatology', 'cold sores': 'Dermatology', 'shingles': 'Dermatology',
    
    // Endocrine
    'diabetes': 'Endocrinology', 'thyroid issues': 'Endocrinology', 'weight gain': 'Endocrinology',
    'weight loss': 'Endocrinology', 'pcos': 'Endocrinology', 'infertility': 'Endocrinology',
    
    // Mental Health
    'depression': 'Psychiatry', 'anxiety': 'Psychiatry', 'stress': 'Psychiatry',
    'insomnia': 'Psychiatry', 'panic attacks': 'Psychiatry', 'ocd': 'Psychiatry',
    
    // Women's Health
    'pregnancy': 'Gynecology', 'menstrual pain': 'Gynecology', 'menopause': 'Gynecology',
    'breast pain': 'Gynecology', 'endometriosis': 'Gynecology', 'uterine fibroids': 'Gynecology',
    'ovarian pain': 'Gynecology', 'vaginal infection': 'Gynecology', 'menstrual irregularities': 'Gynecology',
    
    // Children's Health
    'vaccination': 'Pediatrics', 'growth issues': 'Pediatrics', 'adhd': 'Pediatrics',
    'autism spectrum': 'Pediatrics', 'pediatric fever': 'Pediatrics', 'teething pain': 'Pediatrics',
    'bedwetting': 'Pediatrics', 'developmental issues': 'Pediatrics',
    
    // Elderly Health
    'dementia': 'Geriatrics', 'mobility issues': 'Geriatrics', 'parkinson': 'Neurology',
    'alzheimer': 'Neurology'
  };

  // Initialize learning data
  Object.entries(initialSymptoms).forEach(([symptom, department]) => {
    learningData.symptoms.set(symptom.toLowerCase(), department);
  });
}

// Initialize medical knowledge
initializeMedicalKnowledge();

export class GeminiService {
  /**
   * Main entry point with persistent state tracking
   */
  static async generateResponse(conversationHistory = [], currentPatient = null, phoneNumber = null, callId = null) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    if (!apiKey) {
      console.error('❌ GOOGLE_API_KEY is missing from environment variables');
      return this.getSmartResponse(conversationHistory, 'no_api_key');
    }

    // Get or create conversation state
    const stateKey = callId || phoneNumber || 'default';
    let conversationState = conversationStates.get(stateKey);
    
    if (!conversationState) {
      conversationState = {
        step: 'symptom', // symptom -> name -> age -> slots -> confirm -> complete
        symptom: null,
        name: null,
        age: null,
        department: null,
        doctor: null,
        confirmedSlot: null,
        lastUpdated: Date.now(),
        conversationCount: 0
      };
      conversationStates.set(stateKey, conversationState);
    }

    // Update conversation count
    conversationState.conversationCount++;
    conversationState.lastUpdated = Date.now();

    // PRE-PROCESSING: Handle language detection and off-topic content
    const preProcessedResponse = this.preProcessUserInput(conversationHistory, conversationState);
    if (preProcessedResponse) {
      return preProcessedResponse;
    }

    // Update state based on user input
    this.updateConversationState(conversationHistory, conversationState);
    
    const prompt = this.buildCompletePrompt(conversationHistory, currentPatient, conversationState);

    try {
      console.log('🧠 Attempting Gemini API call...');
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
            temperature: 0.3, // Lower temperature for more consistent medical responses
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
        const cleaned = this.postProcessText(rawText, conversationHistory);
        
        // Update state in storage
        conversationStates.set(stateKey, conversationState);
        
        console.log('✅ Gemini API SUCCESS:', cleaned.substring(0, 100) + '...');
        return {
          text: cleaned,
          timestamp: new Date().toISOString(),
          source: 'gemini',
          state: { ...conversationState } // Return copy for logging
        };
      }

      console.error('❌ Unexpected response format from Gemini');
      return this.getSmartResponse(conversationHistory, 'invalid_response');
    } catch (error) {
      console.error('❌ Gemini API failed:', {
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message
      });

      return this.getSmartResponse(conversationHistory, 'api_error');
    }
  }

  /**
   * Update conversation state based on user input - FIXED STATE MACHINE
   */
  static updateConversationState(conversationHistory, state) {
    const lastUserMessage = conversationHistory[conversationHistory.length - 1]?.content?.toLowerCase() || '';
    
    if (!lastUserMessage) return;

    console.log('🔄 Processing state update for:', state.step);

    // STEP 1: Extract symptom if we're in symptom step
    if (state.step === 'symptom') {
      const symptoms = this.extractSymptoms(lastUserMessage);
      if (symptoms.length > 0) {
        state.symptom = symptoms[0];
        const departmentInfo = this.getDepartmentForSymptom(state.symptom);
        state.department = departmentInfo.department;
        state.doctor = departmentInfo.doctor;
        state.step = 'name';
        console.log('🔄 State updated: symptom -> name');
        return;
      }
    }

    // STEP 2: Extract name if we're in name step
    if (state.step === 'name') {
      const name = this.extractName(lastUserMessage);
      if (name) {
        state.name = name;
        state.step = 'age';
        console.log('🔄 State updated: name -> age');
        return;
      }
    }

    // STEP 3: Extract age if we're in age step
    if (state.step === 'age') {
      const age = this.extractAge(lastUserMessage);
      if (age) {
        state.age = age;
        state.step = 'slots';
        console.log('🔄 State updated: age -> slots');
        return;
      }
    }

    // STEP 4: Handle slot selection
    if (state.step === 'slots') {
      const slotMatch = lastUserMessage.match(/\b(10|11|2|3|5)\s*(am|pm)?/i);
      if (slotMatch) {
        state.confirmedSlot = slotMatch[0];
        state.step = 'confirm';
        console.log('🔄 State updated: slots -> confirm');
        return;
      }
      
      // If user says yes to any slot, move to confirmation
      if (lastUserMessage.includes('yes') || lastUserMessage.includes('confirm')) {
        state.step = 'confirm';
        console.log('🔄 State updated: slots -> confirm');
        return;
      }
    }

    // STEP 5: Handle final confirmation
    if (state.step === 'confirm') {
      if (lastUserMessage.includes('yes') || lastUserMessage.includes('thank you') || lastUserMessage.includes('okay')) {
        state.step = 'complete';
        console.log('🔄 State updated: confirm -> complete');
        // Learn from successful booking
        this.learnFromSuccess(state.symptom, state.department);
        return;
      }
    }

    console.log('🔄 No state change detected');
  }

  /**
   * Extract name from user message
   */
  static extractName(message) {
    const nameMatch = message.match(/\b(my name is|i am|call me|this is)\s+([a-z\s]{2,30})/i);
    if (nameMatch) {
      return nameMatch[2].trim();
    }
    
    // If it's a simple name (2-3 words, no numbers, no medical terms)
    const words = message.trim().split(/\s+/);
    if (words.length >= 1 && words.length <= 3 && 
        !message.match(/\d/) && 
        !this.containsMedicalTerms(message) &&
        message.length < 30) {
      return message.trim();
    }
    
    return null;
  }

  /**
   * Check if message contains medical terms
   */
  static containsMedicalTerms(message) {
    const medicalTerms = [
      'pain', 'ache', 'fever', 'cough', 'cold', 'headache', 'stomach', 'doctor',
      'hospital', 'appointment', 'medicine', 'treatment', 'symptom', 'issue',
      'problem', 'health', 'medical', 'emergency', 'injury', 'bleeding'
    ];
    
    return medicalTerms.some(term => message.toLowerCase().includes(term));
  }

  /**
   * Extract age from user message
   */
  static extractAge(message) {
    const ageMatch = message.match(/\b(\d{1,3})\s*(years|yrs|year|yo)?\b/i);
    if (ageMatch) {
      const age = parseInt(ageMatch[1]);
      if (age > 1 && age < 120) {
        return age;
      }
    }
    return null;
  }

  /**
   * PRE-PROCESSING with state awareness
   */
  static preProcessUserInput(conversationHistory, state) {
    const lastMessage = conversationHistory[conversationHistory.length - 1]?.content?.toLowerCase() || '';
    
    if (!lastMessage) return null;

    // Emergency detection (highest priority)
    if (this.isEmergency(lastMessage)) {
      return {
        text: "This sounds like a medical emergency. Please go to the nearest hospital emergency department immediately or call 108 for an ambulance. Do not delay.",
        timestamp: new Date().toISOString(),
        source: 'emergency_handler'
      };
    }

    // Language detection
    const languageKeywords = {
      'tamil': 'Tamil', 'telugu': 'Telugu', 'hindi': 'Hindi', 
      'english': 'English', 'marathi': 'Marathi', 'bengali': 'Bengali'
    };

    for (const [key, language] of Object.entries(languageKeywords)) {
      if (lastMessage.includes(key)) {
        return {
          text: `I can understand ${language}. Please tell me what health issue you're experiencing.`,
          timestamp: new Date().toISOString(),
          source: 'language_handler'
        };
      }
    }

    // Off-topic content handling
    const offTopicKeywords = [
      'song', 'music', 'movie', 'video', 'youtube', 'facebook', 'instagram',
      'whatsapp', 'chat', 'sex', 'game', 'play', 'cricket', 'football', 'weather'
    ];

    const isOffTopic = offTopicKeywords.some(keyword => lastMessage.includes(keyword));
    if (isOffTopic) {
      return {
        text: "I'm here to help with hospital appointments and health concerns only. Please tell me what health issue you're facing.",
        timestamp: new Date().toISOString(),
        source: 'offtopic_handler'
      };
    }

    return null;
  }

  /**
   * Extract symptoms from user message - COMPREHENSIVE + SELF-LEARNING
   */
  static extractSymptoms(message) {
    const lowerMessage = message.toLowerCase();
    const symptoms = [];

    // Check against known symptoms
    for (const [symptom, department] of learningData.symptoms) {
      if (lowerMessage.includes(symptom)) {
        symptoms.push(symptom);
      }
    }

    // Enhanced body part pain detection
    const bodyParts = [
      'head', 'eye', 'ear', 'nose', 'throat', 'mouth', 'tooth', 'gum', 'jaw', 'neck',
      'shoulder', 'chest', 'heart', 'lung', 'stomach', 'abdomen', 'back', 'spine',
      'arm', 'elbow', 'wrist', 'hand', 'finger', 'leg', 'thigh', 'knee', 'ankle',
      'foot', 'heel', 'hip', 'pelvis', 'kidney', 'liver', 'bladder', 'prostate',
      'skin', 'hair', 'nail', 'bone', 'joint', 'muscle', 'tongue', 'lip', 'face',
      'forehead', 'temple', 'scalp', 'eyebrow', 'eyelid', 'nostril', 'lip', 'chin',
      'cheek', 'throat', 'windpipe', 'rib', 'breast', 'nipple', 'belly', 'navel',
      'groin', 'buttock', 'thigh', 'calf', 'shin', 'ankle', 'heel', 'sole', 'toe'
    ];

    // Check for body part + pain patterns
    bodyParts.forEach(part => {
      const patterns = [
        `${part} pain`,
        `${part} ache`,
        `pain in ${part}`,
        `ache in ${part}`,
        `hurting ${part}`,
        `sore ${part}`
      ];

      patterns.forEach(pattern => {
        if (lowerMessage.includes(pattern)) {
          const symptom = `${part} pain`;
          symptoms.push(symptom);
          
          // Learn new symptom if not already known
          if (!learningData.symptoms.has(symptom)) {
            this.learnNewSymptom(symptom, message);
          }
        }
      });
    });

    // Learn from context - if message contains medical terms but no known symptom
    if (symptoms.length === 0 && this.containsMedicalTerms(lowerMessage)) {
      const potentialSymptom = this.extractPotentialSymptom(lowerMessage);
      if (potentialSymptom) {
        symptoms.push(potentialSymptom);
        this.learnNewSymptom(potentialSymptom, message);
      }
    }

    return [...new Set(symptoms)]; // Remove duplicates
  }

  /**
   * Extract potential symptom from unknown medical description
   */
  static extractPotentialSymptom(message) {
    // Remove common filler words
    const cleaned = message.replace(/\b(i have|i'm having|i feel|feeling|having|got|get|my|me)\b/gi, '').trim();
    
    // Extract the main complaint (first 2-4 words after removal)
    const words = cleaned.split(/\s+/).slice(0, 4);
    if (words.length >= 1) {
      const potentialSymptom = words.join(' ').toLowerCase();
      
      // Only accept if it sounds like a medical symptom
      if (potentialSymptom.length > 3 && potentialSymptom.length < 50 && 
          !potentialSymptom.match(/^(yes|no|okay|alright|hello|hi)$/i)) {
        return potentialSymptom;
      }
    }
    
    return null;
  }

  /**
   * Learn new symptom and attempt to classify it
   */
  static learnNewSymptom(symptom, context) {
    console.log('🧠 Learning new symptom:', symptom);
    
    // Try to classify based on context
    let department = 'General Medicine';
    
    // Basic classification based on body parts
    if (symptom.includes('eye') || symptom.includes('vision')) {
      department = 'Ophthalmology';
    } else if (symptom.includes('ear') || symptom.includes('hearing')) {
      department = 'ENT';
    } else if (symptom.includes('tooth') || symptom.includes('gum') || symptom.includes('mouth')) {
      department = 'Dentistry';
    } else if (symptom.includes('heart') || symptom.includes('chest pain')) {
      department = 'Cardiology';
    } else if (symptom.includes('stomach') || symptom.includes('abdomen') || symptom.includes('digest')) {
      department = 'Gastroenterology';
    } else if (symptom.includes('skin') || symptom.includes('rash') || symptom.includes('hair')) {
      department = 'Dermatology';
    } else if (symptom.includes('bone') || symptom.includes('joint') || symptom.includes('muscle')) {
      department = 'Orthopedics';
    } else if (symptom.includes('pregnancy') || symptom.includes('period') || symptom.includes('breast')) {
      department = 'Gynecology';
    } else if (symptom.includes('child') || symptom.includes('baby') || symptom.includes('pediatric')) {
      department = 'Pediatrics';
    }
    
    learningData.symptoms.set(symptom, department);
    console.log(`📚 Learned: "${symptom}" -> ${department}`);
  }

  /**
   * Learn from successful appointment booking
   */
  static learnFromSuccess(symptom, department) {
    if (!symptom || !department) return;
    
    const key = `${symptom}->${department}`;
    const currentCount = learningData.successfulMappings.get(key) || 0;
    learningData.successfulMappings.set(key, currentCount + 1);
    
    console.log(`📊 Learning: Successful mapping ${symptom} -> ${department} (count: ${currentCount + 1})`);
  }

  /**
   * Get department for symptom with fallback
   */
  static getDepartmentForSymptom(symptom) {
    const department = learningData.symptoms.get(symptom) || 'General Medicine';
    const doctor = this.getDoctorForDepartment(department);
    
    return { department, doctor };
  }

  /**
   * Get doctor for department
   */
  static getDoctorForDepartment(department) {
    const doctorMapping = {
      'Neurology': 'Dr. Nikhil Rao',
      'Ophthalmology': 'Dr. Anjali Mehta', 
      'ENT': 'Dr. Rajesh Kumar',
      'Dentistry': 'Dr. Priya Sharma',
      'Pulmonology': 'Dr. Sameer Khan',
      'Cardiology': 'Dr. Meera Sharma',
      'Gastroenterology': 'Dr. Kavya Nair',
      'Urology': 'Dr. Arvind Patel',
      'Orthopedics': 'Dr. Rohit Verma',
      'Dermatology': 'Dr. Shruti Jain',
      'Endocrinology': 'Dr. Vikram Singh',
      'Psychiatry': 'Dr. Riya Desai',
      'Gynecology': 'Dr. Priya Patel',
      'Pediatrics': 'Dr. Anil Kumar',
      'Geriatrics': 'Dr. Suresh Menon',
      'General Medicine': 'Dr. Arjun Reddy',
      'General Surgery': 'Dr. Sanjay Gupta',
      'Vascular Surgery': 'Dr. Anil Joshi'
    };

    return doctorMapping[department] || 'Dr. Arjun Reddy';
  }

  /**
   * Clean up Gemini output
   */
  static postProcessText(rawText, conversationHistory = []) {
    let text = (rawText || '').trim();
    if (!text) {
      return 'How can I help you with your health concern today?';
    }

    // Remove common filler patterns
    const fillerPatterns = [
      /^(okay|ok|alright|sure|yes|no)[\s,.\-!]+/i,
      /^i\s+understand[\s,.\-!]*/i,
      /^i\s+see[\s,.\-!]*/i,
      /^thank you for that[\s,.\-!]*/i,
      /^great[,\s!]*/i
    ];

    fillerPatterns.forEach(pattern => {
      text = text.replace(pattern, '').trim();
    });

    return text || 'How can I help you with your health concern today?';
  }

  /**
   * Fallback logic when Gemini fails
   */
  static getSmartResponse(conversationHistory, errorType) {
    const lastMessage = conversationHistory[conversationHistory.length - 1]?.content?.toLowerCase() || '';

    console.log(`🔄 Using smart response for: "${lastMessage.substring(0, 60)}..."`);

    // Emergency situations
    if (this.isEmergency(lastMessage)) {
      return {
        text: 'This sounds like a medical emergency. Please go to the nearest hospital emergency department immediately or call 108 for an ambulance.',
        timestamp: new Date().toISOString(),
        source: 'emergency_fallback'
      };
    }

    // Generic responses based on context
    const genericResponses = [
      'What health issue would you like to discuss?',
      'How can I help you with your health concern today?',
      'What brings you to Aditya Hospital today?',
      'Please tell me what health issue you are experiencing.'
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
      'cannot breathe', 'unconscious', 'passed out', 'heavy bleeding',
      'severe bleeding', 'stroke', 'paralysis', 'accident', 'emergency',
      'choking', 'burn', 'poison', 'overdose', 'seizure'
    ];

    const lower = message.toLowerCase();
    return emergencyKeywords.some((keyword) => lower.includes(keyword));
  }

  /**
   * Build complete prompt with FIXED state machine
   */
  static buildCompletePrompt(conversationHistory, currentPatient, state) {
    const limitedHistory = (conversationHistory || []).slice(-6);
    
    const conversationText = limitedHistory
      .map((msg) => {
        const speaker = msg.role === 'assistant' ? 'Assistant' : 'Caller';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n');

    const today = new Date().toLocaleDateString('en-IN');
    const availableSlots = ['10:00 AM', '11:30 AM', '2:00 PM', '3:30 PM', '5:00 PM'];

    // Determine response based on current state
    let systemInstruction = '';
    let expectedResponse = '';

    switch (state.step) {
      case 'symptom':
        systemInstruction = 'Ask the caller what health issue they are experiencing.';
        expectedResponse = 'Ask: "What health issue are you experiencing?"';
        break;
      
      case 'name':
        systemInstruction = `The caller mentioned: "${state.symptom}". Ask for their full name.`;
        expectedResponse = `Ask: "What is your full name?"`;
        break;
      
      case 'age':
        systemInstruction = `Caller name: ${state.name}, Symptom: ${state.symptom}. Ask for their age.`;
        expectedResponse = `Ask: "What is your age, ${state.name}?"`;
        break;
      
      case 'slots':
        systemInstruction = `Caller: ${state.name} (${state.age || 'age not provided'}), Symptom: ${state.symptom}, Department: ${state.department}. Offer time slots.`;
        expectedResponse = `Offer 2-3 time slots from the available slots and ask which one they prefer.`;
        break;
      
      case 'confirm':
        systemInstruction = `Confirm the appointment for ${state.name} with ${state.doctor} in ${state.department} for their ${state.symptom}.`;
        expectedResponse = `Confirm the appointment details and ask if they need anything else.`;
        break;
      
      case 'complete':
        systemInstruction = `The appointment booking is complete. Provide closing remarks.`;
        expectedResponse = `Thank the caller and provide any final instructions.`;
        break;
    }

    const prompt = `
You are Clara, an AI receptionist for Aditya Hospital. You are having a REAL-TIME PHONE CALL.

CURRENT CONVERSATION STATE:
- Step: ${state.step}
- Symptom: ${state.symptom || 'Not provided'}
- Name: ${state.name || 'Not provided'}
- Age: ${state.age || 'Not provided'}
- Department: ${state.department || 'Not assigned'}
- Doctor: ${state.doctor || 'Not assigned'}

SYSTEM INSTRUCTION: ${systemInstruction}

CONVERSATION HISTORY:
${conversationText || 'First message'}

CRITICAL RULES - FOLLOW EXACTLY:
1. ${expectedResponse}
2. Keep response to 1-2 SHORT sentences maximum
3. Speak naturally like a human receptionist
4. Use the patient's name if known: ${state.name || 'not known yet'}
5. NEVER ask for information we already have
6. NEVER backtrack in the conversation flow
7. If in slots step, offer specific time slots
8. NEVER start with "Okay," "Alright," or "I understand"

AVAILABLE TIME SLOTS: ${availableSlots.join(', ')}

TODAY'S DATE: ${today}

Now respond naturally (1-2 short sentences) following the rules above:`;

    return prompt;
  }

  /**
   * Get learning statistics (for monitoring)
   */
  static getLearningStats() {
    return {
      totalSymptoms: learningData.symptoms.size,
      successfulMappings: Array.from(learningData.successfulMappings.entries()),
      recentConversations: conversationStates.size
    };
  }

  /**
   * Clean up old conversation states
   */
  static cleanupOldStates(maxAge = 30 * 60 * 1000) { // 30 minutes
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
  GeminiService.cleanupOldStates();
}, 10 * 60 * 1000);

export default GeminiService;