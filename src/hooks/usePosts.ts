import { useState, useEffect, useCallback } from 'react';
import { getPostsByType } from '../services/post.service';
import type { Post, PostType } from '../types';

interface State {
  posts: Post[];
  loading: boolean;
  error: string | null;
}

export function usePosts(type: PostType) {
  const [state, setState] = useState<State>({ posts: [], loading: true, error: null });

  const fetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const posts = await getPostsByType(type);
      setState({ posts, loading: false, error: null });
    } catch (e: any) {
      const msg = e?.code === 'permission-denied'
        ? '권한 없음 — Firestore 규칙을 배포해주세요.'
        : e?.message?.includes('index')
          ? '인덱스 미생성 — Firebase Console에서 인덱스를 생성해주세요.'
          : `불러오기 실패 (${e?.code ?? e?.message ?? '알 수 없는 오류'})`;
      setState({ posts: [], loading: false, error: msg });
    }
  }, [type]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...state, refresh: fetch };
}
