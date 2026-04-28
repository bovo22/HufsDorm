import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation';
import { register, isNicknameTaken } from '../../services/auth.service';
import { AppError } from '../../services/errors';
import { BUILDING_IDS, BUILDINGS, getRoomNumbers } from '../../constants/buildings';
import { passwordStrengthMessage } from '../../utils/validation';
import type { Building } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [name,       setName]       = useState('');
  const [nickname,   setNickname]   = useState('');
  const [nicknameOk, setNicknameOk] = useState<boolean | null>(null);
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [building,   setBuilding]   = useState<Building>('A');
  const [floor,      setFloor]      = useState<number>(BUILDINGS['A'].floors[0]);
  const [roomNumber, setRoomNumber] = useState('');
  const [loading,    setLoading]    = useState(false);

  // 동 변경 시 층/호수 초기화
  useEffect(() => {
    const floors = BUILDINGS[building].floors;
    setFloor(floors[0] ?? 2);
    setRoomNumber('');
  }, [building]);

  useEffect(() => { setRoomNumber(''); }, [floor]);

  // 닉네임 중복 확인 (300ms debounce)
  useEffect(() => {
    if (nickname.trim().length < 2) { setNicknameOk(null); return; }
    const timer = setTimeout(async () => {
      try {
        const taken = await isNicknameTaken(nickname.trim());
        setNicknameOk(!taken);
      } catch { setNicknameOk(null); }
    }, 300);
    return () => clearTimeout(timer);
  }, [nickname]);

  const rooms = BUILDINGS[building].floors.length > 0
    ? getRoomNumbers(building, floor)
    : [];

  async function handleRegister() {
    if (!name.trim() || !nickname.trim() || !email.trim() || !password || !roomNumber) {
      Alert.alert('입력 오류', '모든 항목을 입력해주세요.');
      return;
    }
    if (nicknameOk === false) {
      Alert.alert('닉네임 오류', '이미 사용 중인 닉네임입니다.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim(), nickname.trim(), building, roomNumber);
      // 이메일 인증 화면은 Navigation 게이트가 자동으로 전환
    } catch (e) {
      Alert.alert('회원가입 실패', e instanceof AppError ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const gender = BUILDINGS[building].gender;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>회원가입</Text>

        {/* 이름 */}
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={styles.input}
          placeholder="실명"
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />

        {/* 닉네임 */}
        <Text style={styles.label}>닉네임</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="한글/영문/숫자 2~12자"
            value={nickname}
            onChangeText={v => { setNickname(v); setNicknameOk(null); }}
            autoCapitalize="none"
            returnKeyType="next"
          />
          {nicknameOk === true  && <Text style={styles.ok}>✓ 사용 가능</Text>}
          {nicknameOk === false && <Text style={styles.ng}>✗ 사용 중</Text>}
        </View>

        {/* 이메일 */}
        <Text style={styles.label}>학교 이메일</Text>
        <TextInput
          style={styles.input}
          placeholder="학번@hufs.ac.kr"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        {/* 비밀번호 */}
        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder={passwordStrengthMessage()}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
        />

        {/* 거주 동 — 성별 자동 결정 */}
        <Text style={styles.label}>거주 동</Text>
        <View style={styles.buildingRow}>
          {BUILDING_IDS.map(b => (
            <TouchableOpacity
              key={b}
              style={[styles.chip, building === b && styles.chipActive]}
              onPress={() => setBuilding(b)}
            >
              <Text style={[styles.chipText, building === b && styles.chipTextActive]}>
                {b}동
              </Text>
              <Text style={[styles.chipSub, building === b && styles.chipTextActive]}>
                {BUILDINGS[b].gender === 'male' ? '남' : '여'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.genderNote}>
          성별: {gender === 'male' ? '남성' : '여성'} ({building}동 자동 설정)
        </Text>

        {/* 층 선택 */}
        {BUILDINGS[building].floors.length > 0 && (
          <>
            <Text style={styles.label}>층</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {BUILDINGS[building].floors.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, floor === f && styles.chipActive]}
                  onPress={() => setFloor(f)}
                >
                  <Text style={[styles.chipText, floor === f && styles.chipTextActive]}>{f}층</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* 호수 선택 */}
        <Text style={styles.label}>호수</Text>
        {rooms.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {rooms.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, roomNumber === r && styles.chipActive]}
                onPress={() => setRoomNumber(r)}
              >
                <Text style={[styles.chipText, roomNumber === r && styles.chipTextActive]}>{r}호</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="호수 직접 입력"
            value={roomNumber}
            onChangeText={setRoomNumber}
            keyboardType="number-pad"
          />
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>회원가입</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>이미 계정이 있으신가요? 로그인</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: '#fff' },
  flex1:          { flex: 1 },
  container:      { flexGrow: 1, padding: 24, paddingBottom: 40 },
  title:          { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  label:          { fontSize: 13, color: '#444', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 13, fontSize: 15 },
  row:            { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ok:             { color: '#22c55e', fontSize: 12, fontWeight: '600', minWidth: 64 },
  ng:             { color: '#ef4444', fontSize: 12, fontWeight: '600', minWidth: 64 },
  buildingRow:    { flexDirection: 'row', gap: 8 },
  genderNote:     { fontSize: 12, color: '#888', marginTop: 6 },
  hScroll:        { marginBottom: 4 },
  chip:           { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center', marginRight: 6, marginBottom: 4 },
  chipActive:     { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  chipText:       { color: '#444', fontWeight: '600', fontSize: 14 },
  chipSub:        { color: '#aaa', fontSize: 11, marginTop: 1 },
  chipTextActive: { color: '#fff' },
  button:         { backgroundColor: '#1B4FD8', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link:           { textAlign: 'center', color: '#1B4FD8', fontSize: 14 },
});
