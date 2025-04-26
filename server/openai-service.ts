import { OpenAI } from 'openai';

// Define types for transaction analysis
export interface TransactionAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  riskFactors: string[];
  recommendation: string;
  alternativeOptions?: {
    method: string;
    benefits: string[];
    drawbacks: string[];
  }[];
}

// Define types for country transfer tips
export interface CountryTransferTips {
  bestTimeToSend: string;
  localRegulations: string[];
  processingTimeEstimate: string;
  recommendations: string[];
}

// Define types for transaction risk analysis
export interface TransactionRiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  riskIndicators: string[];
  justification: string;
}

// Define types for financial insights
export interface FinancialInsights {
  savings: string[];
  timing: string[];
  fees: string[];
  exchange: string[];
  general: string[];
}

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes a transaction for risk factors using OpenAI API
 * @param transactionData - Transaction data to analyze
 * @returns Analysis results
 */
export async function analyzeTransaction(transactionData: { 
  amount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  destinationCountry: string;
}): Promise<TransactionAnalysis> {
  try {
    const { amount, sourceCurrency, destinationCurrency, destinationCountry } = transactionData;
    
    const prompt = `
    You are Rafiki, an expert financial assistant for cross-border money transfers from Canada to Africa.
    
    Analyze this potential money transfer transaction:
    - Amount: ${amount} ${sourceCurrency}
    - Destination Currency: ${destinationCurrency}
    - Destination Country: ${destinationCountry}
    
    Provide a risk analysis with the following information in JSON format:
    1. Overall risk level ("low", "medium", or "high")
    2. Risk score (0-100, where 0 is no risk and 100 is maximum risk)
    3. Risk factors (list of specific risk considerations)
    4. A personalized recommendation for the user
    5. Alternative transfer options if available
    
    Format your response as valid JSON with these keys: riskLevel, riskScore, riskFactors (array), recommendation (string), alternativeOptions (array of objects with method, benefits[], drawbacks[]).
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Rafiki, an AI financial assistant for cross-border money transfers from Canada to Africa. You provide risk analysis and recommendations for money transfers." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const analysis = JSON.parse(response.choices[0].message.content) as TransactionAnalysis;
    
    // Apply business rules
    if (amount > 10000) {
      analysis.riskLevel = "high";
      analysis.riskScore = Math.max(analysis.riskScore, 75);
      analysis.riskFactors.push("Transaction exceeds $10,000 threshold, requiring additional compliance checks");
    }
    
    return analysis;
  } catch (error) {
    console.error('OpenAI transaction analysis error:', error);
    
    // Fallback response in case of API failure
    return {
      riskLevel: "medium",
      riskScore: 50,
      riskFactors: ["Unable to fully analyze transaction due to service limitations"],
      recommendation: "Please proceed with caution and verify all details carefully as our risk analysis system is currently limited.",
      alternativeOptions: []
    };
  }
}

/**
 * Get country-specific transfer tips and recommendations
 * @param countryCode - ISO country code
 * @returns Country-specific tips
 */
export async function getCountryTransferTips(countryCode: string): Promise<CountryTransferTips> {
  try {
    const prompt = `
    You are Rafiki, an expert financial assistant for cross-border money transfers from Canada to Africa.
    
    Provide helpful tips for sending money to ${countryCode} from Canada.
    Include information on:
    1. The best time to send money (e.g., day of week, time of month)
    2. Local regulations or requirements to be aware of
    3. Estimated processing time
    4. General recommendations for smooth transfers
    
    Format your response as valid JSON with these keys: bestTimeToSend (string), localRegulations (array of strings), processingTimeEstimate (string), recommendations (array of strings).
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Rafiki, an AI financial assistant for cross-border money transfers from Canada to Africa. You provide localized advice for different African countries." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    return JSON.parse(response.choices[0].message.content) as CountryTransferTips;
  } catch (error) {
    console.error('OpenAI country tips error:', error);
    
    // Fallback response
    return {
      bestTimeToSend: "Weekday mornings typically offer faster processing times",
      localRegulations: [
        "Recipient may need to show ID for pickup",
        "Transfers above certain amounts may require additional documentation"
      ],
      processingTimeEstimate: "Typically 1-3 business days",
      recommendations: [
        "Double-check recipient details before sending",
        "Consider the exchange rate fluctuations"
      ]
    };
  }
}

