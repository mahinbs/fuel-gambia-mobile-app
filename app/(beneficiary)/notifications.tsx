import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../store';
import { Card } from '../../components/ui/Card';
import { formatDateTime } from '../../utils/format';
import { Loading } from '../../components/ui/Loading';
import { COLOR_THEMES } from '../../utils/constants';

const theme = COLOR_THEMES.BENEFICIARY;

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ALLOCATION':
        return 'gift';
      case 'BALANCE':
        return 'warning';
      case 'PAYMENT':
        return 'card';
      case 'REDEMPTION':
        return 'checkmark-circle';
      case 'VERIFICATION':
        return 'shield-checkmark';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ALLOCATION':
        return theme.secondary;
      case 'BALANCE':
        return '#FF9500';
      case 'PAYMENT':
        return theme.primary;
      case 'REDEMPTION':
        return theme.secondary;
      case 'VERIFICATION':
        return theme.secondary;
      default:
        return '#8E8E93';
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <Card
          style={[
            styles.notificationCard,
            !item.read && styles.unreadCard,
          ]}
        >
          <View style={styles.notificationContent}>
            <View
              style={[
                styles.notificationIcon,
                { backgroundColor: getNotificationColor(item.type) + '20' },
              ]}
            >
              <Ionicons
                name={getNotificationIcon(item.type) as any}
                size={24}
                color={getNotificationColor(item.type)}
              />
            </View>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationDate}>
                {formatDateTime(item.createdAt)}
              </Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={fetchNotifications}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  markAllButton: {
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  notificationCard: {
    marginBottom: 12,
    padding: 16,
  },
  unreadCard: {
    backgroundColor: '#F0F8FF',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
});
