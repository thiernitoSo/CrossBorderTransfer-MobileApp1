import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Button as PaperButton, Dialog, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import TabBar from '../../components/ui/TabBar';
import EmptyState from '../../components/ui/EmptyState';
import theme from '../../constants/theme';

type NotificationType = 'transaction' | 'system' | 'promotion' | 'security';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  data?: any;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'transaction',
    title: 'Transaction Completed',
    message: 'Your transfer of $150 to Kwame Nkrumah has been completed successfully.',
    date: '2025-03-30T14:35:00Z',
    isRead: false,
    data: { transactionId: '2' }
  },
  {
    id: '2',
    type: 'security',
    title: 'New Login Detected',
    message: 'A new login to your account was detected from Toronto, Canada.',
    date: '2025-03-29T10:22:00Z',
    isRead: false,
  },
  {
    id: '3',
    type: 'promotion',
    title: 'Fee-Free Transfer Weekend',
    message: 'Send money this weekend without any fees! Limited time promotion.',
    date: '2025-03-28T08:15:00Z',
    isRead: true,
  },
];

const NotificationItem: React.FC<{
  notification: Notification;
  onPress: (notification: Notification) => void;
}> = ({ notification, onPress }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'transaction':
        return 'refresh-cw';
      case 'system':
        return 'bell';
      case 'promotion':
        return 'gift';
      case 'security':
        return 'shield';
      default:
        return 'bell';
    }
  };
  
  const getIconColor = () => {
    switch (notification.type) {
      case 'transaction':
        return theme.colors.success;
      case 'system':
        return theme.colors.info;
      case 'promotion':
        return theme.colors.warning;
      case 'security':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <Card 
      style={[styles.notificationCard, notification.isRead ? styles.readCard : styles.unreadCard]} 
      onPress={() => onPress(notification)}
    >
      <Card.Content style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '15' }]}>
          <Feather name={getIcon()} size={22} color={getIconColor()} />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.notificationDate}>{formatDate(notification.date)}</Text>
        </View>
        
        {!notification.isRead && <View style={styles.unreadIndicator} />}
      </Card.Content>
    </Card>
  );
};

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }
    
    setSelectedNotification(notification);
    setShowDetailsDialog(true);
  };
  
  const handleDismissDetails = () => {
    setShowDetailsDialog(false);
    setSelectedNotification(null);
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };
  
  const handleClearNotifications = () => {
    setNotifications([]);
  };
  
  const handleActionPress = (notification: Notification) => {
    handleDismissDetails();
    
    if (notification.type === 'transaction' && notification.data?.transactionId) {
      router.push({
        pathname: '/(authenticated)/transactions',
        params: { transactionId: notification.data.transactionId }
      });
    } else if (notification.type === 'security') {
      router.push('/(authenticated)/security');
    } else if (notification.type === 'promotion') {
      router.push('/(authenticated)/send-money');
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header
          title="Notifications"
          showBackButton={true}
        />
        
        {notifications.length > 0 && (
          <View style={styles.actionsBar}>
            <Text style={styles.notificationCount}>
              {unreadCount} unread
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <Text 
                  style={[
                    styles.actionButtonText, 
                    unreadCount === 0 && styles.disabledActionText
                  ]}
                >
                  Mark all as read
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleClearNotifications}
              >
                <Text style={styles.actionButtonText}>
                  Clear all
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {notifications.length === 0 ? (
            <EmptyState
              icon="bell"
              title="No Notifications"
              message="You don't have any notifications at the moment."
            />
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={handleNotificationPress}
              />
            ))
          )}
        </ScrollView>
        
        <Portal>
          <Dialog visible={showDetailsDialog} onDismiss={handleDismissDetails}>
            <Dialog.Title>{selectedNotification?.title}</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogMessage}>{selectedNotification?.message}</Text>
              <Text style={styles.dialogDate}>
                {selectedNotification && new Date(selectedNotification.date).toLocaleString()}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <PaperButton onPress={handleDismissDetails}>Close</PaperButton>
              {selectedNotification && (
                <PaperButton 
                  onPress={() => handleActionPress(selectedNotification)}
                  mode="contained"
                >
                  {selectedNotification.type === 'transaction' ? 'View Transaction' :
                   selectedNotification.type === 'security' ? 'View Security Settings' :
                   selectedNotification.type === 'promotion' ? 'Send Money' : 'View Details'}
                </PaperButton>
              )}
            </Dialog.Actions>
          </Dialog>
        </Portal>
        
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
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  notificationCount: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: theme.spacing.md,
  },
  actionButtonText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
  },
  disabledActionText: {
    color: theme.colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  notificationCard: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.roundness.medium,
  },
  unreadCard: {
    backgroundColor: theme.colors.primary + '05', // 5% opacity
  },
  readCard: {
    opacity: 0.8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  notificationMessage: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginVertical: 4,
  },
  notificationDate: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textLight,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  dialogMessage: {
    marginBottom: theme.spacing.md,
  },
  dialogDate: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
  },
});