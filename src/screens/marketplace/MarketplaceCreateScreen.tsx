import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MarketplaceStackParamList } from '../../navigation';
import { createPost, uploadPostImages } from '../../services/post.service';
import { useAuth } from '../../hooks/useAuth';
import type { TradeSubType } from '../../types';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'MarketplaceCreate'>;

export default function MarketplaceCreateScreen({ navigation }: Props) {
  const { appUser } = useAuth();
  const [subType,  setSubType]  = useState<TradeSubType>('sell');
  const [title,    setTitle]    = useState('');
  const [price,    setPrice]    = useState('');
  const [body,     setBody]     = useState('');
  const [images,   setImages]   = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) { Alert.alert('입력 오류', '제목과 내용을 입력해주세요.'); return; }
    if (!appUser) return;
    setSubmitting(true);
    try {
      const postId = await createPost({
        type: 'trade',
        subType,
        tradeStatus: 'selling',
        authorUid: appUser.uid,
        authorName: appUser.name,
        title: title.trim(),
        body: body.trim(),
        imageUrls: [],
        price: price ? Number(price.replace(/,/g, '')) : undefined,
      });
      if (images.length > 0) await uploadPostImages(postId, images);
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.code === 'storage/unauthorized'
        ? '이미지 업로드 권한이 없습니다. Firebase Storage 규칙을 확인해주세요.'
        : `게시글 작성에 실패했습니다. (${e?.code ?? e?.message ?? '알 수 없는 오류'})`;
      Alert.alert('오류', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* 팔아요/구해요 */}
        <View style={styles.typeRow}>
          {(['sell', 'buy'] as TradeSubType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, subType === t && styles.typeBtnActive]}
              onPress={() => setSubType(t)}
            >
              <Text style={[styles.typeBtnText, subType === t && styles.typeBtnTextActive]}>
                {t === 'sell' ? '팔아요' : '구해요'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.titleInput} placeholder="제목" value={title} onChangeText={setTitle} maxLength={100} />
        <TextInput style={styles.priceInput} placeholder="가격 (선택)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TextInput style={styles.bodyInput} placeholder="내용을 입력해주세요." value={body} onChangeText={setBody} multiline textAlignVertical="top" />

        {/* 이미지 */}
        <View style={styles.imageRow}>
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
            <Text style={styles.addImageIcon}>📷</Text>
            <Text style={styles.addImageText}>{images.length}/5</Text>
          </TouchableOpacity>
          {images.map((uri, i) => (
            <TouchableOpacity key={i} onPress={() => setImages(prev => prev.filter((_, idx) => idx !== i))}>
              <Image source={{ uri }} style={styles.thumbnail} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>게시하기</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:             { flex: 1, backgroundColor: '#fff' },
  container:        { padding: 16, gap: 12 },
  typeRow:          { flexDirection: 'row', gap: 8 },
  typeBtn:          { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, alignItems: 'center' },
  typeBtnActive:    { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  typeBtnText:      { fontWeight: '600', color: '#555' },
  typeBtnTextActive:{ color: '#fff' },
  titleInput:       { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 12, fontSize: 17, fontWeight: '600' },
  priceInput:       { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 10, fontSize: 15, color: '#1B4FD8' },
  bodyInput:        { height: 200, fontSize: 15, lineHeight: 24, color: '#222' },
  imageRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addImageBtn:      { width: 72, height: 72, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addImageIcon:     { fontSize: 22 },
  addImageText:     { fontSize: 11, color: '#aaa' },
  thumbnail:        { width: 72, height: 72, borderRadius: 8 },
  button:           { backgroundColor: '#1B4FD8', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonDisabled:   { opacity: 0.5 },
  buttonText:       { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
