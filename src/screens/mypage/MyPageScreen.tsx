import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../../services/auth.service';
import { updateNickname } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';

function MenuItem({
  icon, label, value, onPress, danger,
}: { icon: string; label: string; value?: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuCenter}>
        <Text style={[styles.menuText, danger && styles.danger]}>{label}</Text>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function MyPageScreen() {
  const navigation = useNavigation<any>();
  const { appUser, refreshAppUser } = useAuth();

  const [nicknameModal,  setNicknameModal]  = useState(false);
  const [newNickname,    setNewNickname]    = useState('');
  const [savingNickname, setSavingNickname] = useState(false);

  async function handleSaveNickname() {
    if (!appUser) return;
    setSavingNickname(true);
    try {
      await updateNickname(appUser.uid, newNickname.trim());
      await refreshAppUser();
      setNicknameModal(false);
      setNewNickname('');
      Alert.alert('완료', '닉네임이 변경되었습니다.');
    } catch (e: any) {
      Alert.alert('오류', e?.message ?? '닉네임 변경에 실패했습니다.');
    } finally {
      setSavingNickname(false);
    }
  }

  function openNicknameModal() {
    setNewNickname(appUser?.nickname ?? '');
    setNicknameModal(true);
  }

  function handleDeleteAccount() {
    // 1차 확인
    Alert.alert(
      '회원탈퇴',
      '탈퇴하면 모든 데이터가 영구적으로 삭제됩니다.\n정말 탈퇴하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '계속',
          style: 'destructive',
          onPress: () => {
            // 2차 확인
            Alert.alert(
              '최종 확인',
              '이 작업은 되돌릴 수 없습니다.\n탈퇴를 진행하시겠습니까?',
              [
                { text: '아니요', style: 'cancel' },
                {
                  text: '탈퇴하기',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await appUser && logout();
                    } catch {
                      Alert.alert('오류', '재로그인 후 다시 시도해주세요.');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 프로필 (아바타 없이) */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{appUser?.nickname ?? '-'}</Text>
            <Text style={styles.name}>{appUser?.name ?? '-'}</Text>
            <Text style={styles.meta}>
              {appUser?.building}동 {appUser?.roomNumber}호 ·{' '}
              {appUser?.gender === 'male' ? '남자기숙사' : '여자기숙사'}
            </Text>
            <Text style={styles.meta}>{appUser?.email}</Text>
          </View>
        </View>

        {/* 내 활동 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 활동</Text>
          <MenuItem icon="📝" label="내 게시글"   onPress={() => navigation.navigate('MyPosts')} />
          <MenuItem icon="💬" label="내 댓글"     onPress={() => navigation.navigate('MyComments')} />
        </View>

        {/* 계정 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 설정</Text>
          <MenuItem
            icon="✏️"
            label="닉네임 변경"
            value={appUser?.nickname}
            onPress={openNicknameModal}
          />
          <MenuItem icon="🚪" label="로그아웃"  onPress={logout} />
          <MenuItem icon="⚠️" label="회원탈퇴"  onPress={handleDeleteAccount} danger />
        </View>
      </ScrollView>

      {/* 닉네임 변경 모달 */}
      <Modal visible={nicknameModal} transparent animationType="fade" onRequestClose={() => setNicknameModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>닉네임 변경</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="새 닉네임 (2~12자, 한글/영문/숫자)"
              value={newNickname}
              onChangeText={setNewNickname}
              maxLength={12}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setNicknameModal(false)}>
                <Text style={styles.modalCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, savingNickname && { opacity: 0.5 }]}
                onPress={handleSaveNickname}
                disabled={savingNickname || !newNickname.trim()}
              >
                {savingNickname
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>저장</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f8f8f8' },
  content:       { padding: 16, paddingBottom: 40 },
  profileCard:   { backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 16 },
  profileInfo:   { gap: 3 },
  nickname:      { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 2 },
  name:          { fontSize: 14, color: '#555' },
  meta:          { fontSize: 12, color: '#aaa' },
  section:       { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  sectionTitle:  { fontSize: 13, color: '#888', fontWeight: '600', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  menuItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', gap: 12 },
  menuIcon:      { fontSize: 18, width: 26 },
  menuCenter:    { flex: 1 },
  menuText:      { fontSize: 15, color: '#333' },
  menuValue:     { fontSize: 12, color: '#aaa', marginTop: 2 },
  menuArrow:     { fontSize: 20, color: '#ccc' },
  danger:        { color: '#ef4444' },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal:         { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '82%', gap: 16 },
  modalTitle:    { fontSize: 17, fontWeight: 'bold' },
  modalInput:    { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15 },
  modalButtons:  { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, alignItems: 'center' },
  modalCancel:   { color: '#aaa', fontSize: 15 },
  modalConfirm:  { backgroundColor: '#1B4FD8', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9, minWidth: 52, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
