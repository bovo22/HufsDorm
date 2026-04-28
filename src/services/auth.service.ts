import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc,
  collection, query, where, getDocs, limit,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { isHufsEmail, isValidPassword, isValidNickname, isNonEmpty, passwordStrengthMessage } from '../utils/validation';
import { getCurrentSemester, getSemesterEndDate } from '../utils/semester';
import { BUILDINGS } from '../constants/buildings';
import { AppError, toAuthMessage } from './errors';
import type { User, Building } from '../types';

export async function login(email: string, password: string): Promise<void> {
  if (!isHufsEmail(email)) {
    throw new AppError('invalid-email', '한국외대 이메일(@hufs.ac.kr)만 사용 가능합니다.');
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e: any) {
    throw new AppError(e.code, toAuthMessage(e.code));
  }
}

export async function isNicknameTaken(nickname: string): Promise<boolean> {
  const q = query(
    collection(db, 'users'),
    where('nickname', '==', nickname.trim()),
    limit(1),
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function register(
  email: string,
  password: string,
  name: string,
  nickname: string,
  building: Building,
  roomNumber: string,
): Promise<void> {
  if (!isHufsEmail(email)) {
    throw new AppError('invalid-email', '한국외대 이메일(@hufs.ac.kr)만 사용 가능합니다.');
  }
  if (!isValidPassword(password)) {
    throw new AppError('weak-password', passwordStrengthMessage());
  }
  if (!isNonEmpty(name)) {
    throw new AppError('empty-name', '이름을 입력해주세요.');
  }
  if (!isValidNickname(nickname)) {
    throw new AppError('invalid-nickname', '닉네임은 한글/영문/숫자 2~12자, 공백 불가입니다.');
  }
  if (await isNicknameTaken(nickname)) {
    throw new AppError('nickname-taken', '이미 사용 중인 닉네임입니다.');
  }
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(user);
    const newUser: User = {
      uid: user.uid,
      email,
      name: name.trim(),
      nickname: nickname.trim(),
      gender: BUILDINGS[building].gender,
      building,
      roomNumber,
      role: 'user',
      verified: false,
      verifiedUntil: '',
    };
    await setDoc(doc(db, 'users', user.uid), newUser);
  } catch (e: any) {
    if (e instanceof AppError) throw e;
    throw new AppError(e.code, toAuthMessage(e.code));
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!isHufsEmail(email)) {
    throw new AppError('invalid-email', '한국외대 이메일(@hufs.ac.kr)만 사용 가능합니다.');
  }
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (e: any) {
    throw new AppError(e.code, toAuthMessage(e.code));
  }
}

export async function getAppUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

// Auth에는 존재하지만 Firestore 문서가 없는 계정 복구용
export async function ensureUserDoc(uid: string, email: string): Promise<User> {
  const existing = await getAppUser(uid);
  if (existing) return existing;

  const fallback: User = {
    uid,
    email,
    name: email.split('@')[0],
    nickname: email.split('@')[0],
    gender: 'male',
    building: 'A',
    roomNumber: '',
    role: 'user',
    verified: false,
    verifiedUntil: '',
  };
  await setDoc(doc(db, 'users', uid), fallback);
  return fallback;
}

export async function updateNickname(uid: string, nickname: string): Promise<void> {
  if (!isValidNickname(nickname)) {
    throw new AppError('invalid-nickname', '닉네임은 한글/영문/숫자 2~12자, 공백 불가입니다.');
  }
  if (await isNicknameTaken(nickname)) {
    throw new AppError('nickname-taken', '이미 사용 중인 닉네임입니다.');
  }
  await updateDoc(doc(db, 'users', uid), { nickname: nickname.trim() });
}

// HUFSDORM 합격 화면 인증 완료 후 호출 — 학기 만료일 설정
export async function completeSemesterVerification(uid: string): Promise<void> {
  const semester = getCurrentSemester();
  const verifiedUntil = getSemesterEndDate(semester).toISOString();
  await updateDoc(doc(db, 'users', uid), { verified: true, verifiedUntil });
}
