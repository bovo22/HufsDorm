import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Chat, Message } from '../types';

// ── 채팅방 ────────────────────────────────────────────────────────────────────

// 이미 존재하는 1:1 채팅방 ID를 반환하고, 없으면 새로 생성
export async function getOrCreateChat(
  uid1: string,
  uid2: string,
): Promise<string> {
  // 두 참여자 중 한 명의 uid로 조회 후 상대방 포함 여부 확인
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', uid1),
  );
  const snaps = await getDocs(q);
  const existing = snaps.docs.find(s =>
    (s.data().participants as string[]).includes(uid2),
  );
  if (existing) return existing.id;

  const ref_ = await addDoc(collection(db, 'chats'), {
    participants: [uid1, uid2],
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
  });
  return ref_.id;
}

export async function getMyChats(uid: string): Promise<Chat[]> {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc'),
  );
  const snaps = await getDocs(q);
  return snaps.docs.map(s => ({ id: s.id, ...s.data() } as Chat));
}

// ── 메시지 ────────────────────────────────────────────────────────────────────

export async function sendMessage(
  chatId: string,
  senderUid: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const chatRef = doc(db, 'chats', chatId);
  await Promise.all([
    addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderUid,
      text: trimmed,
      createdAt: serverTimestamp(),
    }),
    // 채팅 목록 정렬용 마지막 메시지 업데이트
    import('firebase/firestore').then(({ updateDoc }) =>
      updateDoc(chatRef, {
        lastMessage: trimmed.length > 50 ? trimmed.slice(0, 50) + '…' : trimmed,
        lastMessageAt: serverTimestamp(),
      }),
    ),
  ]);
}

// 실시간 메시지 구독 — 컴포넌트 unmount 시 반환된 unsubscribe 호출
export function subscribeMessages(
  chatId: string,
  onUpdate: (messages: Message[]) => void,
): () => void {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, snapshot => {
    const messages: Message[] = snapshot.docs.map(s => ({
      id: s.id,
      ...s.data(),
      createdAt: (s.data().createdAt as Timestamp)?.toDate().toISOString() ?? '',
    } as Message));
    onUpdate(messages);
  });
}
