import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { availableMoods, Mood } from '../../services/mood';
import theme from '../../constants/theme';

interface MoneyMoodTrackerProps {
  onMoodSelected: (mood: Mood) => void;
  transactionAmount?: number;
  transactionCurrency?: string;
}

const MoneyMoodTracker: React.FC<MoneyMoodTrackerProps> = ({ 
  onMoodSelected,
  transactionAmount,
  transactionCurrency
}) => {
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  
  // Animation values for each mood item
  const scaleAnimations = availableMoods.map(() => new Animated.Value(1));
  const opacityAnimations = availableMoods.map(() => new Animated.Value(0.7));
  
  const handleMoodPress = (mood: Mood, index: number) => {
    // Reset previous animations
    if (selectedMoodId !== null) {
      const prevIndex = availableMoods.findIndex(m => m.id === selectedMoodId);
      if (prevIndex !== -1) {
        Animated.parallel([
          Animated.spring(scaleAnimations[prevIndex], {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnimations[prevIndex], {
            toValue: 0.7,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
    
    // Animate the selected mood
    Animated.parallel([
      Animated.spring(scaleAnimations[index], {
        toValue: 1.2,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnimations[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedMoodId(mood.id);
    onMoodSelected(mood);
  };
  
  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined || currency === undefined) return '';
    
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  return (
    <Card style={styles.container}>
      <Card.Content>
        <Title style={styles.title}>How do you feel about this transfer?</Title>
        
        {transactionAmount !== undefined && (
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionText}>
              Most recent transfer: {formatCurrency(transactionAmount, transactionCurrency)}
            </Text>
          </View>
        )}
        
        <View style={styles.moodGrid}>
          {availableMoods.map((mood, index) => (
            <Animated.View
              key={mood.id}
              style={[
                styles.moodItemContainer,
                {
                  transform: [{ scale: scaleAnimations[index] }],
                  opacity: opacityAnimations[index],
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.moodItem,
                  selectedMoodId === mood.id ? { borderColor: mood.color, borderWidth: 2 } : {}
                ]}
                onPress={() => handleMoodPress(mood, index)}
                activeOpacity={0.6}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
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
    fontSize: 18,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  transactionInfo: {
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  transactionText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  moodItemContainer: {
    width: '23%',
    marginBottom: theme.spacing.md,
  },
  moodItem: {
    borderRadius: 50, // Fully rounded
    padding: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.colors.text,
  },
});

export default MoneyMoodTracker;