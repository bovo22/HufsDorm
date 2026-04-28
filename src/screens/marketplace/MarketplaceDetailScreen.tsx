import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import {
  getPost, toggleLike, deletePost, updateTradeStatus,
  addComment, getComments,
} from '../../services/post.service';
import { getOrCreateChat } from '../../services/chat.service';
import { useAuth } from '../../hooks/useAuth';
import type { Post, Comment } from '../../types';

export default function MarketplaceDetailScreen() {
  const route      = useRoute<any>();
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const { postId } = route.params as { postId: string };
  const { appUser } = useAuth();

  const [post,     setPost]     = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [input,    setInput]    = useState('');
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([getPost(postId), getComments(postId)]);
      setPost(p);
      setComments(c);
      setLoading(false);
    })();
  }, [postId]);

  async function handleLike() {
    if (!appUser || !post) return;
    await toggleLike(postId, appUser.uid);
    setPost(prev => {
      if (!prev) return prev;
      const liked = prev.likedBy.includes(appUser.uid);
      return {
        ...prev,
        likes: prev.likes + (liked ? -1 : 1),
        likedBy: liked
          ? prev.likedBy.filter(id => id !== appUser.uid)
          : [...prev.likedBy, appUser.uid],
      };
    });
  }

  async function handleChat() {
    if (!appUser || !post) return;
    await getOrCreateChat(appUser.uid, post.authorUid);
    Alert.alert('채팅', `${post.authorName}님과의 채팅방이 준비됐습니다.\n채팅 탭에서 확인하세요.`);
  }

  async function handleDelete() {
    Alert.alert('삭제', '게시글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await deletePost(postId); navigation.goBack(); } },
    ]);
  }

  async function handleToggleStatus() {
    if (!post) return;
    const next = post.tradeStatus === 'sold' ? 'selling' : 'sold';
    await updateTradeStatus(postId, next);
    setPost(prev => prev ? { ...prev, tradeStatus: next } : prev);
  }

  async function handleComment() {
    if (!input.trim() || !appUser || !post) return;
    setSending(true);
    try {
      await addComment(postId, {
        authorUid: appUser.uid,
        authorName: appUser.nickname ?? appUser.name,
        body: input.trim(),
      });
      const updated = await getComments(postId);
      setComments(updated);
      setInput('');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <ActivityIndicator style={styles.centered} size="large" color="#1B4FD8" />;
  if (!post)   return <Text style={[styles.centered, { fontSize: 14 }]}>게시글을 찾을 수 없습니다.</Text>;

  const isOwner = appUser?.uid === post.authorUid;
  const isLiked = appUser ? post.likedBy.includes(appUser.uid) : false;
  const isSold  = post.tradeStatus === 'sold';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {post.imageUrls.length > 0 && (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {post.imageUrls.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.image} resizeMode="cover" />
            ))}
          </ScrollView>
        )}

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, post.subType === 'sell' ? styles.badgeSell : styles.badgeBuy]}>
              <Text style={styles.badgeText}>{post.subType === 'sell' ? '팔아요' : '구해요'}</Text>
            </View>
            {post.subType === 'sell' && (
              <View style={[styles.statusBadge, isSold ? styles.statusSold : styles.statusSelling]}>
                <Text style={[styles.statusBadgeText, isSold ? styles.statusSoldText : styles.statusSellingText]}>
                  {isSold ? '판매완료' : '판매중'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{post.title}</Text>
          {post.price != null && (
            <Text style={[styles.price, isSold && styles.priceSold]}>
              {post.price.toLocaleString()}원
            </Text>
          )}
          <View style={styles.meta}>
            <Text style={styles.metaText}>{post.authorName}</Text>
            <Text style={styles.metaText}>{post.createdAt.slice(0, 10)}</Text>
          </View>
          <Text style={styles.body}>{post.body}</Text>

          <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
            <Text style={styles.likeText}>{isLiked ? '❤️' : '🤍'} {post.likes}</Text>
          </TouchableOpacity>

          {/* 하단 버튼 (오너 vs 비오너) */}
          <View style={styles.actionRow}>
            {isOwner ? (
              <>
                {post.subType === 'sell' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, isSold ? styles.actionBtnSecondary : styles.actionBtnPrimary]}
                    onPress={handleToggleStatus}
                  >
                    <Text style={[styles.actionBtnText, isSold && styles.actionBtnSecondaryText]}>
                      {isSold ? '판매중으로 변경' : '판매완료로 변경'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete}>
                  <Text style={styles.actionBtnDangerText}>게시글 삭제</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary, isSold && styles.actionBtnDisabled]}
                onPress={handleChat}
                disabled={isSold}
              >
                <Text style={styles.actionBtnText}>
                  {isSold ? '판매 완료된 상품입니다' : '💬 채팅하기'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 댓글 */}
          <View style={styles.divider} />
          <Text style={styles.commentHeader}>댓글 {comments.length}</Text>
          {comments.map(c => (
            <View key={c.id} style={styles.comment}>
              <Text style={styles.commentAuthor}>{c.authorName}</Text>
              <Text style={styles.commentBody}>{c.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 댓글 입력 */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="댓글을 입력하세요…"
          placeholderTextColor="#aaa"
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={handleComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={handleComment}
          disabled={sending || !input.trim()}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.sendIcon}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#fff' },
  centered:            { flex: 1, justifyContent: 'center', alignItems: 'center' } as any,
  scrollContent:       { paddingBottom: 8 },
  image:               { width: 375, height: 280 },
  content:             { padding: 16, gap: 10 },
  badgeRow:            { flexDirection: 'row', gap: 8, alignItems: 'center' },
  badge:               { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSell:           { backgroundColor: '#FEF3C7' },
  badgeBuy:            { backgroundColor: '#DBEAFE' },
  badgeText:           { fontSize: 12, fontWeight: '600' },
  statusBadge:         { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusSelling:       { backgroundColor: '#DCFCE7' },
  statusSold:          { backgroundColor: '#F3F4F6' },
  statusBadgeText:     { fontSize: 12, fontWeight: '700' },
  statusSellingText:   { color: '#16A34A' },
  statusSoldText:      { color: '#9CA3AF' },
  title:               { fontSize: 20, fontWeight: 'bold' },
  price:               { fontSize: 18, color: '#1B4FD8', fontWeight: '700' },
  priceSold:           { color: '#bbb', textDecorationLine: 'line-through' },
  meta:                { flexDirection: 'row', justifyContent: 'space-between' },
  metaText:            { fontSize: 13, color: '#aaa' },
  body:                { fontSize: 15, lineHeight: 24, color: '#222', marginTop: 4 },
  likeBtn:             { alignSelf: 'flex-start' },
  likeText:            { fontSize: 15 },
  actionRow:           { gap: 8, marginTop: 4 },
  actionBtn:           { borderRadius: 10, padding: 14, alignItems: 'center' },
  actionBtnPrimary:    { backgroundColor: '#1B4FD8' },
  actionBtnSecondary:  { backgroundColor: '#F3F4F6' },
  actionBtnDanger:     { borderWidth: 1, borderColor: '#e55' },
  actionBtnDisabled:   { backgroundColor: '#E5E7EB' },
  actionBtnText:       { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  actionBtnSecondaryText: { color: '#374151' },
  actionBtnDangerText: { color: '#e55', fontWeight: 'bold', fontSize: 15 },
  divider:             { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
  commentHeader:       { fontSize: 14, fontWeight: '600', marginBottom: 12, color: '#444' },
  comment:             { marginBottom: 14 },
  commentAuthor:       { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  commentBody:         { fontSize: 14, color: '#333', lineHeight: 20 },
  inputRow:            { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f7f7f7', borderTopWidth: 1, borderTopColor: '#e8e8e8', gap: 8 },
  input:               { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 20, paddingHorizontal: 16, paddingTop: 9, paddingBottom: 9, fontSize: 15, maxHeight: 100 },
  sendBtn:             { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1B4FD8', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:     { backgroundColor: '#c7d2f5' },
  sendIcon:            { color: '#fff', fontSize: 17, fontWeight: 'bold', lineHeight: 20 },
});
