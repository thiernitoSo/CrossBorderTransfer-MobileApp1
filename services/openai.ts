import axios from 'axios';

// Types for AI functionality
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  role: string;
  content: string;
}

interface TransactionAnalysisResponse {
  risk: 'low' | 'medium' | 'high';
  confidence: number;
  flags: string[];
  recommendation: string;
  explanation: string;
}

/**
 * AI service for customer support and transaction analysis
 * This implementation uses our local server endpoints that can connect to OpenAI
 * or fall back to rule-based responses if no API key is available
 */
class AIService {
  // Base URL for API requests - adjust based on environment
  private baseUrl: string = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:8000/api';
  
  /**
   * Get AI assistant response for customer support
   * @param messages Array of message objects with role and content
   * @returns AI-generated or rule-based response text
   */
  async getChatResponse(messages: ChatMessage[]): Promise<string> {
    try {
      // If no messages, return default greeting
      if (!messages || messages.length === 0) {
        return "I'm Rafiki, your AI assistant for SendAfrika! How can I help you today?";
      }
      
      // Send request to the server endpoint
      const response = await axios.post<ChatResponse>(
        `${this.baseUrl}/chat`,
        { messages },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000 // 10 second timeout for AI responses
        }
      );
      
      return response.data.content;
    } catch (error) {
      console.error('Chat API error:', error);
      
      // Friendly fallback message
      return 'Sorry, I encountered an error connecting to my knowledge base. ' +
        'Please try again in a moment or contact human support if the issue persists.';
    }
  }
  
  /**
   * Analyze transaction for fraud detection
   * @param transactionData Transaction details to analyze
   * @returns Risk assessment results
   */
  async analyzeTransaction(transactionData: any): Promise<{
    risk: 'low' | 'medium' | 'high';
    score: number;
    explanation: string;
    recommendation: string;
  }> {
    try {
      // Send request to the server endpoint
      const response = await axios.post<TransactionAnalysisResponse>(
        `${this.baseUrl}/analyze-transaction`,
        { transactionData },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000 // 10 second timeout for analysis
        }
      );
      
      return {
        risk: response.data.risk,
        score: response.data.confidence * 100, // Convert 0-1 scale to 0-100
        explanation: response.data.explanation,
        recommendation: response.data.recommendation,
      };
    } catch (error) {
      console.error('Transaction analysis API error:', error);
      
      // Fallback when service is unavailable
      return {
        risk: 'low',
        score: 0,
        explanation: 'Risk analysis service is currently unavailable. ' +
          'The transaction will proceed with standard verification measures.',
        recommendation: 'Proceed with standard verification',
      };
    }
  }
}

export default new AIService();
