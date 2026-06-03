import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PecaeBackground, PecaeGlassCard } from '../../../src/components/PecaeUI';
import { usePecaeTheme } from '../../../src/theme';
import { useSellerDashboard } from '../../../src/hooks/useSellerDashboard';

export default function SellerMessagesScreen() {
  const { colors, typography } = usePecaeTheme();
  const router = useRouter();
  const { recentMessages, isLoadingMessages, refresh } = useSellerDashboard();

  const renderMessage = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.messageItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <PecaeGlassCard style={styles.messageCard}>
        <View style={styles.messageRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.avatarLetter, { color: colors.brand, fontFamily: typography.display }]}>
              {item.senderName.charAt(0)}
            </Text>
          </View>
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={[styles.senderName, { color: colors.textPrimary, fontFamily: typography.display }]}>
                {item.senderName}
              </Text>
              <Text style={[styles.messageTime, { color: colors.textMuted, fontFamily: typography.body }]}>
                {item.time}
              </Text>
            </View>
            <Text style={[styles.messageSubject, { color: colors.brand, fontFamily: typography.medium }]} numberOfLines={1}>
              {item.subject}
            </Text>
            <Text style={[styles.messageText, { color: colors.textMuted, fontFamily: typography.body }]} numberOfLines={1}>
              {item.lastText}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </PecaeGlassCard>
    </TouchableOpacity>
  );

  return (
    <PecaeBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
            MENSAGENS
          </Text>
        </View>

        {isLoadingMessages ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : (
          <FlatList
            data={recentMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={isLoadingMessages} onRefresh={refresh} tintColor={colors.brand} />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: typography.body }]}>
                  Nenhuma mensagem ativa no momento.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </PecaeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  messageItem: {
    marginBottom: 12,
  },
  messageCard: {
    padding: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarLetter: {
    fontSize: 20,
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 15,
  },
  messageTime: {
    fontSize: 11,
  },
  messageSubject: {
    fontSize: 12,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
});
