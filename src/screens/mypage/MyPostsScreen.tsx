import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getPostsByAuthor } from '../../services/mypage.service';
import { useAuth } from '../../hooks/useAuth';
import type { Post } from '../../types';

const TYPE_LABEL: Record<string, string> = {
  trade:     '거래',
  community: '커뮤니티',
  delivery:  '배달팟',
  roommate:  '룸메이트',
};

export default function MyPostsScreen() {
  const { appUser }  = useAuth();
  const navigation   = useNavigation<any>();
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) { setLoading(false); return; }
    getPostsByAuthor(appUser.uid)
      .then(p => setPosts(p))
      .finally(() => setLoading(false));
  }, [appUser]);

  function handlePress(post: Post) {
    if (post.type === 'trade') {
      navigation.navigate('MyTradeDetail', { postId: post.id });
    } else {
      navigation.navigate('MyPostDetail', { postId: post.id });
    }
  }

  if (loading) return <ActivityIndicator style={styles.centered} size="large" color="#1B4FD8" />;

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id}
      style={styles.list}
      contentContainerStyle={posts.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>작성한 게시글이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => handlePress(item)}>
          <View style={styles.itemHeader}>
            <Text style={styles.typeBadge}>{TYPE_LABEL[item.type] ?? item.type}</Text>
            <Text style={styles.date}>{item.createdAt.slice(0, 10)}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <View style={styles.meta}>
            {item.price != null && <Text style={styles.price}>{item.price.toLocaleString()}원</Text>}
            <Text style={styles.likes}>❤️ {item.likes}</Text>
          </View>
        </TouchableOpacity>
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
  item:           { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 10, padding: 14, gap: 4 },
  itemHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  typeBadge:      { fontSize: 11, color: '#6366F1', fontWeight: '700', backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  date:           { fontSize: 11, color: '#bbb' },
  title:          { fontSize: 15, fontWeight: '600', color: '#111' },
  body:           { fontSize: 13, color: '#666', lineHeight: 19 },
  meta:           { flexDirection: 'row', gap: 10, marginTop: 4 },
  price:          { fontSize: 13, color: '#1B4FD8', fontWeight: '700' },
  likes:          { fontSize: 12, color: '#aaa' },
});
