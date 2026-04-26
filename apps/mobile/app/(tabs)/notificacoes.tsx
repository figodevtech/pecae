import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePecaeTheme } from '../../src/theme';
import { PecaeBackground, PecaeScreenContainer, PecaeGlassCard } from '../../src/components/PecaeUI';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../src/hooks/useNotifications';
import { Notification } from '../../src/services/notification.service';

export default function NotificacoesScreen() {
  const { colors, typography } = usePecaeTheme();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();

  const notifications = data?.pages.flatMap(page => page.items) || [];

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'SYSTEM':
        return 'information-circle-outline';
      case 'MESSAGE':
        return 'chatbubble-ellipses-outline';
      case 'VEHICLE_MATCH':
        return 'car-sport-outline';
      case 'PROMOTION':
        return 'pricetag-outline';
      default:
        return 'notifications-outline';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => handleNotificationPress(item)}
      style={styles.touchable}
    >
      <PecaeGlassCard 
        style={{
          ...styles.card,
          ...(!item.isRead ? { borderColor: colors.brand, borderWidth: 1 } : {})
        }}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: item.isRead ? 'rgba(255,255,255,0.05)' : colors.brand + '20' }]}>
            <Ionicons 
              name={getIconName(item.type)} 
              size={24} 
              color={item.isRead ? colors.textMuted : colors.brand} 
            />
          </View>
          
          <View style={styles.textContent}>
            <View style={styles.headerRow}>
              <Text 
                style={[
                  styles.title, 
                  { 
                    color: colors.textPrimary, 
                    fontFamily: item.isRead ? typography.body : typography.heading 
                  }
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[styles.time, { color: colors.textMuted, fontFamily: typography.mono }]}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
            
            <Text 
              style={[
                styles.body, 
                { 
                  color: colors.textMuted, 
                  fontFamily: typography.body 
                }
              ]}
              numberOfLines={2}
            >
              {item.body}
            </Text>
          </View>

          {!item.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: colors.brand }]} />
          )}
        </View>
      </PecaeGlassCard>
    </TouchableOpacity>
  );

  return (
    <PecaeBackground>
      <PecaeScreenContainer scrollable={false} style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.textPrimary, fontFamily: typography.display }]}>
            Notificações
          </Text>
          
          {notifications.some(n => !n.isRead) && (
            <TouchableOpacity 
              onPress={() => markAllAsRead()}
              style={styles.markAllButton}
            >
              <Ionicons name="checkmark-done" size={20} color={colors.brand} />
              <Text style={[styles.markAllText, { color: colors.brand, fontFamily: typography.medium }]}>
                Ler todas
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={colors.brand}
                colors={[colors.brand]}
              />
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator style={styles.footerLoader} color={colors.brand} />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textPrimary, fontFamily: typography.heading }]}>
                  Tudo limpo por aqui!
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Você não tem novas notificações no momento.
                </Text>
              </View>
            }
          />
        )}
      </PecaeScreenContainer>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  screenTitle: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 140, 78, 0.1)',
  },
  markAllText: {
    fontSize: 14,
    marginLeft: 6,
  },
  listContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  touchable: {
    marginBottom: 12,
  },
  card: {
    // Styles for the card wrapper
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContent: {
    flex: 1,
    marginRight: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    marginVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
