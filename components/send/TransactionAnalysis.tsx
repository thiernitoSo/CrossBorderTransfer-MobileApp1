import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Card, Chip, Divider, Button } from 'react-native-paper';
import axios from 'axios';
import theme from '../../constants/theme';

interface TransactionAnalysisProps {
  amount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  destinationCountry: string;
  showDetails?: boolean;
}

interface AnalysisResult {
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

interface CountryTips {
  bestTimeToSend: string;
  localRegulations: string[];
  processingTimeEstimate: string;
  recommendations: string[];
}

export default function TransactionAnalysis({
  amount,
  sourceCurrency,
  destinationCurrency,
  destinationCountry,
  showDetails = false,
}: TransactionAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [tips, setTips] = useState<CountryTips | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(showDetails);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!amount || amount <= 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch transaction analysis
        const analysisResponse = await axios.post('/api/analyze-transaction', {
          amount,
          sourceCurrency,
          destinationCurrency,
          destinationCountry,
        });
        
        setAnalysis(analysisResponse.data);
        
        // Fetch country-specific tips
        const tipsResponse = await axios.get(`/api/country-transfer-tips/${destinationCountry}`);
        setTips(tipsResponse.data);
      } catch (err) {
        console.error('Error fetching transaction analysis:', err);
        setError('Unable to analyze this transaction at the moment.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalysis();
  }, [amount, sourceCurrency, destinationCurrency, destinationCountry]);
  
  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Analyzing your transaction...</Text>
        </Card.Content>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.errorText}>{error}</Text>
        </Card.Content>
      </Card>
    );
  }
  
  if (!analysis) return null;
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return theme.colors.success;
      case 'medium': return theme.colors.warning;
      case 'high': return theme.colors.error;
      default: return theme.colors.text;
    }
  };
  
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>AI Transaction Analysis</Text>
          <Chip 
            mode="outlined" 
            style={[styles.riskChip, { borderColor: getRiskColor(analysis.riskLevel) }]}
            textStyle={{ color: getRiskColor(analysis.riskLevel) }}
          >
            {analysis.riskLevel.toUpperCase()} RISK
          </Chip>
        </View>
        
        <Text style={styles.recommendation}>{analysis.recommendation}</Text>
        
        <Button 
          mode="text" 
          onPress={() => setExpanded(!expanded)}
          style={styles.detailsButton}
        >
          {expanded ? 'Hide Details' : 'Show Details'}
        </Button>
        
        {expanded && (
          <View style={styles.details}>
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Risk Factors</Text>
            {analysis.riskFactors.map((factor, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))}
            
            {tips && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.sectionTitle}>Country-Specific Tips</Text>
                
                <View style={styles.tipSection}>
                  <Text style={styles.tipLabel}>Best time to send:</Text>
                  <Text style={styles.tipText}>{tips.bestTimeToSend}</Text>
                </View>
                
                <View style={styles.tipSection}>
                  <Text style={styles.tipLabel}>Processing time:</Text>
                  <Text style={styles.tipText}>{tips.processingTimeEstimate}</Text>
                </View>
                
                <Text style={[styles.tipLabel, { marginTop: 8 }]}>Recommendations:</Text>
                {tips.recommendations.map((tip, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
                
                {tips.localRegulations.length > 0 && (
                  <>
                    <Text style={[styles.tipLabel, { marginTop: 8 }]}>Local regulations:</Text>
                    {tips.localRegulations.map((regulation, index) => (
                      <View key={index} style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.tipText}>{regulation}</Text>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
            
            {analysis.alternativeOptions && analysis.alternativeOptions.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.sectionTitle}>Alternative Options</Text>
                
                {analysis.alternativeOptions.map((option, index) => (
                  <View key={index} style={styles.alternativeOption}>
                    <Text style={styles.optionMethod}>{option.method}</Text>
                    
                    <Text style={styles.optionLabel}>Benefits:</Text>
                    {option.benefits.map((benefit, i) => (
                      <View key={i} style={styles.listItem}>
                        <Text style={styles.bullet}>+</Text>
                        <Text style={styles.optionText}>{benefit}</Text>
                      </View>
                    ))}
                    
                    <Text style={styles.optionLabel}>Drawbacks:</Text>
                    {option.drawbacks.map((drawback, i) => (
                      <View key={i} style={styles.listItem}>
                        <Text style={styles.bullet}>-</Text>
                        <Text style={styles.optionText}>{drawback}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 16,
    borderRadius: 16,
    elevation: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: theme.colors.textMuted,
  },
  errorText: {
    color: theme.colors.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  riskChip: {
    height: 28,
  },
  recommendation: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
  },
  detailsButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    marginLeft: -4,
  },
  details: {
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 16,
    fontSize: 16,
  },
  factorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  tipSection: {
    marginBottom: 4,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  alternativeOption: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  optionMethod: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    color: theme.colors.textMuted,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
});