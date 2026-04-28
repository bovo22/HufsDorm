import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getPost, toggleLike, addComment, getComments, deletePost } from '../../services/post.service';
import { useAuth } from '../../hooks/useAuth';
import type { Post, Comment } from '../../types';

export default function PostDetailScreen() {
  const route     = useRoute<any>();
  const navigation = useNavigation<any>();
  const { postId } = route.params as { postId: string };
  const { appUser } = useAuth();
  const headerHeight = useHeaderHeight();

  const [post,        setPost]       = useState<Post | null>(null);
  const [comments,    setComments]   = useState<Comment[]>([]);
  const [input,       setInput]      = useState('');
  const [loading,     setLoading]    = useState(true);
  const [sending,     setSending]    = useState(false);
  useEffect(() => {
    async function load() {
      const [p, c] = await Promise.all([getPost(postId), getComments(postId)]);
      setPost(p);
      setComments(c);
      setLoading(false);
    }
    load();
  }, [postId]);

  async function handleLike() {
    if (!appUser || !post) return;
    await toggleLike(postId, appUser.uid);
    setPost(prev => {
      if (!prev) return prev;
      const liked = prev.likedBy.includes(appUser.uid);
      return {
        ...prev,
        likes:   prev.likes + (liked ? -1 : 1),
        likedBy: liked ? prev.likedBy.filter(id => id !== appUser.uid) : [...prev.likedBy, appUser.uid],
      };
    });
  }

  async function handleComment() {
    if (!input.trim() || !appUser || !post) return;
    setSending(true);
    try {
      await addComment(postId, { authorUid: appUser.uid, authorName: appUser.name, body: input.trim() });
      const updated = await getComments(postId);
      setComments(updated);
      setInput('');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    Alert.alert('삭제', '게시글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        await deletePost(postId);
        navigation.goBack();
      }},
    ]);
  }

  if (loading) return <ActivityIndicator style={styles.centered} size="large" color="#1B4FD8" />;
  if (!post)   return <Text style={styles.centered}>게시글을 찾을 수 없습니다.</Text>;

  const isOwner  = appUser?.uid === post.authorUid;
  const isLiked  = appUser ? post.likedBy.includes(appUser.uid) : false;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{post.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{post.authorName}</Text>
          <Text style={styles.metaText}>{post.createdAt.slice(0, 10)}</Text>
        </View>
        <Text style={styles.body}>{post.body}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
            <Text style={styles.likeText}>{isLiked ? '❤️' : '🤍'} {post.likes}</Text>
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity onPress={handleDelete}>
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />
        <Text style={styles.commentHeader}>댓글 {comments.length}</Text>
        {comments.map(c => (
          <View key={c.id} style={styles.comment}>
            <Text style={styles.commentAuthor}>{c.authorName}</Text>
            <Text style={styles.commentBody}>{c.body}</Text>
          </View>
        ))}
      </ScrollView>

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
  container:     { flex: 1, backgroundColor: '#fff' },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center' } as any,
  content:       { padding: 16 },
  title:         { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  meta:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metaText:      { fontSize: 13, color: '#aaa' },
  body:          { fontSize: 15, lineHeight: 24, color: '#222', marginBottom: 20 },
  actions:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  likeBtn:       { padding: 8 },
  likeText:      { fontSize: 15 },
  deleteText:    { color: '#e55', fontSize: 14 },
  divider:       { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
  commentHeader: { fontSize: 14, fontWeight: '600', marginBottom: 12, color: '#444' },
  comment:       { marginBottom: 14 },
  commentAuthor: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  commentBody:   { fontSize: 14, color: '#333', lineHeight: 20 },
  inputRow:        { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f7f7f7', borderTopWidth: 1, borderTopColor: '#e8e8e8', gap: 8 },
  input:           { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 20, paddingHorizontal: 16, paddingTop: 9, paddingBottom: 9, fontSize: 15, maxHeight: 100 },
  sendBtn:         { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1B4FD8', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#c7d2f5' },
  sendIcon:        { color: '#fff', fontSize: 17, fontWeight: 'bold', lineHeight: 20 },
});
