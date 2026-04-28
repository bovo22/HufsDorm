import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type { Post, Comment, PostType } from '../types';

// ── 게시글 ────────────────────────────────────────────────────────────────────

export async function createPost(
  data: Omit<Post, 'id' | 'likes' | 'likedBy' | 'createdAt'>,
): Promise<string> {
  const ref_ = await addDoc(collection(db, 'posts'), {
    ...data,
    likes: 0,
    likedBy: [],
    createdAt: serverTimestamp(),
  });
  return ref_.id;
}

export async function getPost(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, 'posts', postId));
  return snap.exists() ? toPost(snap) : null;
}

export async function getPostsByType(
  type: PostType,
  pageSize = 20,
): Promise<Post[]> {
  const q = query(
    collection(db, 'posts'),
    where('type', '==', type),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );
  const snaps = await getDocs(q);
  return snaps.docs.map(toPost);
}

export async function deletePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId));
}

export async function toggleLike(postId: string, uid: string): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) return;

  const likedBy: string[] = snap.data().likedBy ?? [];
  const alreadyLiked = likedBy.includes(uid);

  await updateDoc(postRef, {
    likedBy: alreadyLiked ? arrayRemove(uid) : arrayUnion(uid),
    likes:   (snap.data().likes ?? 0) + (alreadyLiked ? -1 : 1),
  });
}

// ── 댓글 ──────────────────────────────────────────────────────────────────────

export async function addComment(
  postId: string,
  data: Omit<Comment, 'id' | 'postId' | 'createdAt'>,
): Promise<string> {
  const ref_ = await addDoc(collection(db, 'posts', postId, 'comments'), {
    ...data,
    postId,
    createdAt: serverTimestamp(),
  });
  return ref_.id;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc'),
  );
  const snaps = await getDocs(q);
  return snaps.docs.map(s => ({ id: s.id, ...s.data() } as Comment));
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
}

// ── 이미지 업로드 ─────────────────────────────────────────────────────────────

export async function uploadPostImages(
  postId: string,
  uris: string[],
): Promise<string[]> {
  const urls = await Promise.all(
    uris.map(async (uri, i) => {
      const res = await fetch(uri);
      const blob = await res.blob();
      const storageRef = ref(storage, `posts/${postId}/${i}_${Date.now()}`);
      await uploadBytes(storageRef, blob);
      return getDownloadURL(storageRef);
    }),
  );
  await updateDoc(doc(db, 'posts', postId), { imageUrls: urls });
  return urls;
}

export async function updateTradeStatus(
  postId: string,
  status: 'selling' | 'sold',
): Promise<void> {
  await updateDoc(doc(db, 'posts', postId), { tradeStatus: status });
}

// ── 내부 헬퍼 ────────────────────────────────────────────────────────────────

function toPost(snap: any): Post {
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() ?? '',
  } as Post;
}
