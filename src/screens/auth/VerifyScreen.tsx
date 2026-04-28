import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { logout } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyScreen() {
  const { reloadUser } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleVerified = async () => {
    setChecking(true);
    try {
      await reloadUser();
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📬</Text>
      <Text style={styles.title}>이메일 인증</Text>
      <Text style={styles.body}>
        학교 이메일로 인증 메일을 발송했습니다.{'\n'}
        메일함을 확인하여 인증 링크를 클릭해주세요.{'\n\n'}
        이메일 인증 후에는{'\n'}
        HUFSDORM 합격 화면 인증이 필요합니다.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleVerified} disabled={checking}>
        {checking
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryText}>인증 완료했어요</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={logout}>
        <Text style={styles.secondaryText}>로그인 화면으로</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  emoji:           { fontSize: 64, marginBottom: 16 },
  title:           { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  body:            { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  primaryButton:   { backgroundColor: '#1B4FD8', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, minWidth: 200, alignItems: 'center' },
  primaryText:     { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { paddingVertical: 10 },
  secondaryText:   { color: '#888', fontSize: 14 },
});
