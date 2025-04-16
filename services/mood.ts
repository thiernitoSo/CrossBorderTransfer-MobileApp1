import { get, post, put } from './api';
import { Mood } from '../components/mood/MoneyMoodTracker';

export interface MoodEntry {
  id: string;
  userId: string;
  transactionId?: string;
  moodId: string;
  note?: string;
  createdAt: string;
}

export interface CreateMoodEntryData {
  transactionId?: string;
  moodId: string;
  note?: string;
}

/**
 * Save a new mood entry
 */
export const saveMoodEntry = async (data: CreateMoodEntryData): Promise<MoodEntry> => {
  try {
    return await post('/api/moods', data);
  } catch (error) {
    console.error('Failed to save mood entry:', error);
    throw error;
  }
};

/**
 * Get all mood entries for the current user
 */
export const getMoodEntries = async (): Promise<MoodEntry[]> => {
  try {
    return await get('/api/moods');
  } catch (error) {
    console.error('Failed to fetch mood entries:', error);
    throw error;
  }
};

/**
 * Get mood entry by ID
 */
export const getMoodEntry = async (id: string): Promise<MoodEntry> => {
  try {
    return await get(`/api/moods/${id}`);
  } catch (error) {
    console.error(`Failed to fetch mood entry ${id}:`, error);
    throw error;
  }
};

/**
 * Get mood entries for a specific transaction
 */
export const getMoodEntriesByTransaction = async (transactionId: string): Promise<MoodEntry[]> => {
  try {
    return await get(`/api/moods/transaction/${transactionId}`);
  } catch (error) {
    console.error(`Failed to fetch mood entries for transaction ${transactionId}:`, error);
    throw error;
  }
};

/**
 * Update an existing mood entry
 */
export const updateMoodEntry = async (
  id: string,
  data: Partial<CreateMoodEntryData>
): Promise<MoodEntry> => {
  try {
    return await put(`/api/moods/${id}`, data);
  } catch (error) {
    console.error(`Failed to update mood entry ${id}:`, error);
    throw error;
  }
};

/**
 * Get mood statistics for user dashboard
 */
export const getMoodStatistics = async (): Promise<{
  mostFrequentMood: string;
  moodCounts: Record<string, number>;
  recentMoods: MoodEntry[];
}> => {
  try {
    return await get('/api/moods/statistics');
  } catch (error) {
    console.error('Failed to fetch mood statistics:', error);
    throw error;
  }
};

export default {
  saveMoodEntry,
  getMoodEntries,
  getMoodEntry,
  getMoodEntriesByTransaction,
  updateMoodEntry,
  getMoodStatistics,
};