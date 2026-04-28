import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { getCommentsByAuthor } from '../../services/mypage.service';
import { useAuth } from '../../hooks/useAuth';
import type { Comment } from '../../types';

export default function MyCommentsScreen() {
  const { appUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!appUser) { setLoading(false); return; }
    getCommentsByAuthor(appUser.uid)
      .then(c => setComments(c))
      .finally(() => setLoading(false));
  }, [appUser]);

  if (loading) return <ActivityIndicator style={styles.centered} size="large" color="#1B4FD8" />;

  return (
    <FlatList
      data={comments}
      keyExtractor={item => item.id}
      style={styles.list}
      contentContainerStyle={comments.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>작성한 댓글이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
          <Text style={styles.date}>{item.createdAt.slice(0, 10)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list:           { flex: 1, backgroundColor: '#f8f8f8' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox:       { alignItems: 'center', gap: 8 },
  emptyIcon:      { fontSize: 40, marginBottom: 4 },
  emptyText:      { fontSize: 14, color: '#aaa' },
  separator:      { height: 8 },
  item:           { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 10, padding: 14, gap: 6 },
  body:           { fontSize: 14, color: '#222', lineHeight: 21 },
  date:           { fontSize: 11, color: '#bbb' },
});
