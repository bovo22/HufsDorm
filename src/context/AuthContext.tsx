import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getAppUser, ensureUserDoc } from '../services/auth.service';
import type { User } from '../types';

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface AuthState {
  firebaseUser: FirebaseUser | null;
  appUser: User | null;
  /** Firebase Auth 초기 상태 확인 중 */
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  refreshAppUser: () => Promise<void>;
  /** 이메일 인증 완료 여부 재확인 — reload() 후 state 갱신 */
  reloadUser: () => Promise<void>;
  isVerified: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    appUser: null,
    loading: true,
  });

  useEffect(() => {
    // onAuthStateChanged는 앱 시작 시 한 번, 그 이후 로그인/로그아웃 시 호출
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        // firebaseUser를 즉시 반영해 emailVerified 게이트가 바로 동작하도록 함
        setState({ firebaseUser, appUser: null, loading: false });
        // 회원가입 직후엔 setDoc 완료 전에 호출될 수 있어 최대 3회 재시도
        let appUser = null;
        for (let i = 0; i < 3; i++) {
          try {
            appUser = await getAppUser(firebaseUser.uid);
          } catch (e) {
            console.warn('[AuthContext] getAppUser error:', e);
          }
          if (appUser) break;
          await new Promise(r => setTimeout(r, 800));
        }
        // 재시도 후에도 없으면 Auth만 있고 Firestore 문서가 없는 계정 — 자동 복구
        if (!appUser) {
          try {
            appUser = await ensureUserDoc(firebaseUser.uid, firebaseUser.email ?? '');
          } catch (e) {
            console.warn('[AuthContext] ensureUserDoc error:', e);
          }
        }
        setState(prev => ({ ...prev, appUser }));
      } else {
        setState({ firebaseUser: null, appUser: null, loading: false });
      }
    });
    return unsubscribe; // 컴포넌트 unmount 시 구독 해제
  }, []);

  const refreshAppUser = useCallback(async () => {
    if (!state.firebaseUser) return;
    const appUser = await getAppUser(state.firebaseUser.uid);
    setState(prev => ({ ...prev, appUser }));
  }, [state.firebaseUser]);

  // 이메일 인증 링크 클릭 후 호출 — Firebase 유저 정보를 서버에서 재조회해 emailVerified 갱신
  const reloadUser = useCallback(async () => {
    if (!state.firebaseUser) return;
    await state.firebaseUser.reload();
    const updated = auth.currentUser;
    if (!updated) return;
    // emailVerified 변경을 즉시 반영해 화면 전환이 바로 되도록 함
    setState(prev => ({ ...prev, firebaseUser: updated }));
    try {
      const appUser = await getAppUser(updated.uid);
      setState(prev => ({ ...prev, appUser }));
    } catch {
      // appUser 조회 실패 시 기존 값 유지
    }
  }, [state.firebaseUser]);

  const isVerified =
    state.appUser?.verified === true &&
    !!state.appUser.verifiedUntil &&
    new Date(state.appUser.verifiedUntil) > new Date();

  return (
    <AuthContext.Provider value={{ ...state, refreshAppUser, reloadUser, isVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}
