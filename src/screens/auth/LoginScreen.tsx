import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation';
import { login, sendPasswordReset } from '../../services/auth.service';
import { AppError } from '../../services/errors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // 로그인 성공 → AuthContext가 상태를 감지해 Navigation이 자동으로 Main으로 전환
    } catch (e) {
      Alert.alert('로그인 실패', e instanceof AppError ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>HUFS Dorm</Text>
        <Text style={styles.subtitle}>한국외대 기숙사 커뮤니티</Text>

        <TextInput
          style={styles.input}
          placeholder="학교 이메일 (@hufs.ac.kr)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '로그인 중…' : '로그인'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          Alert.prompt
            ? Alert.prompt('비밀번호 재설정', '가입한 이메일을 입력하세요.', async (input) => {
                if (!input) return;
                try { await sendPasswordReset(input.trim()); Alert.alert('발송 완료', '비밀번호 재설정 메일을 보냈습니다.'); }
                catch (e) { Alert.alert('오류', e instanceof AppError ? e.message : '오류가 발생했습니다.'); }
              })
            : Alert.alert('비밀번호 재설정', `${email.trim() || '이메일'} 로 재설정 메일을 보내시겠습니까?`, [
                { text: '취소', style: 'cancel' },
                { text: '보내기', onPress: async () => {
                  if (!email.trim()) { Alert.alert('이메일 입력', '위 이메일 칸에 이메일을 입력 후 시도해주세요.'); return; }
                  try { await sendPasswordReset(email.trim()); Alert.alert('발송 완료', '비밀번호 재설정 메일을 보냈습니다.'); }
                  catch (e) { Alert.alert('오류', e instanceof AppError ? e.message : '오류가 발생했습니다.'); }
                }},
              ]);
        }}>
          <Text style={styles.linkSmall}>비밀번호를 잊으셨나요?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>계정이 없으신가요? 회원가입</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: '#fff' },
  container:      { flex: 1, justifyContent: 'center', padding: 24 },
  title:          { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle:       { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
  input:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 15 },
  button:         { backgroundColor: '#1B4FD8', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link:           { textAlign: 'center', color: '#1B4FD8', fontSize: 14 },
  linkSmall:      { textAlign: 'center', color: '#aaa', fontSize: 13, marginBottom: 12 },
});
