import { collection, query, where, orderBy, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Post, Comment } from '../types';

export async function getPostsByAuthor(uid: string): Promise<Post[]> {
  const q = query(
    collection(db, 'posts'),
    where('authorUid', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() ?? '' } as Post;
  });
}

export async function getCommentsByAuthor(uid: string): Promise<Comment[]> {
  // orderBy 없이 where만 사용 → 복합 인덱스 불필요, 메모리에서 정렬
  const q = query(
    collectionGroup(db, 'comments'),
    where('authorUid', '==', uid),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? '',
      } as Comment;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
