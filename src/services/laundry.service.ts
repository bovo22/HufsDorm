import {
  collection,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { LaundryMachine, Building } from '../types';

// ── 조회 ──────────────────────────────────────────────────────────────────────

export async function getMachines(building: Building): Promise<LaundryMachine[]> {
  const snaps = await getDocs(collection(db, 'laundry', building, 'machines'));
  return snaps.docs.map(toMachine);
}

// 실시간 구독 — 다른 사용자가 세탁기 상태를 바꾸면 즉시 반영
export function subscribeMachines(
  building: Building,
  onUpdate: (machines: LaundryMachine[]) => void,
): () => void {
  return onSnapshot(
    collection(db, 'laundry', building, 'machines'),
    snapshot => onUpdate(snapshot.docs.map(toMachine)),
  );
}

// ── 상태 변경 ─────────────────────────────────────────────────────────────────

export async function startMachine(
  building: Building,
  machineId: string,
  uid: string,
  durationMin: number,
): Promise<void> {
  await updateDoc(doc(db, 'laundry', building, 'machines', machineId), {
    inUse: true,
    startedByUid: uid,
    startedAt: serverTimestamp(),
    durationMin,
  });
}

export async function stopMachine(
  building: Building,
  machineId: string,
): Promise<void> {
  await updateDoc(doc(db, 'laundry', building, 'machines', machineId), {
    inUse: false,
    startedByUid: null,
    startedAt: null,
    durationMin: null,
  });
}

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

function toMachine(snap: any): LaundryMachine {
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    startedAt: (d.startedAt as Timestamp)?.toDate().toISOString() ?? undefined,
  } as LaundryMachine;
}
