import { useState, useEffect } from 'react';
import { subscribeMessages } from '../services/chat.service';
import type { Message } from '../types';

interface State {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export function useMessages(chatId: string) {
  const [state, setState] = useState<State>({ messages: [], loading: true, error: null });

  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeMessages(chatId, messages => {
      setState({ messages, loading: false, error: null });
    });

    // 컴포넌트 unmount 시 Firestore 실시간 구독 해제
    return unsubscribe;
  }, [chatId]);

  return state;
}
