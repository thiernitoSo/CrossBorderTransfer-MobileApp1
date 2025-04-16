import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Text, Title, Divider } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { getMoodEntries, getMoodStatistics, getMoodById, MoodEntry } from '../../services/mood';
import theme from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface MoodHistoryProps {
  userId?: string;
  limit?: number;
  showHeader?: boolean;
  onMoodPress?: (moodEntry: MoodEntry) => void;
}

const MoodHistory: React.FC<MoodHistoryProps> = ({
  userId,
  limit = 5,
  showHeader = true,
  onMoodPress,
}) => {
  const { user } = useAuth();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<{
    mostFrequentMood: string;
    moodCounts: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    loadMoods();
  }, [userId]);

  const loadMoods = async () => {
    try {
      setLoading(true);
      const userMoods = await getMoodEntries();
      setMoods(userMoods.slice(0, limit));

      try {
        // Get statistics
        const stats = await getMoodStatistics();
        
        if (stats) {
          setStatistics({
            mostFrequentMood: stats.mostFrequentMood?.moodId || '',
            moodCounts: stats.moodDistribution || {},
          });
        }
      } catch (error) {
        console.error('Failed to load mood statistics:', error);
      }
    } catch (error) {
      console.error('Failed to load moods:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderMoodItem = ({ item }: { item: MoodEntry }) => {
    const mood = getMoodById(item.moodId);
    
    return (
      <TouchableOpacity
        style={styles.moodItem}
        onPress={() => onMoodPress?.(item)}
        disabled={!onMoodPress}
      >
        <View style={styles.moodEmojiContainer}>
          <Text style={styles.moodEmoji}>{mood?.emoji || '😶'}</Text>
        </View>
        <View style={styles.moodDetails}>
          <Text style={styles.moodLabel}>{mood?.label || 'Unknown'}</Text>
          <Text style={styles.moodDate}>
            {new Date(item.createdAt).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          {item.note && (
            <Text style={styles.moodNote} numberOfLines={1}>
              {item.note}
            </Text>
          )}
        </View>
        {onMoodPress && (
          <Feather
            name="chevron-right"
            size={18}
            color={theme.colors.textLight}
            style={styles.moodChevron}
          />
        )}
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="smile" size={40} color={theme.colors.textLight} />
      <Text style={styles.emptyText}>
        You haven't recorded any mood entries yet. Start by selecting a mood for your transfers!
      </Text>
    </View>
  );

  return (
    <Card style={styles.container}>
      {showHeader && (
        <>
          <Card.Content style={styles.header}>
            <Title style={styles.title}>Your Mood History</Title>
            
            {statistics && statistics.mostFrequentMood && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  Your most frequent mood: {getMoodById(statistics.mostFrequentMood)?.emoji || '😶'} {getMoodById(statistics.mostFrequentMood)?.label || 'Unknown'}
                </Text>
              </View>
            )}
          </Card.Content>
          <Divider />
        </>
      )}

      <Card.Content style={styles.content}>
        {moods.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={moods}
            renderItem={renderMoodItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <Divider />}
          />
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
  header: {
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  content: {
    paddingVertical: theme.spacing.xs,
  },
  loadingContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    marginTop: theme.spacing.xs,
  },
  statsText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  moodEmojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodDetails: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: theme.fontWeights.medium,
    marginBottom: 2,
  },
  moodDate: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  moodNote: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 2,
  },
  moodChevron: {
    marginLeft: theme.spacing.sm,
  },
  emptyState: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: theme.spacing.md,
    color: theme.colors.textLight,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default MoodHistory;