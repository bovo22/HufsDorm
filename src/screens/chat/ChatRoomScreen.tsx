import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatStackParamList } from '../../navigation';
import { useMessages } from '../../hooks/useMessages';
import { sendMessage } from '../../services/chat.service';
import { useAuth } from '../../hooks/useAuth';
import type { Message } from '../../types';

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatRoom'>;

export default function ChatRoomScreen({ route }: Props) {
  const { chatId }   = route.params;
  const { appUser }  = useAuth();
  const { messages, loading } = useMessages(chatId);
  const [input,    setInput]    = useState('');
  const [sending,  setSending]  = useState(false);
  const listRef = useRef<FlatList>(null);

  // 새 메시지 도착 시 자동 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  async function handleSend() {
    if (!input.trim() || !appUser) return;
    setSending(true);
    try {
      await sendMessage(chatId, appUser.uid, input.trim());
      setInput('');
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.senderUid === appUser?.uid;
    return (
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
        <Text style={styles.bubbleTime}>{item.createdAt.slice(11, 16)}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <ActivityIndicator style={styles.centered} size="large" color="#1B4FD8" />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="메시지 입력…"
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending || !input.trim()}>
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.sendText}>전송</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f8f8f8' },
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList:     { padding: 12, gap: 8 },
  bubble:          { maxWidth: '75%', padding: 10, borderRadius: 12, marginBottom: 2 },
  bubbleMine:      { alignSelf: 'flex-end', backgroundColor: '#1B4FD8', borderBottomRightRadius: 2 },
  bubbleOther:     { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2, elevation: 1 },
  bubbleText:      { fontSize: 15, color: '#222', lineHeight: 20 },
  bubbleTextMine:  { color: '#fff' },
  bubbleTime:      { fontSize: 10, color: '#aaa', marginTop: 4, alignSelf: 'flex-end' },
  inputRow:        { flexDirection: 'row', padding: 10, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  input:           { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendBtn:         { backgroundColor: '#1B4FD8', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center', minWidth: 52 },
  sendText:        { color: '#fff', fontWeight: '600', fontSize: 14 },
});
