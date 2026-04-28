import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NoticesStackParamList } from '../../navigation';

const NOTICES_URL = 'https://mhdorm.hufs.ac.kr/mhdorm/14214/subview.do';
const BASE_URL    = 'https://mhdorm.hufs.ac.kr';

export interface Notice {
  id: string;
  title: string;
  date: string;
  url: string;
  isImportant: boolean;
}

function parseNotices(html: string): Notice[] {
  const notices: Notice[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch: RegExpExecArray | null;
  let idx = 0;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1];

    const linkStrongMatch = row.match(/href="([^"]+)"[^>]*>\s*<strong[^>]*>([^<]+)<\/strong>/);
    const linkTitleMatch  = row.match(/href="([^"]+)"[^>]*title="([^"]+)"/);
    const match = linkStrongMatch ?? linkTitleMatch;
    if (!match) continue;

    const rawHref = match[1];
    const title   = match[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    if (!title || title.length < 2) continue;

    const dateMatch  = row.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})/);
    const date = dateMatch ? dateMatch[1].replace(/\./g, '.').replace(/\.$/, '') : '';

    // 공지(중요) 행 감지 - 공지 뱃지, notice 클래스 등
    const isImportant = /class="[^"]*notice[^"]*"/i.test(row) ||
                        /공지/.test(row.replace(title, ''));

    const url = rawHref.startsWith('http') ? rawHref : `${BASE_URL}${rawHref}`;
    notices.push({ id: `n${idx++}`, title, date, url, isImportant });
  }
  return notices;
}

type Props = NativeStackScreenProps<NoticesStackParamList, 'NoticeList'>;

export default function NoticesScreen({ navigation }: Props) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res    = await fetch(NOTICES_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html   = await res.text();
      const parsed = parseNotices(html);
      if (parsed.length === 0) {
        setError('공지사항을 불러올 수 없습니다.\n아래 버튼으로 홈페이지를 확인하세요.');
      } else {
        setNotices(parsed);
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.\n인터넷 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1B4FD8" />
        <Text style={styles.loadingText}>공지사항 불러오는 중...</Text>
      </View>
    );
  }

  if (error || notices.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>📋</Text>
        <Text style={styles.errorText}>{error ?? '공지사항이 없습니다.'}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => Linking.openURL(NOTICES_URL)}>
          <Text style={styles.primaryBtnText}>홈페이지에서 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={fetchNotices} style={styles.retryBtn}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const important = notices.filter(n => n.isImportant);
  const regular   = notices.filter(n => !n.isImportant);

  function renderItem({ item, index }: { item: Notice; index: number }) {
    return (
      <TouchableOpacity
        style={[styles.item, item.isImportant && styles.itemImportant]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('NoticeDetail', { url: item.url, title: item.title })}
      >
        <View style={styles.itemLeft}>
          {item.isImportant && (
            <View style={styles.importantBadge}>
              <Text style={styles.importantBadgeText}>공지</Text>
            </View>
          )}
          <Text
            style={[styles.itemTitle, item.isImportant && styles.itemTitleImportant]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </View>
        <View style={styles.itemRight}>
          {item.date ? <Text style={styles.itemDate}>{item.date}</Text> : null}
          <Text style={styles.itemArrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 배너 */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerTitle}>HUFSDORM 공지사항</Text>
          <Text style={styles.bannerSub}>명지대학교 기숙사 공식 공지</Text>
        </View>
        <TouchableOpacity style={styles.bannerBtn} onPress={() => Linking.openURL(NOTICES_URL)}>
          <Text style={styles.bannerBtnText}>홈페이지 열기 ›</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notices}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotices} tintColor="#1B4FD8" />}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f7f8fa' },

  centered:             { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14, backgroundColor: '#f7f8fa' },
  loadingText:          { fontSize: 13, color: '#aaa', marginTop: 6 },
  errorEmoji:           { fontSize: 52, marginBottom: 4 },
  errorText:            { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 24 },
  primaryBtn:           { backgroundColor: '#1B4FD8', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 28, marginTop: 4 },
  primaryBtnText:       { color: '#fff', fontWeight: '700', fontSize: 15 },
  retryBtn:             { marginTop: 4 },
  retryText:            { color: '#1B4FD8', fontSize: 14, fontWeight: '600' },

  banner:               {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1B4FD8',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  bannerTitle:          { fontSize: 16, fontWeight: '800', color: '#fff' },
  bannerSub:            { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  bannerBtn:            { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  bannerBtnText:        { color: '#fff', fontSize: 12, fontWeight: '600' },

  listContent:          { paddingVertical: 8, paddingHorizontal: 12 },

  item:                 {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  itemImportant:        { borderLeftWidth: 3, borderLeftColor: '#1B4FD8', backgroundColor: '#f5f8ff' },
  itemLeft:             { flex: 1, gap: 5 },
  importantBadge:       { alignSelf: 'flex-start', backgroundColor: '#EEF2FF', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  importantBadgeText:   { fontSize: 11, color: '#1B4FD8', fontWeight: '700' },
  itemTitle:            { fontSize: 14, color: '#111', lineHeight: 21 },
  itemTitleImportant:   { fontWeight: '600' },
  itemRight:            { alignItems: 'flex-end', gap: 6 },
  itemDate:             { fontSize: 11, color: '#aaa' },
  itemArrow:            { fontSize: 18, color: '#ccc' },

  separator:            { height: 8 },
});
