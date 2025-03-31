/**
 * OpenAI Service
 * 
 * This service provides AI-powered financial insights and customer support
 * capabilities to the application, leveraging OpenAI's advanced models.
 */

const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    // Initialize OpenAI client with API key
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate a response to a customer support query
   * @param {string} query The user's support query
   * @param {Object} userContext Additional context about the user
   * @returns {Promise<string>} AI-generated response
   */
  async getCustomerSupportResponse(query, userContext = {}) {
    try {
      // Create a system message with appropriate context and guidelines
      const systemPrompt = `You are "Rafiki", a helpful AI assistant specializing in cross-border money transfers from Canada to Africa.
      
Your role is to provide accurate, trustworthy information about:
- SendAfrika's money transfer services
- Exchange rates and fees
- Supported payment methods and delivery options
- Security procedures and regulatory compliance
- Supported countries and currencies
- Transaction processing times

Guidelines:
- Be conversational but professional
- Provide clear, concise answers
- Never make up information about transfer rates or services
- Avoid discussing politics or sensitive national issues
- Focus on the specific user query
- If you're unsure of an answer, suggest contacting customer support
- Respect user privacy - don't ask for personal or account information

User context:
- Name: ${userContext.firstName || 'Valued customer'}
- Country: ${userContext.country || 'Canada'}
${userContext.recentTransactions ? `- Recent transactions: ${userContext.recentTransactions}` : ''}`;

      // Call OpenAI API with the user query and system prompt
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Provide more intelligent fallback responses based on the query
      if (query.toLowerCase().includes('exchange rate') || query.toLowerCase().includes('rate')) {
        return "I understand you're asking about exchange rates. We offer competitive rates for transfers to various African countries including Nigeria, Kenya, Ghana, and more. Our rates are updated daily based on market conditions. For the most current rates, please check the Send Money section of our app or contact our customer support team at support@sendafrika.com.";
      } else if (query.toLowerCase().includes('fee') || query.toLowerCase().includes('cost')) {
        return "Regarding fees, SendAfrika charges a transparent fee structure based on the amount you're sending. For transfers under $1,000, our fee is 3.5% of the transfer amount. For transfers between $1,000 and $5,000, the fee drops to 2.5%. Transfers above $5,000 have a fee of 1.5%. We're committed to providing competitive pricing for our customers.";
      } else if (query.toLowerCase().includes('time') || query.toLowerCase().includes('how long') || query.toLowerCase().includes('duration')) {
        return "Transfer times vary by destination and payment method. Mobile money transfers typically arrive within minutes to 2 hours. Bank transfers generally take 1-2 business days. Cash pickups are usually available within a few hours of sending. Actual times may vary based on recipient country regulations and local banking hours.";
      } else if (query.toLowerCase().includes('country') || query.toLowerCase().includes('countries') || query.toLowerCase().includes('support')) {
        return "SendAfrika currently supports money transfers to multiple African countries including Nigeria, Kenya, Ghana, Uganda, Tanzania, Senegal, Côte d'Ivoire, Cameroon, and South Africa. We're continuously expanding our coverage to serve more countries and regions.";
      } else {
        return "I apologize, but I'm currently experiencing connection issues. For information about SendAfrika's services, please check our FAQ section or contact our customer support team at support@sendafrika.com or call us at +1-800-SEND-AFR.";
      }
    }
  }

  /**
   * Analyze a transaction to provide insights
   * @param {Object} transaction Transaction details to analyze
   * @returns {Promise<Object>} Analysis results including insights and recommendations
   */
  async analyzeTransaction(transaction) {
    try {
      const prompt = `Analyze the following money transfer transaction and provide helpful insights:
      
Transaction details:
- Amount: ${transaction.sourceAmount} ${transaction.sourceCurrency} to ${transaction.destinationAmount} ${transaction.destinationCurrency}
- Exchange rate: ${transaction.exchangeRate}
- Fee: ${transaction.fee} ${transaction.sourceCurrency}
- Recipient country: ${transaction.recipientCountry || 'Unknown'}
- Transfer method: ${transaction.paymentMethod || 'Unknown'}
- Status: ${transaction.status || 'Unknown'}

Please include:
1. A brief assessment of the exchange rate quality (favorable, average, unfavorable)
2. Potential fee-saving opportunities for future transfers
3. Any relevant market or economic insights for the countries involved
4. Estimated delivery time based on the payment method
5. Any security or compliance considerations`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are an AI financial analyst specializing in cross-border money transfers. Provide concise, actionable insights based on transaction data. Format your response as JSON with the following keys: exchangeRateAssessment, feeSavingTips, marketInsights, estimatedDeliveryTime, securityTips. Keep each section brief and focused." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the JSON response
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Transaction analysis error:', error);
      
      // Provide a useful fallback response based on transaction details
      const destinationCurrency = transaction.destinationCurrency || '';
      const paymentMethod = transaction.paymentMethod || '';
      
      // Create a fallback analysis with generic but helpful information
      return {
        exchangeRateAssessment: "We are unable to provide a personalized exchange rate assessment at this moment. Our rates are updated daily to ensure competitive pricing for all destinations.",
        
        feeSavingTips: "To save on fees, consider bundling multiple smaller transfers into a single larger transaction. Our fee percentage decreases as the transfer amount increases. Also, check for promotional offers in the app.",
        
        marketInsights: `The ${destinationCurrency} market has been showing typical fluctuations. For the most up-to-date economic insights, please check our market updates section or consult with our financial advisors.`,
        
        estimatedDeliveryTime: paymentMethod.includes('bank') ? 
          "Bank transfers typically arrive within 1-2 business days depending on the recipient's bank processing times." : 
          paymentMethod.includes('mobile') ? 
            "Mobile money transfers usually complete within minutes to a few hours, depending on network status." : 
            "Your transfer method typically delivers funds within 24-48 hours. Status updates will be provided via SMS and email.",
        
        securityTips: "Always verify recipient details before confirming transfers. Enable two-factor authentication for your account. Be cautious of phishing attempts - we will never ask for your password or full account details via email or SMS."
      };
    }
  }

  /**
   * Generate helpful tips for sending money to a specific country
   * @param {string} countryCode The destination country code
   * @returns {Promise<Array>} List of tips and recommendations
   */
  async getCountryTransferTips(countryCode) {
    try {
      const prompt = `Provide practical tips and information for sending money from Canada to ${countryCode}. 
      Focus on specific details relevant to this country, including:
      
      1. Popular and reliable transfer methods in ${countryCode}
      2. Typical delivery times
      3. Common fees and exchange rate considerations
      4. Local regulations or requirements to be aware of
      5. Best practices for ensuring successful delivery
      
      Format your response as a JSON array of tip objects with "title" and "description" fields.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are a financial advisor specializing in international money transfers with deep knowledge of African financial systems. Provide accurate, practical advice tailored to specific countries." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the JSON response
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Country tips generation error:', error);
      
      // Create fallback tips based on common knowledge for African countries
      const countrySpecificTips = this.getFallbackCountryTips(countryCode);
      
      return {
        tips: countrySpecificTips,
        fallback: true,
        note: "These are general guidelines. For more specific information, please contact customer support."
      };
    }
  }
  
  /**
   * Provides fallback country tips when API is unavailable
   * @param {string} countryCode Two-letter country code
   * @returns {Array} Array of tip objects with title and description
   */
  getFallbackCountryTips(countryCode) {
    // Common tips for all countries
    const commonTips = [
      {
        title: "Verify Recipient Information",
        description: "Double-check all recipient details before confirming your transfer, especially account numbers and mobile numbers."
      },
      {
        title: "Be Aware of Exchange Rate Fluctuations",
        description: "Currency exchange rates can change daily. Check the rate before sending to get the best value."
      },
      {
        title: "Consider Larger Transfers",
        description: "Sending larger amounts at once often results in lower fees than multiple smaller transfers."
      }
    ];
    
    // Country-specific tips based on common knowledge
    const countryTips = {
      'NG': [ // Nigeria
        {
          title: "Mobile Money Options",
          description: "Mobile money services like Paga and OPay are widely available in Nigeria and offer quick delivery times."
        },
        {
          title: "Bank Transfer Considerations",
          description: "Nigerian banks typically process international transfers within 1-2 business days. Some banks may require additional verification."
        }
      ],
      'KE': [ // Kenya
        {
          title: "M-Pesa Popularity",
          description: "M-Pesa is the dominant mobile money service in Kenya, offering nearly instant transfers to registered users."
        },
        {
          title: "ID Requirements",
          description: "Recipients may need to show government-issued ID when collecting funds at agent locations."
        }
      ],
      'GH': [ // Ghana
        {
          title: "Mobile Money Growth",
          description: "MTN Mobile Money, Airtel Money, and Vodafone Cash are widely used throughout Ghana for receiving funds."
        },
        {
          title: "Cash Pickup Locations",
          description: "Ghana has an extensive network of cash pickup locations in urban and many rural areas."
        }
      ],
      'ZA': [ // South Africa
        {
          title: "Bank Transfer Efficiency",
          description: "South Africa has a modern banking system that typically processes transfers efficiently within 1-2 business days."
        },
        {
          title: "Documentation Requirements",
          description: "Recipients may need to provide additional documentation for large transfers due to South Africa's stringent financial regulations."
        }
      ],
      'SN': [ // Senegal
        {
          title: "Orange Money Availability",
          description: "Orange Money is widely used in Senegal and offers a convenient way to receive funds directly to mobile accounts."
        },
        {
          title: "Cash Pickup Considerations",
          description: "For cash pickup in Senegal, recipients should bring their ID and the transaction reference number."
        }
      ],
      'CI': [ // Côte d'Ivoire
        {
          title: "Mobile Money Services",
          description: "Orange Money and MTN Mobile Money are popular in Côte d'Ivoire for receiving international transfers."
        },
        {
          title: "Banking Hours",
          description: "Bank branches in Côte d'Ivoire typically operate from 8:00 AM to 3:30 PM on weekdays. Plan pickup times accordingly."
        }
      ],
      'CM': [ // Cameroon
        {
          title: "MTN Mobile Money and Orange Money",
          description: "Both services are widely available in Cameroon and offer quick access to transferred funds."
        },
        {
          title: "Rural Delivery",
          description: "For transfers to rural areas in Cameroon, mobile money may offer better accessibility than bank transfers."
        }
      ],
      'UG': [ // Uganda
        {
          title: "Mobile Money Networks",
          description: "MTN Mobile Money and Airtel Money have extensive networks throughout Uganda, making them convenient options."
        },
        {
          title: "Delivery Speed",
          description: "Mobile money transfers to Uganda typically complete within minutes to a few hours after sending."
        }
      ],
      'TZ': [ // Tanzania
        {
          title: "M-Pesa Availability",
          description: "M-Pesa is widely used in Tanzania and offers a reliable method for receiving international transfers."
        },
        {
          title: "ID Requirements",
          description: "Recipients will need to present valid identification that matches the name on the transfer."
        }
      ]
    };
    
    // Return country-specific tips if available, otherwise just common tips
    return countryTips[countryCode] ? [...countryTips[countryCode], ...commonTips] : commonTips;
  }

  /**
   * Generate a response for the chat interface based on conversation history
   * @param {Array} messages An array of message objects in OpenAI format {role, content}
   * @returns {Promise<string>} AI-generated response 
   */
  async generateChatResponse(messages) {
    try {
      // Extract the user context if it exists in the messages
      const userContext = messages.find(m => m.role === 'context')?.content || {};
      
      // Add system prompt if it doesn't exist
      let messagesWithSystem = [...messages];
      if (!messagesWithSystem.some(m => m.role === 'system')) {
        messagesWithSystem.unshift({
          role: "system",
          content: `You are "Rafiki", a helpful AI assistant specializing in cross-border money transfers from Canada to Africa.
          
Your role is to provide accurate, trustworthy information about:
- SendAfrika's money transfer services
- Exchange rates and fees
- Supported payment methods and delivery options
- Security procedures and regulatory compliance
- Supported countries and currencies
- Transaction processing times

Guidelines:
- Be conversational but professional
- Provide clear, concise answers
- Never make up information about transfer rates or services
- Avoid discussing politics or sensitive national issues
- Focus on the specific user query
- If you're unsure of an answer, suggest contacting customer support
- Respect user privacy - don't ask for personal or account information`
        });
      }
      
      // Only include messages with standard roles
      const filteredMessages = messagesWithSystem.filter(m => 
        ['system', 'user', 'assistant'].includes(m.role)
      );
      
      // Call OpenAI API with the conversation history
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: filteredMessages,
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Chat response generation error:', error);
      throw error; // Let the caller handle the fallback
    }
  }

  /**
   * Analyze a transaction for fraud detection and risk assessment
   * @param {Object} transaction Transaction details to analyze
   * @param {Object} user User information for context
   * @param {Array} userTransactionHistory Previous transactions (optional)
   * @returns {Promise<Object>} Risk assessment results
   */
  async analyzeTransactionRisk(transaction, user, userTransactionHistory = []) {
    try {
      // Create a comprehensive prompt with all relevant data
      const prompt = `Analyze this cross-border money transfer for potential fraud or compliance risks:
      
Transaction details:
- Amount: ${transaction.sourceAmount} ${transaction.sourceCurrency} to ${transaction.destinationAmount} ${transaction.destinationCurrency}
- Exchange rate: ${transaction.exchangeRate}
- Fee: ${transaction.fee} ${transaction.sourceCurrency}
- Recipient country: ${transaction.recipientCountry || 'Unknown'}
- Transfer method: ${transaction.paymentMethod || 'Unknown'}
- Recipient: ${transaction.beneficiaryName || 'Unknown'}
- Relationship to sender: ${transaction.relationship || 'Unknown'}
- Purpose of transfer: ${transaction.purpose || 'Not specified'}

Sender information:
- Account age: ${user.accountAge || 'Unknown'} days
- Location: ${user.location || 'Canada'}
- Verification status: ${user.verificationStatus || 'Unknown'}

Transaction history (last ${userTransactionHistory.length} transactions):
${userTransactionHistory.map(t => 
  `- ${t.createdAt}: ${t.sourceAmount} ${t.sourceCurrency} to ${t.recipientCountry || 'Unknown'}`
).join('\n')}

Based on this information, assess the transaction risk using the following factors:
1. Transaction amount compared to user's typical behavior
2. Destination country risk factors
3. Payment method security
4. Pattern of recent transactions
5. Unusual timing or circumstances
6. Compliance with AML and CTF regulations

Provide a risk assessment with a risk level, confidence score, specific flags or concerns, and recommendations.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are an AI financial compliance expert specializing in fraud detection for cross-border money transfers. Analyze transactions for risk factors and regulatory concerns. Provide concise, actionable risk assessments with clear recommendations. Format your response as JSON with specific fields." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the JSON response
      const riskAssessment = JSON.parse(response.choices[0].message.content);
      
      // Ensure we have all expected fields
      return {
        riskLevel: riskAssessment.riskLevel || 'unknown',
        confidence: riskAssessment.confidence || 0.5,
        flags: riskAssessment.flags || [],
        concerns: riskAssessment.concerns || [],
        recommendations: riskAssessment.recommendations || [],
        requiresReview: riskAssessment.requiresReview || false,
        complianceStatus: riskAssessment.complianceStatus || 'unknown'
      };
    } catch (error) {
      console.error('Transaction risk analysis error:', error);
      
      // Provide a fallback response that encourages appropriate caution
      return {
        riskLevel: 'unknown',
        confidence: 0.5,
        flags: [],
        concerns: ["Unable to perform automated risk assessment at this time."],
        recommendations: [
          "Verify recipient information carefully",
          "Confirm the purpose of the transfer",
          "Consider your typical transaction patterns"
        ],
        requiresReview: transaction.sourceAmount > 1000, // Flag larger transfers for review
        complianceStatus: 'pending_review'
      };
    }
  }

  /**
   * Generate personalized financial advice based on transaction history
   * @param {Object} user User information
   * @param {Array} transactionHistory User's transaction history
   * @returns {Promise<Object>} Personalized financial insights
   */
  async getPersonalizedFinancialInsights(user, transactionHistory = []) {
    try {
      // Skip if there are no transactions to analyze
      if (!transactionHistory.length) {
        return {
          insights: [
            {
              title: "Start Your Transfer Journey",
              description: "Complete your first money transfer to receive personalized financial insights."
            }
          ],
          recommendations: []
        };
      }

      // Prepare transaction data for analysis
      const formattedTransactions = transactionHistory.map(t => ({
        date: t.createdAt,
        amount: t.sourceAmount,
        currency: t.sourceCurrency,
        destinationCurrency: t.destinationCurrency,
        country: t.recipientCountry,
        fee: t.fee
      }));

      const prompt = `Analyze this user's money transfer history and provide personalized financial insights:
      
User information:
- Name: ${user.firstName || 'User'} ${user.lastName || ''}
- Country: ${user.country || 'Canada'}
- Account since: ${user.createdAt || 'Recently'}

Transaction history (last ${formattedTransactions.length} transactions):
${JSON.stringify(formattedTransactions, null, 2)}

Based on this transaction history, provide:
1. Key patterns in the user's transfer behavior
2. Opportunities to save on fees or get better rates
3. Personalized recommendations for future transfers
4. Potential optimizations for timing or transfer methods
5. Relevant financial insights based on destination countries`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are an AI financial advisor specializing in cross-border money transfers. Analyze transaction history to provide personalized, actionable financial insights. Format your response as JSON with 'insights' (array of objects with title and description) and 'recommendations' (array of strings)." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the JSON response
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Financial insights error:', error);
      
      // Provide a useful fallback with generic insights
      return {
        insights: [
          {
            title: "Regular Transfers Save on Fees",
            description: "Setting up scheduled transfers can help you save on fees and get better exchange rates over time."
          },
          {
            title: "Compare Payment Methods",
            description: "Different payment methods may offer varying fees and delivery times. Explore all options for your destination country."
          }
        ],
        recommendations: [
          "Consider bundling smaller transfers into larger ones to reduce overall fees",
          "Check for promotional rates and special offers before making your next transfer",
          "Verify recipient information carefully to avoid transfer delays"
        ]
      };
    }
  }
}

module.exports = new OpenAIService();