import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import openAIService from '../../services/openai';
import theme from '../../constants/theme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I'm Rafiki, your AI assistant at SendAfrika. How can I help you with your money transfer needs today?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);
  
  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Convert messages to the format expected by OpenAI service
      const chatMessages = messages
        .concat(userMessage)
        .map(msg => ({
          role: msg.sender,
          content: msg.text,
        }));
      
      // Get response from AI
      const response = await openAIService.getChatResponse(chatMessages);
      
      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again later or contact human support.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        {!isUser && (
          <Avatar.Text
            size={36}
            label="RA"
            style={styles.avatar}
            color={theme.colors.surface}
            theme={{ colors: { primary: theme.colors.primary } }}
          />
        )}
        
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestampText, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };
  
  const renderSuggestion = (text: string) => (
    <TouchableOpacity 
      style={styles.suggestionButton}
      onPress={() => {
        setInputText(text);
      }}
    >
      <Text style={styles.suggestionText}>{text}</Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.introContainer}>
            <Text style={styles.introText}>
              Ask me any questions about sending money, fees, exchange rates, or how to use the app.
            </Text>
            <View style={styles.suggestionsContainer}>
              {renderSuggestion("What are the fees for sending money to Nigeria?")}
              {renderSuggestion("How long does a transfer take?")}
              {renderSuggestion("Which payment methods do you accept?")}
            </View>
          </View>
        }
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Rafiki is thinking...</Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Feather
            name="send"
            size={20}
            color={!inputText.trim() ? theme.colors.textMuted : theme.colors.surface}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  introContainer: {
    marginBottom: theme.spacing.lg,
  },
  introText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  suggestionsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  suggestionButton: {
    backgroundColor: theme.colors.primary + '10', // 10% opacity
    padding: theme.spacing.sm,
    borderRadius: theme.roundness.medium,
    marginVertical: theme.spacing.xs,
  },
  suggestionText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.xs,
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.xs,
  },
  messageBubble: {
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.md,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageText: {
    fontSize: theme.fontSizes.sm,
  },
  userText: {
    color: theme.colors.surface,
  },
  assistantText: {
    color: theme.colors.text,
  },
  timestampText: {
    fontSize: theme.fontSizes.xs,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: theme.colors.surface + 'CC', // CC = 80% opacity
  },
  assistantTimestamp: {
    color: theme.colors.textMuted,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness.medium,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    maxHeight: 100,
    color: theme.colors.text,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
});

export default AIChat;
