import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { submitAcceptanceImage } from '../../services/verify.service';
import { logout } from '../../services/auth.service';
import { AppError } from '../../services/errors';

export default function VerifyAcceptanceScreen() {
  const { appUser, refreshAppUser } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!imageUri || !appUser) return;
    setSubmitting(true);
    try {
      await submitAcceptanceImage(appUser.uid, imageUri);
      await refreshAppUser();
      Alert.alert(
        '제출 완료',
        '합격 화면이 제출되었습니다.\n검토 후 승인되면 앱을 이용할 수 있습니다.\n보통 24시간 이내에 처리됩니다.',
      );
    } catch (e) {
      Alert.alert('오류', e instanceof AppError ? e.message : '제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  const isPending = appUser?.verificationStatus === 'pending';

  if (isPending) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.title}>검토 중</Text>
        <Text style={styles.body}>
          합격 화면을 검토하고 있습니다.{'\n'}
          승인되면 앱을 이용할 수 있습니다.{'\n\n'}
          보통 24시간 이내에 처리됩니다.
        </Text>
        <TouchableOpacity style={styles.outlineButton} onPress={logout}>
          <Text style={styles.outlineButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.emoji}>🏠</Text>
      <Text style={styles.title}>기숙사 입주 인증</Text>
      <Text style={styles.body}>
        HUFSDORM 합격 화면을 캡처하여{'\n'}
        업로드해주세요.{'\n\n'}
        인증 후 학기별로 재인증이 필요합니다.
      </Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>📷</Text>
            <Text style={styles.imagePlaceholderText}>합격 화면 선택</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, (!imageUri || submitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!imageUri || submitting}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>제출하기</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={logout}>
        <Text style={styles.link}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  container:         { flexGrow: 1, alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  emoji:             { fontSize: 56, marginBottom: 12, marginTop: 24 },
  title:             { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  body:              { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  imagePicker:       { width: '100%', height: 220, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', borderStyle: 'dashed', overflow: 'hidden', marginBottom: 20 },
  preview:           { width: '100%', height: '100%' },
  imagePlaceholder:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  imagePlaceholderIcon: { fontSize: 36 },
  imagePlaceholderText: { color: '#aaa', fontSize: 14 },
  button:            { width: '100%', backgroundColor: '#1B4FD8', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonDisabled:    { opacity: 0.5 },
  buttonText:        { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  outlineButton:     { borderWidth: 1, borderColor: '#1B4FD8', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8 },
  outlineButtonText: { color: '#1B4FD8', fontWeight: '600' },
  link:              { color: '#aaa', fontSize: 13 },
});
