import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/ui/Header';
import ErrorMessage from '../../components/ui/ErrorMessage';
import MoneyMoodTracker, { Mood } from '../../components/mood/MoneyMoodTracker';
import MoodHistory from '../../components/mood/MoodHistory';
import theme from '../../constants/theme';
import moodService, { MoodEntry } from '../../services/mood';
import transactionService from '../../services/transaction';

export default function MoneyMood() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);

  useEffect(() => {
    loadRecentTransaction();
  }, []);

  const loadRecentTransaction = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactions(1, 1);
      if (response && response.transactions && response.transactions.length > 0) {
        setCurrentTransaction(response.transactions[0]);
      }
    } catch (error) {
      console.error('Failed to load recent transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelected = (mood: Mood) => {
    setSelectedMood(mood);
  };

  const handleAddNote = () => {
    setShowNoteInput(true);
  };

  const handleSaveMood = async () => {
    if (!selectedMood) {
      setError('Please select a mood first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const moodData = {
        moodId: selectedMood.id,
        transactionId: currentTransaction?.id,
        note: note,
      };

      await moodService.saveMoodEntry(moodData);

      Alert.alert(
        'Mood Saved!',
        'Your money mood has been recorded successfully.',
        [{ text: 'OK' }]
      );

      // Reset state
      setSelectedMood(null);
      setNote('');
      setShowNoteInput(false);
    } catch (error) {
      console.error('Failed to save mood:', error);
      setError('Failed to save your mood. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header title="Money Mood Tracker" />

        <ScrollView style={styles.scrollView}>
          {error && (
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          )}

          <View style={styles.content}>
            <Card style={styles.introCard}>
              <Card.Content>
                <Text style={styles.introTitle}>
                  <Feather name="smile" size={20} color={theme.colors.primary} /> Track Your Financial Emotions
                </Text>
                <Text style={styles.introText}>
                  Research shows that understanding our emotional relationship with money helps us make better financial decisions. 
                  Use this tracker to record how you feel about your money transfers.
                </Text>
              </Card.Content>
            </Card>

            <MoneyMoodTracker
              onMoodSelected={handleMoodSelected}
              transactionAmount={currentTransaction?.sourceAmount}
              transactionCurrency={currentTransaction?.sourceCurrency}
            />

            {selectedMood && (
              <Card style={styles.actionCard}>
                <Card.Content>
                  <View style={styles.selectedMoodContainer}>
                    <Text style={styles.selectedMoodText}>
                      Selected mood: <Text style={styles.boldText}>{selectedMood.emoji} {selectedMood.label}</Text>
                    </Text>
                  </View>

                  {showNoteInput ? (
                    <View style={styles.noteContainer}>
                      <TextInput
                        style={styles.noteInput}
                        placeholder="Add a note about why you feel this way..."
                        value={note}
                        onChangeText={setNote}
                        multiline
                      />
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addNoteButton} 
                      onPress={handleAddNote}
                    >
                      <Feather name="plus-circle" size={16} color={theme.colors.primary} />
                      <Text style={styles.addNoteText}>Add a note</Text>
                    </TouchableOpacity>
                  )}

                  <Button
                    mode="contained"
                    onPress={handleSaveMood}
                    loading={loading}
                    style={styles.saveButton}
                  >
                    Save My Mood
                  </Button>
                </Card.Content>
              </Card>
            )}

            <MoodHistory 
              limit={3}
              showHeader={true}
              onMoodPress={(moodEntry) => {
                Alert.alert(
                  'Mood Details',
                  `${moodEntry.note || 'No note available'}`
                );
              }}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  introCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  introTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
  },
  introText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  actionCard: {
    marginVertical: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  selectedMoodContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  selectedMoodText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  boldText: {
    fontWeight: theme.fontWeights.bold,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.roundness.medium,
    marginBottom: theme.spacing.md,
  },
  addNoteText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.primary,
    fontSize: theme.fontSizes.md,
  },
  noteContainer: {
    marginBottom: theme.spacing.md,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    paddingVertical: theme.spacing.xs,
  },
});