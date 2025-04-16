import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Animated,
  Dimensions 
} from 'react-native';
import { Card, Button, Icon, Divider, Chip, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define mood types
interface Mood {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface MoodEntry {
  id: string;
  userId: string;
  transactionId?: string;
  moodId: string;
  intensity: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

const moods: Mood[] = [
  { id: 'happy', name: 'Happy', emoji: '😊', description: 'Feeling good about this transaction' },
  { id: 'excited', name: 'Excited', emoji: '😃', description: 'Enthusiastic about this money transfer' },
  { id: 'anxious', name: 'Anxious', emoji: '😟', description: 'Feeling worried about this transfer' },
  { id: 'relieved', name: 'Relieved', emoji: '😌', description: 'Feeling at ease now that it\'s done' },
  { id: 'frustrated', name: 'Frustrated', emoji: '😤', description: 'Annoyed by the process' },
  { id: 'confident', name: 'Confident', emoji: '😎', description: 'Assured about this transfer' },
  { id: 'grateful', name: 'Grateful', emoji: '🙏', description: 'Thankful for being able to send money' },
  { id: 'hopeful', name: 'Hopeful', emoji: '🤞', description: 'Optimistic about this transaction' }
];

const MoneyMoodTracker: React.FC<{ transactionId?: string }> = ({ transactionId }) => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState<string>('');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load existing mood entries from server with AsyncStorage fallback
  useEffect(() => {
    loadMoodEntries();
  }, [user?.id]);

  const loadMoodEntries = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      let entries: MoodEntry[] = [];
      
      // Try to fetch from server API first
      try {
        const endpoint = transactionId 
          ? `http://localhost:5000/api/mood-entries/transaction/${transactionId}`
          : `http://localhost:5000/api/mood-entries/${user.id}`;
          
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            entries = data.data;
            // Sync with local storage
            await AsyncStorage.setItem(`moodEntries_${user.id}`, JSON.stringify(entries));
          }
        } else {
          // Server request failed, fallback to local storage
          throw new Error('Server request failed');
        }
      } catch (serverError) {
        console.log('Falling back to local storage', serverError);
        // Fallback to AsyncStorage
        const storedEntries = await AsyncStorage.getItem(`moodEntries_${user.id}`);
        if (storedEntries) {
          entries = JSON.parse(storedEntries);
        }
      }
      
      // If transactionId is provided, filter entries for this transaction
      const filteredEntries = transactionId 
        ? entries.filter(entry => entry.transactionId === transactionId)
        : entries;
        
      setMoodEntries(filteredEntries);
    } catch (error) {
      console.error('Error loading mood entries:', error);
      Alert.alert('Error', 'Failed to load your mood entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMood = (moodId: string) => {
    setSelectedMood(moodId);
  };

  const handleIntensityChange = (value: number) => {
    setIntensity(Math.max(1, Math.min(5, value)));
  };

  const handleSubmit = async () => {
    if (!selectedMood || !user?.id) {
      Alert.alert('Error', 'Please select a mood before submitting');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create new mood entry
      const newEntry: MoodEntry = {
        id: Math.random().toString(36).substring(2, 9), // Simple ID generation
        userId: user.id,
        transactionId: transactionId,
        moodId: selectedMood,
        intensity,
        note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Try to save to server first
      let savedToServer = false;
      
      try {
        const response = await fetch('http://localhost:5000/api/mood-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEntry),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Server response:', data);
          if (data.success && data.data) {
            // Use the server-generated ID instead
            newEntry.id = data.data.id;
            savedToServer = true;
          }
        } else {
          throw new Error('Server request failed');
        }
      } catch (serverError) {
        console.log('Failed to save to server, saving locally only', serverError);
        // Will continue with local storage saving
      }
      
      // Get existing entries from storage
      const storedEntries = await AsyncStorage.getItem(`moodEntries_${user.id}`);
      const existingEntries: MoodEntry[] = storedEntries ? JSON.parse(storedEntries) : [];
      
      // Add new entry
      const updatedEntries = [...existingEntries, newEntry];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(`moodEntries_${user.id}`, JSON.stringify(updatedEntries));
      
      // Update local state
      if (!transactionId || newEntry.transactionId === transactionId) {
        setMoodEntries([...moodEntries, newEntry]);
      }
      
      // Reset form
      setSelectedMood(null);
      setIntensity(3);
      setNote('');
      
      Alert.alert(
        'Success', 
        savedToServer 
          ? 'Your mood has been recorded to the server!' 
          : 'Your mood has been saved locally and will sync with the server when available.'
      );
      
    } catch (error) {
      console.error('Error saving mood entry:', error);
      Alert.alert('Error', 'Failed to save your mood entry');
    } finally {
      setSubmitting(false);
    }
  };

  const getMoodById = (moodId: string): Mood | undefined => {
    return moods.find(mood => mood.id === moodId);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Money Mood Tracker" subtitle="How does this transaction make you feel?" />
        <Card.Content>
          <View style={styles.moodGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodItem,
                  selectedMood === mood.id && styles.selectedMood
                ]}
                onPress={() => handleSelectMood(mood.id)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodName}>{mood.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedMood && (
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Intensity</Text>
              <View style={styles.intensityContainer}>
                <TouchableOpacity onPress={() => handleIntensityChange(intensity - 1)}>
                  <Icon source="minus" size={24} color="#333" />
                </TouchableOpacity>
                
                <View style={styles.intensityBar}>
                  {[1, 2, 3, 4, 5].map(level => (
                    <TouchableOpacity 
                      key={level}
                      style={[
                        styles.intensityDot,
                        level <= intensity && styles.activeDot
                      ]}
                      onPress={() => setIntensity(level)}
                    />
                  ))}
                </View>
                
                <TouchableOpacity onPress={() => handleIntensityChange(intensity + 1)}>
                  <Icon source="plus" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.intensityLabel}>
                {intensity === 1 && 'Very Mild'}
                {intensity === 2 && 'Mild'}
                {intensity === 3 && 'Moderate'}
                {intensity === 4 && 'Strong'}
                {intensity === 5 && 'Very Strong'}
              </Text>
              
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Add a Note (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Why do you feel this way?"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
              
              <Button 
                mode="contained" 
                onPress={handleSubmit} 
                loading={submitting}
                disabled={submitting || !selectedMood}
                style={styles.submitButton}
              >
                Record My Mood
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
      
      {moodEntries.length > 0 && (
        <Card style={[styles.card, { marginTop: 20 }]}>
          <Card.Title title="Your Mood History" />
          <Card.Content>
            {moodEntries.map((entry) => {
              const mood = getMoodById(entry.moodId);
              if (!mood) return null;
              
              return (
                <View key={entry.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View style={styles.moodChip}>
                      <Text style={styles.historyEmoji}>{mood.emoji}</Text>
                      <Text style={styles.historyMoodName}>{mood.name}</Text>
                    </View>
                    <Text style={styles.historyDate}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.historyIntensity}>
                    <Text>Intensity: </Text>
                    <View style={styles.intensityDots}>
                      {[1, 2, 3, 4, 5].map(level => (
                        <View 
                          key={level}
                          style={[
                            styles.smallDot,
                            level <= entry.intensity && styles.activeSmallDot
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                  
                  {entry.note && (
                    <Text style={styles.historyNote}>{entry.note}</Text>
                  )}
                  <Divider style={styles.divider} />
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 8,
    elevation: 4,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  moodItem: {
    width: '23%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    padding: 8,
  },
  selectedMood: {
    backgroundColor: '#e0f7fa',
    borderWidth: 2,
    borderColor: '#00b0ff',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodName: {
    fontSize: 12,
    textAlign: 'center',
  },
  detailsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intensityBar: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    marginHorizontal: 15,
  },
  intensityDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },
  activeDot: {
    backgroundColor: '#00b0ff',
  },
  intensityLabel: {
    textAlign: 'center',
    marginTop: 8,
    color: '#757575',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    minHeight: 80,
  },
  submitButton: {
    marginTop: 20,
  },
  historyItem: {
    marginBottom: 15,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  historyEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  historyMoodName: {
    fontWeight: '600',
  },
  historyDate: {
    color: '#757575',
    fontSize: 12,
  },
  historyIntensity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  intensityDots: {
    flexDirection: 'row',
  },
  smallDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginRight: 4,
  },
  activeSmallDot: {
    backgroundColor: '#00b0ff',
  },
  historyNote: {
    fontStyle: 'italic',
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginTop: 10,
  },
});

export default MoneyMoodTracker;