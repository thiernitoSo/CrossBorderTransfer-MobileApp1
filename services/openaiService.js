// OpenAI service for the server
const OpenAI = require('openai');
const dotenv = require('dotenv');
dotenv.config();

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate an AI response to a chat message
 * @param {Array} messages - Array of message objects with role and content
 * @returns {Promise<string>} The AI generated response
 */
async function generateChatResponse(messages) {
  try {
    // If OpenAI API key is not provided, use the rule-based fallback
    if (!process.env.OPENAI_API_KEY) {
      console.warn('No OpenAI API key found, using fallback responses');
      
      // Get the last user message
      const lastUserMessage = messages
        .filter(m => m.role === 'user')
        .pop();
      
      if (!lastUserMessage || !lastUserMessage.content) {
        return "I'm Rafiki, your AI assistant for SendAfrika! How can I help you today?";
      }
      
      // Use the local rule-based function
      return require('../server').generateResponse(lastUserMessage.content);
    }

    // Use the OpenAI API for a more sophisticated response
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Rafiki, an expert AI assistant for SendAfrika, a money transfer service from Canada to Africa. " +
            "Provide friendly, concise, and accurate information about money transfers, exchange rates, fees, " +
            "transfer times, supported countries, and payment methods. " +
            "Be warm and professional in your responses. If unsure about specific details, be honest and suggest contacting customer support. " +
            "Remember that SendAfrika allows money transfers from Canada to Nigeria, Ghana, Kenya, South Africa, Uganda, Senegal, and Côte d'Ivoire."
        },
        ...messages
      ],
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback if OpenAI fails
    return "I'm sorry, but I'm having trouble connecting to my knowledge base right now. " +
      "Please try again later or contact our customer support for immediate assistance.";
  }
}

/**
 * Analyze a transaction for potential fraud or risk
 * @param {Object} transactionData - Transaction details to analyze
 * @returns {Promise<Object>} Risk assessment results
 */
async function analyzeTransaction(transactionData) {
  try {
    // If OpenAI API key is not provided, use the rule-based fallback
    if (!process.env.OPENAI_API_KEY) {
      console.warn('No OpenAI API key found, using rule-based analysis');
      
      // Use the local rule-based approach (handled in server.js route)
      return null;
    }

    // Use the OpenAI API for more sophisticated analysis
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a fraud detection AI for cross-border money transfers. " +
            "Analyze the transaction for potential risks and fraud indicators. " +
            "Return a JSON object with the following fields: risk (low, medium, or high), " +
            "confidence (a number between 0 and 1), flags (an array of risk factors), " +
            "recommendation (approve, review, or reject), and explanation (detailed reasoning)."
        },
        {
          role: "user",
          content: `Analyze this transaction: ${JSON.stringify(transactionData)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      risk: analysis.risk,
      confidence: analysis.confidence,
      flags: analysis.flags,
      recommendation: analysis.recommendation,
      explanation: analysis.explanation
    };
  } catch (error) {
    console.error('OpenAI API error during transaction analysis:', error);
    
    // Return null to indicate the system should use the fallback analysis
    return null;
  }
}

module.exports = {
  generateChatResponse,
  analyzeTransaction
};