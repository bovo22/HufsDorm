import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MarketplaceStackParamList } from '../../navigation';
import { usePosts } from '../../hooks/usePosts';
import type { Post, TradeSubType } from '../../types';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'MarketplaceHome'>;

const FILTERS: { label: string; value: TradeSubType | 'all' }[] = [
  { label: '전체',    value: 'all'  },
  { label: '팔아요',  value: 'sell' },
  { label: '구해요',  value: 'buy'  },
];

export default function MarketplaceScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<TradeSubType | 'all'>('all');
  const [search, setSearch] = useState('');
  const { posts, loading, error, refresh } = usePosts('trade');

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const filtered = posts
    .filter(p => filter === 'all' || p.subType === filter)
    .filter(p => !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.body.toLowerCase().includes(search.toLowerCase())
    );

  function renderItem({ item }: { item: Post }) {
    const isSold = item.tradeStatus === 'sold';
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('MarketplaceDetail', { postId: item.id })}
      >
        <View style={[styles.badge, item.subType === 'sell' ? styles.badgeSell : styles.badgeBuy]}>
          <Text style={styles.badgeText}>{item.subType === 'sell' ? '팔아요' : '구해요'}</Text>
        </View>
        <View style={styles.itemContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.itemTitle, isSold && styles.itemTitleSold]} numberOfLines={1}>
              {item.title}
            </Text>
            {isSold && (
              <View style={styles.soldBadge}>
                <Text style={styles.soldBadgeText}>판매완료</Text>
              </View>
            )}
          </View>
          {item.price != null && (
            <Text style={[styles.price, isSold && styles.priceSold]}>
              {item.price.toLocaleString()}원
            </Text>
          )}
          <View style={styles.itemMeta}>
            <Text style={styles.metaText}>{item.authorName}</Text>
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

      {/* 필터 */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
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

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('MarketplaceCreate')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff' },
  searchRow:        { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  searchInput:      { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: '#222' },
  filterRow:        { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterBtn:        { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  filterBtnActive:  { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  filterText:       { fontSize: 13, color: '#555' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  item:             { flexDirection: 'row', padding: 14, gap: 12, alignItems: 'flex-start' },
  badge:            { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 2 },
  badgeSell:        { backgroundColor: '#FEF3C7' },
  badgeBuy:         { backgroundColor: '#DBEAFE' },
  badgeText:        { fontSize: 12, fontWeight: '600' },
  itemContent:      { flex: 1 },
  titleRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  itemTitle:        { flex: 1, fontSize: 15, fontWeight: '600' },
  itemTitleSold:    { color: '#aaa' },
  soldBadge:        { backgroundColor: '#f0f0f0', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  soldBadgeText:    { fontSize: 11, color: '#888', fontWeight: '600' },
  price:            { fontSize: 14, color: '#1B4FD8', fontWeight: '700', marginBottom: 4 },
  priceSold:        { color: '#bbb', textDecorationLine: 'line-through' },
  itemMeta:         { flexDirection: 'row', justifyContent: 'space-between' },
  metaText:         { fontSize: 12, color: '#aaa' },
  separator:        { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 14 },
  centered:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyContainer:   { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:        { color: '#aaa', fontSize: 14 },
  errorText:        { color: '#e55', fontSize: 14 },
  retryText:        { color: '#1B4FD8', fontSize: 14 },
  fab:              { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: '#1B4FD8', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText:          { color: '#fff', fontSize: 28, lineHeight: 32 },
});
