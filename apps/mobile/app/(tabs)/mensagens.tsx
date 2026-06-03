import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { PecaeBackground, PecaeGlassCard } from '../../src/components/PecaeUI';
import { usePecaeTheme } from '../../src/theme';
import { api } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../src/store/auth-store';
import { supabase } from '../../src/services/supabase';

interface ChatRoom {
  id: string;
  listingId: string;
  listingTitle: string;
  listingThumbnail: string | null;
  interlocutor: {
    name: string | null;
    avatar: string | null;
  };
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export default function MensagensScreen() {
  const { colors, typography, effects } = usePecaeTheme();
  const { user } = useAuthStore();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/chat/rooms');
      // Sort by last message date or updatedAt
      const sortedRooms = response.data.sort((a: ChatRoom, b: ChatRoom) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
      setRooms(sortedRooms);
    } catch (error) {
      console.error('Falha ao carregar salas de chat:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    
    // Assinatura global para recarregar a lista de conversas caso receba nova mensagem
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRooms();
  };

  const handleRoomPress = (roomId: string) => {
    router.push(`/chat/${roomId}`);
  };

  const renderItem = ({ item }: { item: ChatRoom }) => {
    const lastDate = item.lastMessage ? new Date(item.lastMessage.createdAt) : new Date(item.updatedAt);
    const now = new Date();
    const isToday = lastDate.toDateString() === now.toDateString();
    
    const formattedDate = isToday
      ? lastDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : lastDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    return (
      <TouchableOpacity 
        onPress={() => handleRoomPress(item.id)}
        activeOpacity={0.85}
        style={styles.roomWrapper}
      >
        <PecaeGlassCard 
          intensity={item.unreadCount > 0 ? 25 : 12} 
          style={[
            styles.card, 
            { 
              borderRadius: effects.radius.lg,
              borderColor: item.unreadCount > 0 ? `${colors.brand}66` : colors.border 
            }
          ]}
        >
          <View style={styles.contentRow}>
            {/* Image Section */}
            <View style={styles.imageContainer}>
              {item.listingThumbnail ? (
                <Image 
                  source={{ uri: item.listingThumbnail }} 
                  style={[styles.thumbnail, { borderRadius: effects.radius.md }]}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderRadius: effects.radius.md }]}>
                  <Ionicons name="car-outline" size={24} color={colors.brand} />
                </View>
              )}
              
              {/* Profile Avatar Overlay */}
              <View style={[styles.avatarOverlay, { borderColor: colors.background }]}>
                {item.interlocutor.avatar ? (
                  <Image source={{ uri: item.interlocutor.avatar }} style={styles.smallAvatar} />
                ) : (
                  <View style={[styles.smallAvatarPlaceholder, { backgroundColor: colors.brand }]}>
                    <Text style={[styles.initialText, { color: '#000', fontFamily: typography.display }]}>
                      {item.interlocutor.name?.[0].toUpperCase() || 'P'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.infoWrapper}>
              <View style={styles.headerRow}>
                <Text 
                  style={[styles.interlocutorName, { color: colors.textPrimary, fontFamily: typography.display }]}
                  numberOfLines={1}
                >
                  {item.interlocutor.name || 'Usuário PECAÊ'}
                </Text>
                <Text style={[styles.dateText, { color: item.unreadCount > 0 ? colors.brand : colors.textMuted, fontFamily: typography.body }]}>
                  {formattedDate}
                </Text>
              </View>

              <Text 
                style={[styles.listingTitle, { color: colors.brand, fontFamily: typography.medium }]}
                numberOfLines={1}
              >
                {item.listingTitle?.toUpperCase() || 'NEGOCIAÇÃO'}
              </Text>

              <View style={styles.messagePreviewRow}>
                <Text 
                  style={[
                    styles.lastMessage, 
                    { 
                      color: item.unreadCount > 0 ? colors.textPrimary : colors.textMuted, 
                      fontFamily: item.unreadCount > 0 ? typography.medium : typography.body,
                      flex: 1
                    }
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage ? item.lastMessage.content : 'Inicie a negociação...'}
                </Text>
                
                {item.unreadCount > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.brand }]}>
                    <Text style={[styles.unreadText, { color: '#000', fontFamily: typography.display }]}>
                      {item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={16} color={`${colors.textMuted}44`} />
          </View>
        </PecaeGlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <PecaeBackground>
      <View style={styles.container}>
        {/* Decorative Header Background */}
        <View style={styles.headerDecoration}>
          <View style={[styles.glow, { backgroundColor: colors.brand, opacity: 0.05 }]} />
        </View>

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.display }]}>
              MESSAGES
            </Text>
            <View style={[styles.activeIndicator, { backgroundColor: colors.brand }]} />
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: typography.body }]}>
            SECURE TERMINAL // ACTIVE NEGOTIATIONS
          </Text>
        </View>

        {isLoading && !isRefreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={[styles.loadingText, { color: colors.textMuted, fontFamily: typography.body }]}>
              ESTABLISHING CONNECTION...
            </Text>
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={isRefreshing} 
                onRefresh={handleRefresh}
                colors={[colors.brand]}
                tintColor={colors.brand}
                progressBackgroundColor={colors.surface}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <PecaeGlassCard intensity={5} style={[styles.emptyCard, { borderRadius: effects.radius.lg }]}>
                  <Ionicons name="chatbubbles-outline" size={48} color={`${colors.textMuted}33`} />
                  <Text style={[styles.emptyText, { color: colors.textPrimary, fontFamily: typography.display }]}>
                    NO ACTIVE CHATS
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted, fontFamily: typography.body }]}>
                    Browse vehicles and start a conversation with sellers to see them here.
                  </Text>
                </PecaeGlassCard>
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
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'hidden',
    zIndex: -1,
  },
  glow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    letterSpacing: 2,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#E2FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 1,
    opacity: 0.6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 10,
    letterSpacing: 2,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    gap: 12,
  },
  roomWrapper: {
    width: '100%',
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  imageContainer: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatar: {
    width: '100%',
    height: '100%',
  },
  smallAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoWrapper: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interlocutorName: {
    fontSize: 16,
    letterSpacing: 0.5,
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    opacity: 0.8,
  },
  listingTitle: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  messagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    marginTop: 60,
    paddingHorizontal: 12,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyText: {
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
});

