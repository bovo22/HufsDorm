import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useLaundry } from '../../hooks/useLaundry';
import { startMachine, stopMachine } from '../../services/laundry.service';
import { useAuth } from '../../hooks/useAuth';
import { BUILDINGS } from '../../constants/buildings';
import type { Building, LaundryMachine } from '../../types';

// 남은 시간 계산 (초 단위)
function remainingSeconds(machine: LaundryMachine): number {
  if (!machine.inUse || !machine.startedAt || !machine.durationMin) return 0;
  const elapsed = (Date.now() - new Date(machine.startedAt).getTime()) / 1000;
  return Math.max(0, machine.durationMin * 60 - elapsed);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const DURATIONS = [30, 45, 60, 90]; // 선택 가능한 세탁 시간(분)

export default function LaundryScreen() {
  const { appUser } = useAuth();
  const userBuilding: Building = appUser?.building ?? 'A';
  const [selectedBuilding, setSelectedBuilding] = useState<Building>(userBuilding);
  const { machines, loading } = useLaundry(selectedBuilding);
  const [now, setNow] = useState(Date.now());

  // 남은 시간 갱신 (1초 간격)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function handleStart(machine: LaundryMachine) {
    if (!appUser) return;
    Alert.alert(
      `${machine.type === 'washer' ? '세탁기' : '건조기'} 사용 시작`,
      '세탁 시간을 선택하세요.',
      DURATIONS.map(d => ({
        text: `${d}분`,
        onPress: () => startMachine(selectedBuilding, machine.id, appUser.uid, d),
      })),
    );
  }

  async function handleStop(machine: LaundryMachine) {
    if (!appUser || machine.startedByUid !== appUser.uid) {
      Alert.alert('알림', '본인이 시작한 세탁기만 종료할 수 있습니다.');
      return;
    }
    Alert.alert('종료', '세탁이 완료됐나요?', [
      { text: '취소', style: 'cancel' },
      { text: '종료', onPress: () => stopMachine(selectedBuilding, machine.id) },
    ]);
  }

  function MachineCard({ machine }: { machine: LaundryMachine }) {
    const remaining = remaining_s(machine);
    const isMyMachine = machine.startedByUid === appUser?.uid;

    return (
      <TouchableOpacity
        style={[styles.machineCard, machine.inUse && styles.machineCardInUse]}
        onPress={() => machine.inUse ? handleStop(machine) : handleStart(machine)}
        activeOpacity={0.8}
      >
        <Text style={styles.machineIcon}>{machine.type === 'washer' ? '🫧' : '♨️'}</Text>
        <Text style={styles.machineLabel}>{machine.type === 'washer' ? '세탁기' : '건조기'} {machine.floor}층</Text>
        {machine.inUse ? (
          <>
            <Text style={[styles.status, styles.statusInUse]}>사용 중</Text>
            <Text style={styles.timer}>{formatTime(remaining)}</Text>
            {isMyMachine && <Text style={styles.myBadge}>내 세탁기 ▾</Text>}
          </>
        ) : (
          <Text style={[styles.status, styles.statusFree]}>비어있음</Text>
        )}
      </TouchableOpacity>
    );
  }

  // 클로저에서 now를 참조하기 위한 래퍼
  function remaining_s(machine: LaundryMachine): number {
    if (!machine.inUse || !machine.startedAt || !machine.durationMin) return 0;
    const elapsed = (now - new Date(machine.startedAt).getTime()) / 1000;
    return Math.max(0, machine.durationMin * 60 - elapsed);
  }

  const buildings = Object.keys(BUILDINGS) as Building[];

  return (
    <ScrollView style={styles.container}>
      {/* 동 선택 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buildingScroll} contentContainerStyle={styles.buildingRow}>
        {buildings.map(b => (
          <TouchableOpacity
            key={b}
            style={[styles.buildingBtn, selectedBuilding === b && styles.buildingBtnActive]}
            onPress={() => setSelectedBuilding(b)}
          >
            <Text style={[styles.buildingBtnText, selectedBuilding === b && styles.buildingBtnTextActive]}>
              {b}동
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={styles.centered} size="large" color="#1B4FD8" />
      ) : machines.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>세탁기 정보가 없습니다.</Text>
          <Text style={styles.emptySubText}>Firebase에 laundry/{selectedBuilding}/machines 데이터를 추가해주세요.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {machines.map(m => <MachineCard key={m.id} machine={m} />)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f8f8f8' },
  buildingScroll:       { backgroundColor: '#fff' },
  buildingRow:          { flexDirection: 'row', padding: 12, gap: 8 },
  buildingBtn:          { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  buildingBtnActive:    { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  buildingBtnText:      { fontSize: 13, color: '#555' },
  buildingBtnTextActive:{ color: '#fff', fontWeight: '600' },
  grid:                 { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  machineCard:          { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', gap: 6, elevation: 1 },
  machineCardInUse:     { borderWidth: 2, borderColor: '#1B4FD8' },
  machineIcon:          { fontSize: 32 },
  machineLabel:         { fontSize: 13, color: '#555', fontWeight: '600' },
  status:               { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusFree:           { backgroundColor: '#DCFCE7', color: '#15803D' },
  statusInUse:          { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  timer:                { fontSize: 20, fontWeight: 'bold', color: '#1B4FD8' },
  myBadge:              { fontSize: 11, color: '#1B4FD8' },
  centered:             { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyText:            { color: '#aaa', fontSize: 14 },
  emptySubText:         { color: '#ccc', fontSize: 11, textAlign: 'center', paddingHorizontal: 24 },
});
