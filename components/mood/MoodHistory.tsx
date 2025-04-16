import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
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

interface MoodStats {
  totalEntries: number;
  moodDistribution: Record<string, number>;
  averageIntensity: number;
  mostCommonMood: string | null;
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

const MoodHistory: React.FC = () => {
  const { user } = useAuth();
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user?.id) {
      loadMoodHistory();
    }
  }, [user?.id]);

  const loadMoodHistory = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      let entries: MoodEntry[] = [];
      
      // Try to fetch from server API first
      try {
        const response = await fetch(`http://localhost:5000/api/mood-entries/${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            entries = data.data;
            // Sync with local storage
            await AsyncStorage.setItem(`moodEntries_${user.id}`, JSON.stringify(entries));
            console.log('Loaded entries from server', entries.length);
          }
        } else {
          throw new Error('Server request failed');
        }
      } catch (serverError) {
        console.log('Falling back to local storage', serverError);
        // Fallback to AsyncStorage
        const storedEntries = await AsyncStorage.getItem(`moodEntries_${user.id}`);
        if (storedEntries) {
          entries = JSON.parse(storedEntries);
          console.log('Loaded entries from AsyncStorage', entries.length);
        }
      }
      
      // Sort by date, newest first
      entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setMoodEntries(entries);
      
      // Calculate statistics
      if (entries.length > 0) {
        calculateStats(entries);
      }
      
      // Also try to fetch statistics from server
      try {
        const statsResponse = await fetch(`http://localhost:5000/api/mood-stats/${user.id}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.success && statsData.data) {
            console.log('Server statistics:', statsData.data);
            // We could use server stats instead of calculating locally
            // setStats(statsData.data);
          }
        }
      } catch (statsError) {
        console.log('Could not fetch stats from server', statsError);
      }
    } catch (error) {
      console.error('Error loading mood history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (entries: MoodEntry[]) => {
    // Initialize mood distribution
    const moodDistribution: Record<string, number> = {};
    moods.forEach(mood => {
      moodDistribution[mood.id] = 0;
    });
    
    // Count occurrences
    entries.forEach(entry => {
      moodDistribution[entry.moodId] = (moodDistribution[entry.moodId] || 0) + 1;
    });
    
    // Calculate average intensity
    const totalIntensity = entries.reduce((sum, entry) => sum + entry.intensity, 0);
    const averageIntensity = entries.length > 0 ? totalIntensity / entries.length : 0;
    
    // Find most common mood
    let mostCommonMood: string | null = null;
    let maxCount = 0;
    
    Object.entries(moodDistribution).forEach(([moodId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonMood = moodId;
      }
    });
    
    setStats({
      totalEntries: entries.length,
      moodDistribution,
      averageIntensity,
      mostCommonMood
    });
  };

  const getMoodById = (moodId: string): Mood | undefined => {
    return moods.find(mood => mood.id === moodId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b0ff" />
        <Text style={styles.loadingText}>Loading your mood history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {moodEntries.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.emptyStateText}>
              You haven't recorded any money moods yet. Start recording how your transactions make you feel!
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <>
          {stats && (
            <Card style={styles.card}>
              <Card.Title title="Your Money Mood Insights" />
              <Card.Content>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalEntries}</Text>
                    <Text style={styles.statLabel}>Total Entries</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.averageIntensity.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>Avg Intensity</Text>
                  </View>
                  
                  {stats.mostCommonMood && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {getMoodById(stats.mostCommonMood)?.emoji}
                      </Text>
                      <Text style={styles.statLabel}>Top Mood</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.sectionTitle}>Mood Distribution</Text>
                {Object.entries(stats.moodDistribution)
                  .filter(([_, count]) => count > 0)
                  .sort(([_, countA], [__, countB]) => countB - countA)
                  .map(([moodId, count]) => {
                    const mood = getMoodById(moodId);
                    if (!mood) return null;
                    
                    const percentage = Math.round((count / stats.totalEntries) * 100);
                    
                    return (
                      <View key={moodId} style={styles.distributionItem}>
                        <View style={styles.distributionLabel}>
                          <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                          <Text style={styles.moodName}>{mood.name}</Text>
                        </View>
                        <View style={styles.barContainer}>
                          <View 
                            style={[
                              styles.barFill, 
                              { width: `${percentage}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.countText}>{count}</Text>
                      </View>
                    );
                  })}
              </Card.Content>
            </Card>
          )}
          
          <Card style={[styles.card, { marginTop: 16 }]}>
            <Card.Title title="Your Mood History" />
            <Card.Content>
              {moodEntries.map(entry => {
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
        </>
      )}
    </ScrollView>
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
  },
  card: {
    borderRadius: 8,
    elevation: 4,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#757575',
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00b0ff',
  },
  statLabel: {
    color: '#757575',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  moodEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  moodName: {
    fontSize: 14,
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#00b0ff',
    borderRadius: 6,
  },
  countText: {
    width: 30,
    textAlign: 'right',
    fontSize: 12,
    color: '#757575',
  },
  historyItem: {
    marginBottom: 16,
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

export default MoodHistory;