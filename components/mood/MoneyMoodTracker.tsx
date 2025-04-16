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

import { Card, Button, Icon, Divider, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
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
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Animated values for mood selection
  const [emojiScale] = useState<Animated.Value[]>(
    moods.map(() => new Animated.Value(1))
  );
  const [selectionAnim] = useState(new Animated.Value(0));

  // Load existing mood entries from server with AsyncStorage fallback
  useEffect(() => {
    loadMoodEntries();
  }, [user?.id]);
  
  // Reset animations when selectedMood is cleared
  useEffect(() => {
    if (selectedMood === null) {
      // Reset all emoji scales
      emojiScale.forEach(scale => scale.setValue(1));
      // Reset selection animation
      selectionAnim.setValue(0);
    }
  }, [selectedMood]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMoodEntries();
    setRefreshing(false);
  };

  const loadMoodEntries = async () => {
    if (!user?.id) return;
    
    if (!refreshing) setLoading(true);
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

  const handleSelectMood = (moodId: string, index: number) => {
    // Animate the selected emoji
    Animated.sequence([
      // First scale up
      Animated.timing(emojiScale[index], {
        toValue: 1.5,
        duration: 200,
        useNativeDriver: true,
      }),
      // Then scale back down slightly
      Animated.timing(emojiScale[index], {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animate the details section appearance
    Animated.spring(selectionAnim, {
      toValue: 1,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b0ff" />
        <Text style={styles.loadingText}>Loading your mood data...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {refreshing && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="small" color="#00b0ff" />
          <Text style={styles.refreshText}>Refreshing data...</Text>
        </View>
      )}
      <ScrollView 
        style={styles.container}
        onScroll={({ nativeEvent }) => {
          // Simple pull-to-refresh implementation
          const { contentOffset } = nativeEvent;
          if (contentOffset.y <= -50 && !refreshing) {
            onRefresh();
          }
        }}
        scrollEventThrottle={400}
      >
      <Card style={styles.card}>
        <Card.Title 
          title="Money Mood Tracker" 
          subtitle="How does this transaction make you feel?" 
          titleStyle={styles.cardTitle}
          subtitleStyle={styles.cardSubtitle}
        />
        <Card.Content>
          <View style={styles.moodGrid}>
            {moods.map((mood, index) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodItem,
                  selectedMood === mood.id && styles.selectedMood
                ]}
                onPress={() => handleSelectMood(mood.id, index)}
              >
                <Animated.Text 
                  style={[
                    styles.moodEmoji, 
                    { 
                      transform: [
                        { scale: emojiScale[index] }
                      ] 
                    }
                  ]}
                >
                  {mood.emoji}
                </Animated.Text>
                <Text style={styles.moodName}>{mood.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedMood && (
            <Animated.View 
              style={[
                styles.detailsSection, 
                {
                  opacity: selectionAnim,
                  transform: [
                    { translateY: selectionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }
                  ]
                }
              ]}
            >
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
            </Animated.View>
          )}
        </Card.Content>
      </Card>
      
      {moodEntries.length === 0 ? (
        <Card style={[styles.card, { marginTop: 20 }]}>
          <Card.Content>
            <View style={{ 
              alignItems: 'center', 
              padding: 24, 
              justifyContent: 'center' 
            }}>
              <Icon source="emoticon-outline" size={48} color="#cccccc" />
              <Text style={{ 
                textAlign: 'center', 
                marginTop: 16, 
                color: '#666',
                fontSize: 14,
                lineHeight: 20
              }}>
                No mood entries recorded yet. Start tracking your money mood by selecting an emotion above.
              </Text>
              <Button 
                mode="outlined" 
                onPress={loadMoodEntries} 
                style={{ marginTop: 16 }}
                icon={() => <Icon source="refresh" size={16} color="#00b0ff" />}
              >
                Refresh
              </Button>
            </View>
          </Card.Content>
        </Card>
      ) : (
        <Card style={[styles.card, { marginTop: 20 }]}>
          <Card.Title 
            title="Your Mood History" 
            titleStyle={styles.cardTitle}
            subtitle={`${moodEntries.length} recorded mood entries`}
            subtitleStyle={styles.cardSubtitle}
            right={(props) => (
              <IconButton 
                {...props} 
                icon={() => <Icon source="refresh" size={24} color="#00b0ff" />}
                onPress={() => {
                  // Show a loading feedback
                  Alert.alert('Syncing', 'Refreshing mood entries from server...');
                  loadMoodEntries();
                }} 
              />
            )}
          />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0088aa',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
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
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedMood: {
    backgroundColor: '#e0f7fa',
    borderWidth: 2,
    borderColor: '#00b0ff',
    shadowColor: '#0088cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  moodName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    color: '#444',
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
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  intensityBar: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    marginHorizontal: 15,
    alignItems: 'center',
  },
  intensityDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  activeDot: {
    backgroundColor: '#00b0ff',
    borderColor: '#0088cc',
    shadowColor: '#0088cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  intensityLabel: {
    textAlign: 'center',
    marginTop: 8,
    color: '#444',
    fontWeight: '500',
    fontSize: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: 'center',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    minHeight: 100,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  historyItem: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#d6ebf2',
  },
  historyEmoji: {
    fontSize: 22,
    marginRight: 6,
  },
  historyMoodName: {
    fontWeight: '600',
    color: '#0088aa',
  },
  historyDate: {
    color: '#757575',
    fontSize: 12,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyIntensity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  intensityDots: {
    flexDirection: 'row',
    marginLeft: 6,
  },
  smallDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginRight: 5,
    borderWidth: 0.5,
    borderColor: '#d0d0d0',
  },
  activeSmallDot: {
    backgroundColor: '#00b0ff',
    borderColor: '#0088cc',
  },
  historyNote: {
    fontStyle: 'italic',
    color: '#555',
    marginTop: 6,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00b0ff',
  },
  divider: {
    marginTop: 10,
    height: 0,
  },
  refreshIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 176, 255, 0.1)',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  refreshText: {
    marginLeft: 8,
    color: '#00b0ff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MoneyMoodTracker;