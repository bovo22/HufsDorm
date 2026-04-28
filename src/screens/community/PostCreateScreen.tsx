import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CommunityStackParamList } from '../../navigation';
import { createPost, uploadPostImages } from '../../services/post.service';
import { useAuth } from '../../hooks/useAuth';

type Props = NativeStackScreenProps<CommunityStackParamList, 'PostCreate'>;

const MAX_IMAGES = 5;

export default function PostCreateScreen({ route, navigation }: Props) {
  const { board } = route.params;
  const { appUser, refreshAppUser } = useAuth();

  const [title,      setTitle]      = useState('');
  const [body,       setBody]       = useState('');
  const [imageUris,  setImageUris]  = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - imageUris.length,
    });
    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setImageUris(prev => [...prev, ...newUris].slice(0, MAX_IMAGES));
    }
  }

  function removeImage(uri: string) {
    setImageUris(prev => prev.filter(u => u !== uri));
  }

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('입력 오류', '제목과 내용을 모두 입력해주세요.');
      return;
    }
    if (!appUser) {
      refreshAppUser().catch(() => {});
      Alert.alert('잠시 후 다시 시도', '사용자 정보를 불러오는 중입니다. 1~2초 후 다시 눌러주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const postId = await createPost({
        type: 'community',
        subType: board,
        authorUid: appUser.uid,
        authorName: appUser.nickname ?? appUser.name,
        title: title.trim(),
        body: body.trim(),
        imageUrls: [],
      });
      // 이미지가 있으면 업로드 후 게시글 업데이트
      if (imageUris.length > 0) {
        const urls = await uploadPostImages(postId, imageUris);
        const { updateDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../firebase/config');
        await updateDoc(doc(db, 'posts', postId), { imageUrls: urls });
      }
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.code === 'permission-denied'
        ? '게시 권한이 없습니다.'
        : `게시글 작성에 실패했습니다. (${e?.code ?? e?.message ?? '알 수 없는 오류'})`;
      Alert.alert('오류', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.titleInput}
          placeholder="제목"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <TextInput
          style={styles.bodyInput}
          placeholder="내용을 입력해주세요."
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
        />

        {/* 사진 첨부 */}
        <View style={styles.imageSection}>
          <TouchableOpacity
            style={styles.addImageBtn}
            onPress={pickImages}
            disabled={imageUris.length >= MAX_IMAGES}
          >
            <Text style={styles.addImageIcon}>📷</Text>
            <Text style={styles.addImageText}>{imageUris.length}/{MAX_IMAGES}</Text>
          </TouchableOpacity>
          {imageUris.map(uri => (
            <View key={uri} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(uri)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>게시하기</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: '#fff' },
  container:      { padding: 16, gap: 12 },
  titleInput:     { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 12, fontSize: 17, fontWeight: '600' },
  bodyInput:      { height: 200, fontSize: 15, lineHeight: 24, color: '#222' },
  imageSection:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addImageBtn:    { width: 72, height: 72, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addImageIcon:   { fontSize: 22 },
  addImageText:   { fontSize: 11, color: '#aaa', marginTop: 2 },
  thumbWrap:      { width: 72, height: 72, borderRadius: 8, overflow: 'hidden' },
  thumb:          { width: '100%', height: '100%' },
  removeBtn:      { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  removeBtnText:  { color: '#fff', fontSize: 10, lineHeight: 14 },
  button:         { backgroundColor: '#1B4FD8', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
