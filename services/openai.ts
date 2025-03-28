import axios from 'axios';

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = 'gpt-4o';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
}

/**
 * OpenAI service for customer support and analysis
 */
class OpenAIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  
  constructor() {
    // Get API key from environment
    this.apiKey = process.env.OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. AI features will not work.');
    }
  }
  
  /**
   * Get AI assistant response for customer support
   */
  async getChatResponse(messages: ChatMessage[]): Promise<string> {
    try {
      if (!this.apiKey) {
        return 'Sorry, the AI assistant is currently unavailable. Please try again later.';
      }
      
      // Add system message to guide the AI's responses
      const allMessages: ChatMessage[] = [
        {
          role: 'system',
          content: `You are a helpful customer support assistant for a cross-border money transfer application that facilitates remittances from Canada to African countries. Your name is Rafiki AI.
          
          - Be concise and friendly in your responses
          - Help users with questions about sending money, fees, exchange rates, and app functionality
          - Focus on providing accurate information about money transfers
          - If you don't know something, be honest and suggest contacting human support
          - Follow regulatory compliance principles
          - Don't provide specific legal or financial advice`
        },
        ...messages
      ];
      
      const response = await axios.post<ChatCompletionResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: OPENAI_MODEL,
          messages: allMessages,
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI chat error:', error);
      return 'Sorry, I encountered an error. Please try again or contact human support.';
    }
  }
  
  /**
   * Analyze transaction for fraud detection
   */
  async analyzeTransaction(transactionData: any): Promise<{
    risk: 'low' | 'medium' | 'high';
    score: number;
    explanation: string;
    recommendation: string;
  }> {
    try {
      if (!this.apiKey) {
        return {
          risk: 'low',
          score: 0,
          explanation: 'AI analysis unavailable',
          recommendation: 'Proceed with standard verification',
        };
      }
      
      const systemPrompt = `You are a transaction analysis AI for a cross-border money transfer service. 
      Analyze the transaction data and provide a risk assessment with the following JSON structure:
      {
        "risk": "low" | "medium" | "high",
        "score": number between 0-100,
        "explanation": "brief explanation of risk factors",
        "recommendation": "recommendation for handling this transaction"
      }`;
      
      const response = await axios.post<ChatCompletionResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this transaction: ${JSON.stringify(transactionData)}` }
          ],
          max_tokens: 500,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      
      const analysisText = response.data.choices[0].message.content;
      const analysis = JSON.parse(analysisText);
      
      return {
        risk: analysis.risk || 'low',
        score: analysis.score || 0,
        explanation: analysis.explanation || 'No explanation provided',
        recommendation: analysis.recommendation || 'Proceed with standard verification',
      };
    } catch (error) {
      console.error('OpenAI transaction analysis error:', error);
      return {
        risk: 'low',
        score: 0,
        explanation: 'AI analysis failed',
        recommendation: 'Proceed with standard verification',
      };
    }
  }
}

export default new OpenAIService();
