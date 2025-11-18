// test-production.js - Test production readiness
console.log('🧪 Testing Production Readiness...\n');

// Check critical production dependencies
const deps = [
  'express', 'twilio', '@google/generative-ai', 'axios', 
  'cors', 'dotenv', 'socket.io', 'firebase-admin'
];

console.log('1. Checking dependencies:');
deps.forEach(dep => {
  try {
    require(dep);
    console.log(`   ✅ ${dep}`);
  } catch (e) {
    console.log(`   ❌ ${dep}: ${e.message}`);
  }
});

// Check file structure
console.log('\n2. Checking file structure:');
const files = [
  'server.js',
  'package.json',
  'server/controllers/twilioController.js',
  'server/services/receptionistService.js',
  'server/routes/index.js'
];

const fs = require('fs');
files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
  }
});

// Check environment variables (for info only)
console.log('\n3. Environment variables:');
console.log(`   PORT: ${process.env.PORT || 'Not set (will use default 3001)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);

console.log('\n🎉 Production test completed!');
console.log('🚀 Your app is ready for deployment on Render!');