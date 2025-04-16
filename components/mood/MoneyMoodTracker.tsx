import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import theme from '../../constants/theme';

// Mood types and their related data
export interface Mood {
  id: string;
  emoji: string;
  label: string;
  color: string;
  description: string;
}

export const moods: Mood[] = [
  {
    id: 'excited',
    emoji: '😃',
    label: 'Excited',
    color: theme.colors.success,
    description: 'Feeling positive about your financial decisions'
  },
  {
    id: 'satisfied',
    emoji: '😊',
    label: 'Satisfied',
    color: '#4CAF50',
    description: 'Content with your current financial activity'
  },
  {
    id: 'neutral',
    emoji: '😐',
    label: 'Neutral',
    color: '#FFC107',
    description: 'Neither positive nor negative about your finances'
  },
  {
    id: 'concerned',
    emoji: '😟',
    label: 'Concerned',
    color: '#FF9800',
    description: 'Slightly worried about your financial decisions'
  },
  {
    id: 'anxious',
    emoji: '😰',
    label: 'Anxious',
    color: theme.colors.error,
    description: 'Experiencing financial stress or worry'
  },
];

interface MoneyMoodTrackerProps {
  onMoodSelected?: (mood: Mood) => void;
  initialMood?: string;
  transactionAmount?: number;
  transactionCurrency?: string;
}

const MoneyMoodTracker: React.FC<MoneyMoodTrackerProps> = ({
  onMoodSelected,
  initialMood,
  transactionAmount,
  transactionCurrency,
}) => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(
    initialMood ? moods.find(mood => mood.id === initialMood) || null : null
  );
  
  // Animation values for each mood
  const animationValues = moods.map(() => new Animated.Value(1));
  
  // Handle mood selection
  const handleMoodSelect = (mood: Mood, index: number) => {
    setSelectedMood(mood);
    
    // Animate the selected mood
    Animated.sequence([
      Animated.timing(animationValues[index], {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animationValues[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Call the callback if provided
    if (onMoodSelected) {
      onMoodSelected(mood);
    }
  };
  
  // Get a suggestion based on mood and transaction amount
  const getMoodSuggestion = (): string => {
    if (!selectedMood || !transactionAmount) return '';
    
    switch (selectedMood.id) {
      case 'excited':
        return 'Great! Consider setting up regular transfers to build consistent support.';
      case 'satisfied':
        return 'Nice work! Your financial decisions appear to be on track.';
      case 'neutral':
        return 'It\'s okay to feel neutral. Consider reviewing your transfer goals.';
      case 'concerned':
        return 'If you\'re concerned, try breaking your transfers into smaller amounts.';
      case 'anxious':
        return 'It\'s normal to feel anxious. Consider talking to our support team for guidance.';
      default:
        return '';
    }
  };
  
  const getAmountImpactMessage = (): string => {
    if (!transactionAmount) return '';
    
    if (transactionAmount < 50) {
      return 'This is a small transfer, which is a good way to start.';
    } else if (transactionAmount < 200) {
      return 'This is a moderate transfer amount.';
    } else {
      return 'This is a significant transfer. Make sure it aligns with your financial plan.';
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={styles.title}>How do you feel about this transfer?</Text>
        
        <View style={styles.moodContainer}>
          {moods.map((mood, index) => (
            <Animated.View 
              key={mood.id}
              style={{ 
                transform: [{ scale: animationValues[index] }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.moodButton,
                  selectedMood?.id === mood.id && {
                    borderColor: mood.color,
                    backgroundColor: mood.color + '10', // 10% opacity
                  },
                ]}
                onPress={() => handleMoodSelect(mood, index)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        
        {selectedMood && (
          <View style={styles.feedbackContainer}>
            <View style={[styles.moodIndicator, { backgroundColor: selectedMood.color }]} />
            <Text style={styles.feedbackText}>{selectedMood.description}</Text>
            
            {transactionAmount && (
              <View style={styles.suggestionContainer}>
                <Feather name="info" size={16} color={theme.colors.primary} style={styles.infoIcon} />
                <Text style={styles.suggestionText}>
                  {getMoodSuggestion()}
                </Text>
              </View>
            )}
            
            {transactionAmount && (
              <View style={styles.suggestionContainer}>
                <Feather name="dollar-sign" size={16} color={theme.colors.primary} style={styles.infoIcon} />
                <Text style={styles.suggestionText}>
                  {getAmountImpactMessage()}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  title: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  moodButton: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.roundness.large
    borderWidth: 2,
    borderColor: theme.colors.border,
    width: 60,
    height: 80,
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: theme.fontSizes.xs,
    textAlign: 'center',
  },
  feedbackContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.medium,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  moodIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: theme.roundness.medium,
    borderBottomLeftRadius: theme.roundness.medium,
  },
  feedbackText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  infoIcon: {
    marginRight: theme.spacing.xs,
    marginTop: 2,
  },
  suggestionText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    flex: 1,
  },
});

export default MoneyMoodTracker;