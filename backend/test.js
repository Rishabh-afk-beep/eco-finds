//test.js - To check Groq SDK connection and /api/chat route
const axios = require('axios');

async function checkChatApi() {
  try {
    // Test Groq SDK connection separately
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY' });
    console.log('Groq SDK loaded successfully');

    // Send a test request to your /api/chat/health or similar endpoint
    const response = await axios.post('http://localhost:5000/api/chat', {
      message: 'test',
      chatHistory: []
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Include auth token if needed
        // 'Authorization': `Bearer YOUR_TOKEN`
      },
      timeout: 5000
    });
    console.log('Response from /api/chat:', response.data);
  } catch (err) {
    if (err.response) {
      console.error('Response error:', err.response.status, err.response.data);
    } else if (err.request) {
      console.error('No response received:', err.message);
    } else {
      console.error('Error setting up request:', err.message);
    }
  }
}

// Run the test
checkChatApi();
