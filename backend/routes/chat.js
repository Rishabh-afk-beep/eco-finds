const express = require('express');
const Groq = require('groq-sdk');
const router = express.Router();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Chat endpoint - supports both authenticated and anonymous users
router.post('/', async (req, res) => {
  try {
    const { message, chatHistory = [] } = req.body;

    console.log("Chat request received:", { message, chatHistory });

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Default user context
    let userContext = 'Anonymous user';

    // Try to get user info if token is provided
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const { dbGet } = require('../database');
        const user = await dbGet(
          'SELECT username, eco_points FROM users WHERE id = ?',
          [decoded.id]
        );
        if (user) {
          userContext = `User ${user.username} (${user.eco_points} eco points)`;
        }
      } catch (authError) {
        // Continue as anonymous user if auth fails
        console.log('Auth optional - continuing as anonymous user');
      }
    }

    // Prepare messages for Groq API
    const messages = [
      {
        role: "system",
        content: `You are EcoBot, the helpful AI assistant for EcoFinds - a sustainable second-hand marketplace. 

Your role:
- Help users discover eco-friendly and sustainable products
- Provide tips on sustainable living and eco-conscious shopping
- Assist with navigating the marketplace features
- Answer questions about product conditions, sustainability scores, and eco points
- Encourage sustainable practices and second-hand shopping

Context: Currently chatting with ${userContext}

Keep responses helpful, friendly, and focused on sustainability and the marketplace. If users ask about specific products, suggest they browse the marketplace categories or use the search feature.`
      },
      ...chatHistory.slice(-10), // Keep last 10 messages for context
      {
        role: "user",
        content: message
      }
    ];

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9
    });

    const response =
      chatCompletion.choices[0]?.message?.content ||
      "I'm having trouble processing your request right now. Please try again!";

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error);

    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'AI service configuration error'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'AI service is busy. Please try again in a moment.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process your message. Please try again.'
    });
  }
});

// Health check for chat service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EcoFinds Chat API is running',
    model: 'llama-3.3-70b-versatile'
  });
});

module.exports = router;
