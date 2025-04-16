import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Divider, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Header from '../components/ui/Header';
import TabBar from '../components/ui/TabBar';
import AIChat from '../components/support/AIChat';
import ErrorMessage from '../components/ui/ErrorMessage';
import theme from '../constants/theme';

export default function Support() {
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const faqs = [
    {
      question: 'How long does it take for money to arrive?',
      answer: 'Most transfers are delivered within minutes for mobile money and within 1-2 business days for bank transfers, depending on the destination country and payment method.'
    },
    {
      question: 'What are the fees for sending money?',
      answer: 'Our fees range from 5% to 6% of the transfer amount, which is competitive for the industry. The exact fee depends on the destination country, amount, and payment method.'
    },
    {
      question: 'Which African countries can I send money to?',
      answer: 'We currently support transfers to Ghana, Nigeria, Kenya, Rwanda, Senegal, Côte d\'Ivoire, Cameroon, South Africa, Tanzania, Uganda, Ethiopia, and Morocco. We are regularly expanding our coverage.'
    },
    {
      question: 'What information do I need to send money?',
      answer: 'You will need to provide your recipient\'s name, phone number, and country. Depending on the payment method, you may also need their bank account details or mobile money account.'
    },
    {
      question: 'How do I verify my identity (KYC)?',
      answer: 'You will need to provide a government-issued ID (passport, driver\'s license, or national ID), proof of address, and complete a brief questionnaire about your source of funds and purpose of transfers.'
    },
  ];
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header
          title={showChat ? "AI Assistant" : "Support & Help"}
          showBackButton={true}
          rightAction={
            showChat ? (
              <Feather 
                name="x-circle" 
                size={24} 
                color={theme.colors.surface} 
                onPress={() => setShowChat(false)}
              />
            ) : null
          }
        />
        
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        )}
        
        {showChat ? (
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <AIChat />
          </KeyboardAvoidingView>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Card style={styles.chatCard} onPress={() => setShowChat(true)}>
              <Card.Content style={styles.chatCardContent}>
                <View style={styles.chatIconContainer}>
                  <Feather name="message-circle" size={30} color={theme.colors.surface} />
                </View>
                <View style={styles.chatTextContainer}>
                  <Text style={styles.chatTitle}>Chat with Rafiki AI</Text>
                  <Text style={styles.chatDescription}>
                    Our AI assistant can help answer your questions instantly
                  </Text>
                </View>
              </Card.Content>
            </Card>
            
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                
                {faqs.map((faq, index) => (
                  <React.Fragment key={index}>
                    <List.Accordion
                      title={faq.question}
                      titleStyle={styles.faqQuestion}
                      style={styles.faqItem}
                    >
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </List.Accordion>
                    {index < faqs.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </Card.Content>
            </Card>
            
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Contact Us</Text>
                
                <List.Item
                  title="Email Support"
                  description="support@sendafrika.com"
                  left={props => <List.Icon {...props} icon="mail" />}
                  style={styles.contactItem}
                />
                <Divider />
                
                <List.Item
                  title="Phone Support"
                  description="+1 (647) 555-1234"
                  left={props => <List.Icon {...props} icon="phone" />}
                  style={styles.contactItem}
                />
                <Divider />
                
                <List.Item
                  title="Office Hours"
                  description="Monday to Friday, 9 AM - 5 PM EST"
                  left={props => <List.Icon {...props} icon="clock" />}
                  style={styles.contactItem}
                />
              </Card.Content>
            </Card>
          </ScrollView>
        )}
        
        <TabBar />
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  chatCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.medium,
    backgroundColor: theme.colors.primary,
  },
  chatCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  chatIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  chatTextContainer: {
    flex: 1,
  },
  chatTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.surface,
  },
  chatDescription: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.surface + 'CC', // CC = 80% opacity
    marginTop: 2,
  },
  card: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness.medium,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.md,
  },
  faqItem: {
    paddingVertical: theme.spacing.xs,
  },
  faqQuestion: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  faqAnswer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    borderRadius: theme.roundness.small,
    marginBottom: theme.spacing.sm,
  },
  contactItem: {
    paddingVertical: theme.spacing.sm,
  },
});
