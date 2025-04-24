import axios from 'axios';

export interface AITransactionAnalysis {
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

export interface TransferTips {
  bestTimeToSend: string;
  localRegulations: string[];
  processingTimeEstimate: string;
  recommendations: string[];
}

export interface FinancialInsights {
  savings: string[];
  timing: string[];
  fees: string[];
  exchange: string[];
  general: string[];
}

/**
 * Analyze a potential transaction for risk factors and recommendations
 */
export const analyzeTransaction = async (
  amount: number,
  sourceCurrency: string,
  destinationCurrency: string,
  destinationCountry: string,
): Promise<AITransactionAnalysis> => {
  try {
    const response = await axios.post('/api/analyze-transaction', {
      amount,
      sourceCurrency,
      destinationCurrency,
      destinationCountry,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error analyzing transaction:', error);
    
    // Return a default analysis if API call fails
    return {
      riskLevel: 'medium',
      riskScore: 50,
      riskFactors: ['Unable to perform risk analysis at this time'],
      recommendation: 'Please proceed with caution and verify all details carefully.',
    };
  }
};

/**
 * Get country-specific transfer tips and recommendations
 */
export const getCountryTransferTips = async (
  countryCode: string,
): Promise<TransferTips> => {
  try {
    const response = await axios.get(`/api/country-transfer-tips/${countryCode}`);
    return response.data;
  } catch (error) {
    console.error('Error getting country tips:', error);
    
    // Return default tips if API call fails
    return {
      bestTimeToSend: 'Weekday mornings typically offer faster processing times',
      localRegulations: [
        'Recipient may need to show ID for pickup',
        'Transfers above certain amounts may require additional documentation'
      ],
      processingTimeEstimate: 'Typically 1-3 business days',
      recommendations: [
        'Double-check recipient details before sending',
        'Consider the exchange rate fluctuations'
      ]
    };
  }
};

/**
 * Get personalized financial insights based on transaction history
 */
export const getFinancialInsights = async (): Promise<FinancialInsights> => {
  try {
    const response = await axios.get('/api/financial-insights');
    return response.data.insights;
  } catch (error) {
    console.error('Error getting financial insights:', error);
    
    // Return default insights if API call fails
    return {
      savings: ['Consider bundling multiple smaller transfers into one larger transfer to save on fees'],
      timing: ['Monitor exchange rates to find the best time to send money'],
      fees: ['Compare different payment methods as fees can vary significantly'],
      exchange: ['Setting up rate alerts can help you transfer when exchange rates are more favorable'],
      general: ['Maintaining a consistent transfer schedule can help with financial planning']
    };
  }
};

export default {
  analyzeTransaction,
  getCountryTransferTips,
  getFinancialInsights,
};