/**
 * Analyze transaction risk level based on various parameters
 * @param transactionData - Transaction data
 * @param userContext - User context data
 * @param transactionHistory - Transaction history
 * @returns Risk analysis
 */
export async function analyzeTransactionRisk(
  transactionData: any,
  userContext: any,
  transactionHistory: any[]
): Promise<TransactionRiskAnalysis> {
  try {
    // Create a comprehensive prompt that examines past transaction history
    const prompt = `
    You are Rafiki, an expert financial assistant for cross-border money transfers from Canada to Africa.
    
    Analyze this money transfer for potential fraud or money laundering risks:
    - Amount: ${transactionData.amount} ${transactionData.sourceCurrency}
    - Destination Currency: ${transactionData.destinationCurrency}
    - Destination Country: ${transactionData.destinationCountry}
    
    User's information:
    ${JSON.stringify(userContext)}
    
    User's recent transactions:
    ${JSON.stringify(transactionHistory)}
    
    Based on this information, determine:
    1. Overall risk level ("low", "medium", or "high")
    2. Risk score (0-100)
    3. Specific risk indicators
    4. Justification for your assessment
    
    Format as JSON with these keys: riskLevel, riskScore, riskIndicators (array), justification (string).
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are Rafiki, an AI financial compliance expert. You detect unusual patterns and potential risks in financial transactions." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content) as TransactionRiskAnalysis;
  } catch (error) {
    console.error('OpenAI risk analysis error:', error);
    
    // Fallback response
    return {
      riskLevel: "medium",
      riskScore: 50,
      riskIndicators: ["Unable to complete comprehensive risk analysis"],
      justification: "Our risk analysis system is currently limited. Please verify this transaction carefully and ensure it complies with all applicable regulations."
    };
  }
}

/**
 * Generate financial insights and recommendations based on user's transaction history
 * @param userData - User data including transaction history
 * @returns Personalized financial insights
 */
export async function generateFinancialInsights(userData: {
  transactions: any[];
  totalSpent: string | number;
  transferFrequency: number;
  mostCommonDestination: string;
}): Promise<FinancialInsights> {
  try {
    const { transactions, totalSpent, transferFrequency, mostCommonDestination } = userData;
    
    const prompt = `
    You are Rafiki, an expert financial assistant for cross-border money transfers from Canada to Africa.
    
    A user has the following transaction pattern:
    - Total spent on transfers (last 3 months): ${totalSpent} CAD
    - Transfer frequency: ${transferFrequency}
    - Most common destination: ${mostCommonDestination}
    - Recent transactions: ${JSON.stringify(transactions)}
    
    Provide personalized financial insights including:
    1. Money-saving opportunities
    2. Better timing recommendations
    3. Fee optimization strategies
    4. Currency exchange tips
    5. Other financial recommendations
    
    Format your response as valid JSON with these keys: savings (array of tips), timing (array of tips), fees (array of tips), exchange (array of tips), general (array of tips).
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Rafiki, an AI financial advisor specializing in helping people optimize their international money transfers, especially to Africa." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    return JSON.parse(response.choices[0].message.content) as FinancialInsights;
  } catch (error) {
    console.error('OpenAI financial insights error:', error);
    
    // Fallback insights
    return {
      savings: ["Consider bundling multiple smaller transfers into one larger transfer to save on fees"],
      timing: ["Exchange rates often fluctuate throughout the month - monitor rates to find the best time to send"],
      fees: ["Compare different payment methods as fees can vary significantly"],
      exchange: ["Setting up rate alerts can help you transfer when exchange rates are more favorable"],
      general: ["Maintaining a consistent transfer schedule can help with financial planning both for you and your recipients"]
    };
  }
}

export default {
  analyzeTransaction,
  getCountryTransferTips,
  analyzeTransactionRisk,
  generateFinancialInsights,
};