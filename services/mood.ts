import { get, post, put, del } from './api';

export interface Mood {
  id: string;
  name: string;
  emoji: string;
  label: string;
  color: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  transactionId?: string;
  moodId: string;
  mood?: Mood;
  intensity?: number;
  note?: string;
  createdAt: string;
}

export interface MoodStatistics {
  totalCount: number;
  moodDistribution: Record<string, number>;
  mostFrequentMood: {
    moodId: string;
    count: number;
  };
  recentTrend: string;
}

/**
 * Get all moods for the current user
 */
export const getMoodEntries = async (userId?: string): Promise<MoodEntry[]> => {
  try {
    // If userId is provided, get mood entries for that user
    if (userId) {
      return await get(`/api/mood-entries/${userId}`);
    }
    return await get('/api/moods');
  } catch (error) {
    console.error('Failed to get mood entries:', error);
    // Return empty array in case of error to avoid app crashes
    return [];
  }
};

/**
 * Get mood entries by transaction ID
 */
export const getMoodEntriesByTransaction = async (transactionId: string): Promise<MoodEntry[]> => {
  try {
    return await get(`/api/moods/transaction/${transactionId}`);
  } catch (error) {
    console.error(`Failed to get mood entries for transaction ${transactionId}:`, error);
    throw error;
  }
};

/**
 * Create a new mood entry
 */
export const saveMoodEntry = async (data: Partial<MoodEntry>): Promise<MoodEntry> => {
  try {
    // Use the new endpoint that's actually implemented on the server
    return await post('/api/mood-entries', {
      userId: data.userId,
      transactionId: data.transactionId,
      moodId: data.moodId,
      intensity: data.intensity || 3,
      note: data.note || ''
    });
  } catch (error) {
    console.error('Failed to save mood entry:', error);
    throw error;
  }
};

/**
 * Get mood statistics for the current user
 */
export const getMoodStatistics = async (userId?: string): Promise<MoodStatistics> => {
  try {
    if (userId) {
      return await get(`/api/mood-stats/${userId}`);
    }
    return await get('/api/moods/statistics');
  } catch (error) {
    console.error('Failed to get mood statistics:', error);
    // Return default statistics to avoid app crashes
    return {
      totalCount: 0,
      moodDistribution: {},
      mostFrequentMood: {
        moodId: '',
        count: 0
      },
      recentTrend: 'neutral'
    };
  }
};

/**
 * Available moods for selection
 */
export const availableMoods: Mood[] = [
  {
    id: 'happy',
    name: 'Happy',
    emoji: '😊',
    label: 'Happy',
    color: '#4CAF50',
  },
  {
    id: 'excited',
    name: 'Excited',
    emoji: '😃',
    label: 'Excited',
    color: '#2196F3',
  },
  {
    id: 'nervous',
    name: 'Nervous',
    emoji: '😬',
    label: 'Nervous',
    color: '#FFC107',
  },
  {
    id: 'worried',
    name: 'Worried',
    emoji: '😟',
    label: 'Worried',
    color: '#FF9800',
  },
  {
    id: 'sad',
    name: 'Sad',
    emoji: '😔',
    label: 'Sad',
    color: '#9E9E9E',
  },
  {
    id: 'confused',
    name: 'Confused',
    emoji: '😕',
    label: 'Confused',
    color: '#9C27B0',
  },
  {
    id: 'confident',
    name: 'Confident',
    emoji: '😎',
    label: 'Confident',
    color: '#673AB7',
  },
  {
    id: 'grateful',
    name: 'Grateful',
    emoji: '🙏',
    label: 'Grateful',
    color: '#3F51B5',
  },
];

/**
 * Get mood by ID
 */
export const getMoodById = (moodId: string): Mood | undefined => {
  return availableMoods.find(mood => mood.id === moodId);
};

export default {
  getMoodEntries,
  getMoodEntriesByTransaction,
  saveMoodEntry,
  getMoodStatistics,
  availableMoods,
  getMoodById,
};