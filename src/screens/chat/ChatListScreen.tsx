import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatStackParamList } from '../../navigation';
import { getMyChats } from '../../services/chat.service';
import { getAppUser } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import type { Chat } from '../../types';

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatList'>;

export default function ChatListScreen({ navigation }: Props) {
  const { appUser } = useAuth();
  const [chats,   setChats]   = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) { setLoading(false); return; }
    getMyChats(appUser.uid)
      .then(c => { setChats(c); })
      .catch(e => {
        const msg = e?.code === 'failed-precondition'
          ? '인덱스 미생성 — Firebase Console에서 인덱스를 생성해주세요.'
          : `채팅 목록을 불러오지 못했습니다. (${e?.code ?? '알 수 없는 오류'})`;
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [appUser]);

  async function handlePress(chat: Chat) {
    if (!appUser) return;
    const otherUid  = chat.participants.find(id => id !== appUser.uid) ?? '';
    const otherUser = await getAppUser(otherUid);
    navigation.navigate('ChatRoom', {
      chatId: chat.id,
      otherUserName: otherUser?.nickname ?? otherUser?.name ?? '알 수 없음',
    });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1B4FD8" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => handlePress(item)}>
          <View style={styles.avatar}><Text style={styles.avatarText}>💬</Text></View>
          <View style={styles.content}>
            <Text style={styles.name}>채팅방</Text>
            <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage || '메시지 없음'}</Text>
          </View>
          <Text style={styles.time}>{item.lastMessageAt?.slice(11, 16) ?? ''}</Text>
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>채팅 없음</Text>
          <Text style={styles.emptyText}>아직 진행 중인 채팅이 없습니다.{'\n'}게시글에서 1:1 채팅을 시작해보세요.</Text>
        </View>
      }
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list:        { flex: 1, backgroundColor: '#fff' },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText:   { fontSize: 14, color: '#e55', textAlign: 'center', paddingHorizontal: 24 },
  item:        { flexDirection: 'row', padding: 14, alignItems: 'center', backgroundColor: '#fff', gap: 12 },
  avatar:      { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  avatarText:  { fontSize: 22 },
  content:     { flex: 1 },
  name:        { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  lastMessage: { fontSize: 13, color: '#888' },
  time:        { fontSize: 12, color: '#aaa' },
  separator:   { height: 1, backgroundColor: '#f0f0f0', marginLeft: 74 },
  empty:       { alignItems: 'center', paddingTop: 100, gap: 8 },
  emptyIcon:   { fontSize: 48, marginBottom: 8 },
  emptyTitle:  { fontSize: 17, fontWeight: '600', color: '#333' },
  emptyText:   { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 22 },
});
