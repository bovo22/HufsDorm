import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import {
  collection, doc, getDoc, getDocs, updateDoc,
  arrayUnion, arrayRemove, setDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentSemester } from '../../utils/semester';
import { BUILDINGS } from '../../constants/buildings';
import type { Building } from '../../types';

interface RoomData {
  roomNumber: string;
  wishes: string[];
}

type SubTab = 'wish' | 'status';

export default function RoomWishScreen() {
  const { appUser } = useAuth();
  const semester = getCurrentSemester();

  const userBuilding: Building = appUser?.building ?? 'A';
  const [activeTab,        setActiveTab]        = useState<SubTab>('wish');
  const [selectedBuilding, setSelectedBuilding] = useState<Building>(userBuilding);
  const [rooms,            setRooms]            = useState<RoomData[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState('');
  const [modalVisible,     setModalVisible]     = useState(false);
  const [newBuilding,      setNewBuilding]      = useState<Building>(userBuilding);
  const [newRoom,          setNewRoom]          = useState('');

  const load = useCallback(async (building: Building) => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'roomWish', semester, building));
    const data: RoomData[] = snap.docs.map(d => ({ roomNumber: d.id, wishes: d.data().wishes ?? [] }));
    data.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
    setRooms(data);
    setLoading(false);
  }, [semester]);

  useEffect(() => { load(selectedBuilding); }, [load, selectedBuilding]);

  async function handleWish(roomNumber: string, wishes: string[]) {
    if (!appUser) return;
    const ref = doc(db, 'roomWish', semester, selectedBuilding, roomNumber);
    const snap = await getDoc(ref);
    const alreadyWished = wishes.includes(appUser.uid);

    if (!snap.exists()) {
      await setDoc(ref, { wishes: [appUser.uid] });
    } else {
      await updateDoc(ref, {
        wishes: alreadyWished ? arrayRemove(appUser.uid) : arrayUnion(appUser.uid),
      });
    }
    await load(selectedBuilding);
  }

  async function handleDeleteRoom(roomNumber: string) {
    Alert.alert('방 삭제', `${roomNumber}호를 목록에서 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'roomWish', semester, selectedBuilding, roomNumber));
        await load(selectedBuilding);
      }},
    ]);
  }

  async function handleAddRoom() {
    if (!newRoom.trim()) return;
    const ref = doc(db, 'roomWish', semester, newBuilding, newRoom.trim());
    await setDoc(ref, { wishes: [] }, { merge: true });
    setNewRoom('');
    setModalVisible(false);
    setSelectedBuilding(newBuilding);
    await load(newBuilding);
  }

  const buildings = Object.keys(BUILDINGS) as Building[];
  const filtered  = search.trim() ? rooms.filter(r => r.roomNumber.includes(search.trim())) : rooms;

  // ── 희망하는 방 탭 ─────────────────────────────────────────────────────────

  function renderWishTab() {
    const myRooms = rooms.filter(r => appUser && r.wishes.includes(appUser.uid));

    return (
      <ScrollView style={styles.tabContent}>
        {myRooms.length > 0 && (
          <View style={styles.myRoomsSection}>
            <Text style={styles.sectionLabel}>내가 희망한 방</Text>
            <View style={styles.myRoomRow}>
              {myRooms.map(r => (
                <View key={r.roomNumber} style={styles.myRoomChip}>
                  <Text style={styles.myRoomChipText}>{selectedBuilding}동 {r.roomNumber}호</Text>
                  <TouchableOpacity onPress={() => handleWish(r.roomNumber, r.wishes)}>
                    <Text style={styles.myRoomChipRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 동 선택 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.buildingRow}>
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

        {/* 검색 + 방 추가 */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="방 번호 검색"
            value={search}
            onChangeText={setSearch}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => { setNewBuilding(selectedBuilding); setModalVisible(true); }}>
            <Text style={styles.addBtnText}>+ 방 추가</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.centered} size="large" color="#1B4FD8" />
        ) : filtered.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>등록된 방이 없습니다.</Text>
            <Text style={styles.emptySubText}>+ 방 추가 버튼으로 방 번호를 등록해보세요.</Text>
          </View>
        ) : (
          <View style={styles.roomGrid}>
            {filtered.map(room => {
              const wished = appUser ? room.wishes.includes(appUser.uid) : false;
              const count  = room.wishes.length;
              const capacity = BUILDINGS[selectedBuilding].roomType === '2인실' ? 2 : 4;
              const full   = count >= capacity;
              return (
                <TouchableOpacity
                  key={room.roomNumber}
                  style={[styles.roomCard, wished && styles.roomCardWished, full && !wished && styles.roomCardFull]}
                  onPress={() => handleWish(room.roomNumber, room.wishes)}
                  onLongPress={() => handleDeleteRoom(room.roomNumber)}
                >
                  <Text style={styles.roomNumber}>{room.roomNumber}호</Text>
                  <Text style={styles.roomCount}>{count}/{capacity}명</Text>
                  {wished && <Text style={styles.wishedBadge}>✓ 내 희망</Text>}
                  {full && !wished && <Text style={styles.fullBadge}>경쟁 중</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <Text style={styles.longPressHint}>* 방 카드 길게 누르면 삭제</Text>
      </ScrollView>
    );
  }

  // ── 현재 방 상황 탭 ────────────────────────────────────────────────────────

  function renderStatusTab() {
    const allBuildings = buildings;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusHeaderText}>{semester} 방 배정 희망 현황</Text>
          <Text style={styles.statusHint}>각 방의 희망 인원을 확인하세요.</Text>
        </View>

        {/* 동 선택 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.buildingRow}>
          {allBuildings.map(b => (
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
        ) : rooms.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>등록된 방이 없습니다.</Text>
          </View>
        ) : (
          <>
            <View style={styles.statusLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#DCFCE7' }]} /><Text style={styles.legendText}>여유 있음</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FEF9C3' }]} /><Text style={styles.legendText}>절반 이상</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FEE2E2' }]} /><Text style={styles.legendText}>마감</Text></View>
            </View>
            <View style={styles.roomGrid}>
              {rooms.map(room => {
                const count    = room.wishes.length;
                const capacity = BUILDINGS[selectedBuilding].roomType === '2인실' ? 2 : 4;
                const ratio    = count / capacity;
                const isMyWish = appUser ? room.wishes.includes(appUser.uid) : false;
                const bgColor  = ratio >= 1 ? '#FEE2E2' : ratio >= 0.5 ? '#FEF9C3' : '#DCFCE7';
                return (
                  <View
                    key={room.roomNumber}
                    style={[styles.statusCard, { backgroundColor: bgColor }, isMyWish && styles.statusCardMine]}
                  >
                    <Text style={styles.roomNumber}>{room.roomNumber}호</Text>
                    <Text style={styles.roomCount}>{count}/{capacity}명</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${Math.min(ratio, 1) * 100}%` as any, backgroundColor: ratio >= 1 ? '#EF4444' : ratio >= 0.5 ? '#EAB308' : '#22C55E' }]} />
                    </View>
                    {isMyWish && <Text style={styles.wishedBadge}>내 희망</Text>}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* 서브탭 */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTab, activeTab === 'wish' && styles.subTabActive]}
          onPress={() => setActiveTab('wish')}
        >
          <Text style={[styles.subTabText, activeTab === 'wish' && styles.subTabTextActive]}>희망하는 방</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, activeTab === 'status' && styles.subTabActive]}
          onPress={() => setActiveTab('status')}
        >
          <Text style={[styles.subTabText, activeTab === 'status' && styles.subTabTextActive]}>현재 방 상황</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'wish' ? renderWishTab() : renderStatusTab()}

      {/* 방 추가 모달 */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>방 번호 추가</Text>
            {/* 동 선택 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
              {buildings.map(b => (
                <TouchableOpacity
                  key={b}
                  style={[styles.buildingBtn, newBuilding === b && styles.buildingBtnActive]}
                  onPress={() => setNewBuilding(b)}
                >
                  <Text style={[styles.buildingBtnText, newBuilding === b && styles.buildingBtnTextActive]}>{b}동</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.modalInput}
              placeholder="방 번호 (예: 301)"
              value={newRoom}
              onChangeText={setNewRoom}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.modalCancel}>취소</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleAddRoom}>
                <Text style={styles.modalConfirmText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f8f8f8' },
  subTabRow:            { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
  subTab:               { flex: 1, paddingVertical: 14, alignItems: 'center' },
  subTabActive:         { borderBottomWidth: 2, borderBottomColor: '#1B4FD8' },
  subTabText:           { fontSize: 14, color: '#aaa', fontWeight: '600' },
  subTabTextActive:     { color: '#1B4FD8' },
  tabContent:           { flex: 1 },
  myRoomsSection:       { backgroundColor: '#EEF2FF', padding: 12, marginHorizontal: 12, marginTop: 12, borderRadius: 10 },
  sectionLabel:         { fontSize: 12, color: '#6366F1', fontWeight: '700', marginBottom: 8 },
  myRoomRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  myRoomChip:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10, gap: 6, borderWidth: 1, borderColor: '#C7D2FE' },
  myRoomChipText:       { fontSize: 13, color: '#1B4FD8', fontWeight: '600' },
  myRoomChipRemove:     { fontSize: 12, color: '#9CA3AF' },
  buildingRow:          { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff' },
  buildingBtn:          { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  buildingBtnActive:    { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  buildingBtnText:      { fontSize: 13, color: '#555' },
  buildingBtnTextActive:{ color: '#fff', fontWeight: '600' },
  searchRow:            { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  searchInput:          { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  addBtn:               { backgroundColor: '#1B4FD8', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  addBtnText:           { color: '#fff', fontWeight: '600', fontSize: 13 },
  roomGrid:             { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  roomCard:             { width: '30%', backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', gap: 4, elevation: 1 },
  roomCardWished:       { backgroundColor: '#EEF2FF', borderWidth: 2, borderColor: '#1B4FD8' },
  roomCardFull:         { borderWidth: 1, borderColor: '#FCA5A5' },
  statusCard:           { width: '30%', borderRadius: 10, padding: 12, alignItems: 'center', gap: 4, elevation: 1 },
  statusCardMine:       { borderWidth: 2, borderColor: '#1B4FD8' },
  roomNumber:           { fontSize: 15, fontWeight: 'bold' },
  roomCount:            { fontSize: 12, color: '#666' },
  wishedBadge:          { fontSize: 10, color: '#1B4FD8', fontWeight: '700' },
  fullBadge:            { fontSize: 10, color: '#EF4444', fontWeight: '700' },
  barBg:                { width: '100%', height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  barFill:              { height: '100%', borderRadius: 2 },
  centered:             { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyText:            { color: '#aaa', fontSize: 14 },
  emptySubText:         { color: '#ccc', fontSize: 11, textAlign: 'center', paddingHorizontal: 24 },
  longPressHint:        { textAlign: 'center', fontSize: 11, color: '#ccc', paddingBottom: 24, paddingTop: 4 },
  statusHeader:         { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  statusHeaderText:     { fontSize: 16, fontWeight: 'bold', color: '#111' },
  statusHint:           { fontSize: 12, color: '#aaa', marginTop: 2 },
  statusLegend:         { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingVertical: 10 },
  legendItem:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:            { width: 12, height: 12, borderRadius: 6 },
  legendText:           { fontSize: 11, color: '#666' },
  overlay:              { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal:                { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%', gap: 16 },
  modalTitle:           { fontSize: 17, fontWeight: 'bold' },
  modalInput:           { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15 },
  modalButtons:         { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  modalCancel:          { color: '#aaa', fontSize: 15 },
  modalConfirm:         { backgroundColor: '#1B4FD8', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  modalConfirmText:     { color: '#fff', fontWeight: '600' },
});
