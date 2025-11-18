import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testGeminiAPI() {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.log('❌ GOOGLE_API_KEY is missing from .env file');
    return;
  }

  console.log('🔑 Testing API Key:', apiKey.substring(0, 10) + '...');

  // Test with the most basic endpoint
  const testEndpoints = [
    'https://generativelanguage.googleapis.com/v1/models',
    'https://generativelanguage.googleapis.com/v1beta/models'
  ];

  for (const endpoint of testEndpoints) {
    try {
      console.log(`🔄 Testing ${endpoint}...`);
      const response = await axios.get(`${endpoint}?key=${apiKey}`);
      
      if (response.data && response.data.models) {
        console.log('✅ API Key is VALID! Available models:');
        response.data.models.forEach(model => {
          console.log(`   - ${model.name} (${model.supportedGenerationMethods?.join(', ') || 'no methods'})`);
        });
        return;
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
    }
  }

  console.log('❌ All API endpoints failed. Your API key might be invalid or not have Gemini API access.');
}

testGeminiAPI();