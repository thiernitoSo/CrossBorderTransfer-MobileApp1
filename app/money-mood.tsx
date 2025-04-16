import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { IconButton } from 'react-native-paper';
import MoneyMoodTracker from '../components/mood/MoneyMoodTracker';
import MoodHistory from '../components/mood/MoodHistory';

export default function MoneyMoodScreen() {
  const [activeTab, setActiveTab] = React.useState<string>('tracker');

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Money Mood Tracker',
          headerTitleStyle: { color: '#333' },
        }} 
      />
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'tracker' && styles.activeTab
          ]}
          onPress={() => setActiveTab('tracker')}
        >
          <IconButton icon="emoticon-outline" size={24} />
          <Text style={styles.tabLabel}>Record Mood</Text>
          {activeTab === 'tracker' && <View style={styles.indicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'history' && styles.activeTab
          ]}
          onPress={() => setActiveTab('history')}
        >
          <IconButton icon="chart-bar" size={24} />
          <Text style={styles.tabLabel}>Mood History</Text>
          {activeTab === 'history' && <View style={styles.indicator} />}
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        {activeTab === 'tracker' ? (
          <MoneyMoodTracker />
        ) : (
          <MoodHistory />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(0, 176, 255, 0.05)',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: -5,
    marginBottom: 5,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#00b0ff',
  },
  contentContainer: {
    flex: 1,
  }
});