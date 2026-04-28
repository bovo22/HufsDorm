import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CommunityStackParamList } from '../../navigation';
import { usePosts } from '../../hooks/usePosts';
import type { Post } from '../../types';

type Props = NativeStackScreenProps<CommunityStackParamList, 'PostList'>;

export default function PostListScreen({ route, navigation }: Props) {
  const { board } = route.params;
  const { posts, loading, error, refresh } = usePosts('community');
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const filtered = posts
    .filter(p => board === 'all' || p.subType === board)
    .filter(p => !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.body.toLowerCase().includes(search.toLowerCase())
    );

  function renderItem({ item }: { item: Post }) {
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      >
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.metaText}>{item.authorName}</Text>
          <View style={styles.metaRight}>
            <Text style={styles.metaText}>{item.createdAt.slice(0, 10)}</Text>
            <Text style={styles.metaText}>❤️ {item.likes}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* 검색 */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="게시글 검색..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading && !posts.length ? (
        <ActivityIndicator style={styles.centered} size="large" color="#1B4FD8" />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}><Text style={styles.retryText}>다시 시도</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {search.trim() ? '검색 결과가 없습니다.' : '게시글이 없습니다.'}
            </Text>
          }
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : undefined}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PostCreate', { board })}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  searchRow:      { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  searchInput:    { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: '#222' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  item:           { padding: 16 },
  itemTitle:      { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#111' },
  itemBody:       { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 8 },
  itemMeta:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRight:      { flexDirection: 'row', gap: 10 },
  metaText:       { fontSize: 12, color: '#aaa' },
  separator:      { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },
  emptyText:      { color: '#aaa', fontSize: 14 },
  errorText:      { color: '#e55', fontSize: 14 },
  retryText:      { color: '#1B4FD8', fontSize: 14 },
  fab:            { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: '#1B4FD8', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText:        { color: '#fff', fontSize: 28, lineHeight: 32 },
});
