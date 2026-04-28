import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking, Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NoticesStackParamList } from '../../navigation';

type Props = NativeStackScreenProps<NoticesStackParamList, 'NoticeDetail'>;

const BASE     = 'https://mhdorm.hufs.ac.kr';
const SW       = Dimensions.get('window').width;
const IMG_MAX  = SW - 32;

// ── 타입 ──────────────────────────────────────────────────────────────────────

type Block =
  | { kind: 'para';  html: string }
  | { kind: 'h';     level: 1 | 2 | 3; text: string }
  | { kind: 'img';   src: string; alt: string }
  | { kind: 'hr' }
  | { kind: 'list';  ordered: boolean; items: string[] }
  | { kind: 'table'; rows: { cells: string[]; header: boolean }[] };

// ── HTML 유틸 ─────────────────────────────────────────────────────────────────

function resolveUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  ).trim();
}

// ── 블록 파서 ─────────────────────────────────────────────────────────────────

function extractArticleHtml(html: string): string {
  const patterns = [
    /class="[^"]*artclView[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*view[-_]con[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*board[-_]view[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /class="[^"]*cont(?:ent)?[-_]?area[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1].replace(/<[^>]+>/g, '').trim().length > 60) return m[1];
  }
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return body ? body[1] : html;
}

function parseTableBlock(tableHtml: string): Block {
  const rows: { cells: string[]; header: boolean }[] = [];
  const rowMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const rm of rowMatches) {
    const row   = rm[1];
    const isHdr = /<th[\s>]/i.test(row);
    const tdRx  = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells: string[] = [];
    let cm: RegExpExecArray | null;
    while ((cm = tdRx.exec(row)) !== null) {
      cells.push(stripTags(cm[1]).replace(/\n+/g, ' ').trim());
    }
    if (cells.length) rows.push({ cells, header: isHdr });
  }
  return { kind: 'table', rows };
}

function parseListBlock(listHtml: string, ordered: boolean): Block {
  const items: string[] = [];
  const liRx = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = liRx.exec(listHtml)) !== null) {
    const t = stripTags(m[1]).replace(/\n+/g, ' ').trim();
    if (t) items.push(t);
  }
  return { kind: 'list', ordered, items };
}

function parseHtml(raw: string): Block[] {
  const article = extractArticleHtml(raw);
  const blocks: Block[] = [];

  // 블록 요소 단위로 분리
  const blockRx = /<(h[1-3]|img|table|ul|ol|hr|p|div)[^>]*>([\s\S]*?)<\/\1>|<(img|hr)\s[^>]*\/>|<(img|hr)[^>]*>/gi;
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = blockRx.exec(article)) !== null) {
    // 태그 앞 텍스트
    const before = article.slice(lastIdx, m.index);
    const plainBefore = stripTags(before).replace(/\n{3,}/g, '\n\n').trim();
    if (plainBefore) blocks.push({ kind: 'para', html: plainBefore });

    const tag  = (m[1] ?? m[3] ?? m[4] ?? '').toLowerCase();
    const body = m[2] ?? '';

    if (/^h[1-3]$/.test(tag)) {
      const level = Number(tag[1]) as 1 | 2 | 3;
      const text  = stripTags(body).replace(/\n+/g, ' ').trim();
      if (text) blocks.push({ kind: 'h', level, text });
    } else if (tag === 'img') {
      const src = (m[0].match(/src="([^"]+)"/) ?? [])[1] ?? '';
      const alt = (m[0].match(/alt="([^"]*)"/) ?? [])[1] ?? '';
      if (src) blocks.push({ kind: 'img', src: resolveUrl(src), alt });
    } else if (tag === 'table') {
      const tb = parseTableBlock(m[0]);
      if ((tb as any).rows?.length) blocks.push(tb);
    } else if (tag === 'ul' || tag === 'ol') {
      const lb = parseListBlock(m[0], tag === 'ol');
      if ((lb as any).items?.length) blocks.push(lb);
    } else if (tag === 'hr') {
      blocks.push({ kind: 'hr' });
    } else {
      // p / div — 내부에 img가 있으면 img 블록으로
      const imgs = [...body.matchAll(/<img[^>]+src="([^"]+)"[^>]*(?:\/>|>)/gi)];
      if (imgs.length) {
        for (const img of imgs) {
          blocks.push({ kind: 'img', src: resolveUrl(img[1]), alt: '' });
        }
        const textPart = stripTags(body).replace(/\n{3,}/g, '\n\n').trim();
        if (textPart) blocks.push({ kind: 'para', html: textPart });
      } else {
        const text = stripTags(body).replace(/\n{3,}/g, '\n\n').trim();
        if (text) blocks.push({ kind: 'para', html: text });
      }
    }

    lastIdx = m.index + m[0].length;
  }

  // 마지막 남은 텍스트
  const tail = stripTags(article.slice(lastIdx)).replace(/\n{3,}/g, '\n\n').trim();
  if (tail) blocks.push({ kind: 'para', html: tail });

  return blocks.filter(b => {
    if (b.kind === 'para') return b.html.replace(/\s/g, '').length > 0;
    return true;
  });
}

// ── 인라인 텍스트 렌더러 ──────────────────────────────────────────────────────

function InlineText({ html, style }: { html: string; style?: any }) {
  // html이 이미 strip된 plain text면 그냥 렌더링
  return <Text style={style}>{html}</Text>;
}

// ── 블록 렌더러 ───────────────────────────────────────────────────────────────

function BlockRenderer({ block, idx }: { block: Block; idx: number }) {
  switch (block.kind) {
    case 'h':
      return (
        <Text key={idx} style={[styles.heading, block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3]}>
          {block.text}
        </Text>
      );

    case 'para':
      return <Text key={idx} style={styles.para}>{block.html}</Text>;

    case 'img':
      return (
        <View key={idx} style={styles.imgWrap}>
          <Image
            source={{ uri: block.src }}
            style={styles.img}
            resizeMode="contain"
            accessibilityLabel={block.alt}
          />
          {block.alt ? <Text style={styles.imgCaption}>{block.alt}</Text> : null}
        </View>
      );

    case 'hr':
      return <View key={idx} style={styles.hr} />;

    case 'list':
      return (
        <View key={idx} style={styles.listWrap}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>
                {block.ordered ? `${i + 1}.` : '•'}
              </Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case 'table':
      return (
        <View key={idx} style={styles.table}>
          {block.rows.map((row, ri) => (
            <View key={ri} style={[styles.tableRow, row.header && styles.tableHeaderRow, ri === block.rows.length - 1 && styles.tableLastRow]}>
              {row.cells.map((cell, ci) => (
                <View key={ci} style={[styles.tableCell, ci === row.cells.length - 1 && styles.tableCellLast]}>
                  <Text style={[styles.tableCellText, row.header && styles.tableHeaderText]} numberOfLines={0}>
                    {cell}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );

    default:
      return null;
  }
}

// ── 메인 화면 ─────────────────────────────────────────────────────────────────

export default function NoticeDetailScreen({ route }: Props) {
  const { url, title } = route.params;

  const [blocks,  setBlocks]  = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await res.text();
        const parsed = parseHtml(html);
        if (parsed.length === 0) { setError(true); return; }
        setBlocks(parsed);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [url]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1B4FD8" />
        <Text style={styles.loadingText}>공지 불러오는 중...</Text>
      </View>
    );
  }

  if (error || blocks.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>🔗</Text>
        <Text style={styles.errorText}>앱에서 내용을 표시하지 못했습니다.{'\n'}브라우저에서 확인해주세요.</Text>
        <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(url)}>
          <Text style={styles.linkBtnText}>브라우저에서 열기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 제목 헤더 */}
        <View style={styles.titleCard}>
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>공지사항</Text>
          </View>
          <Text style={styles.titleText}>{title}</Text>
        </View>

        <View style={styles.divider} />

        {/* 본문 블록 */}
        <View style={styles.body}>
          {blocks.map((block, idx) => (
            <BlockRenderer key={idx} block={block} idx={idx} />
          ))}
        </View>
      </ScrollView>

      {/* 하단 바 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.externalBtn} onPress={() => Linking.openURL(url)}>
          <Text style={styles.externalBtnText}>🌐  원문 보기 (브라우저)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f7f8fa' },
  scroll:          { flex: 1 },
  scrollContent:   { paddingBottom: 24 },

  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14, backgroundColor: '#f7f8fa' },
  loadingText:     { fontSize: 13, color: '#aaa', marginTop: 6 },
  errorEmoji:      { fontSize: 48, marginBottom: 4 },
  errorText:       { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 24 },
  linkBtn:         { backgroundColor: '#1B4FD8', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 28, marginTop: 4 },
  linkBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },

  // 제목 카드
  titleCard:       { backgroundColor: '#fff', margin: 12, borderRadius: 14, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  titleBadge:      { alignSelf: 'flex-start', backgroundColor: '#EEF2FF', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3, marginBottom: 10 },
  titleBadgeText:  { fontSize: 11, color: '#1B4FD8', fontWeight: '700' },
  titleText:       { fontSize: 18, fontWeight: '800', color: '#111', lineHeight: 27 },

  divider:         { height: 1, backgroundColor: '#ebebeb', marginHorizontal: 12 },

  body:            { padding: 16, gap: 10 },

  // 제목 블록
  heading:         { fontWeight: '700', color: '#111', marginTop: 6 },
  h1:              { fontSize: 20, lineHeight: 28 },
  h2:              { fontSize: 17, lineHeight: 25 },
  h3:              { fontSize: 15, lineHeight: 22, color: '#333' },

  // 단락
  para:            { fontSize: 15, color: '#222', lineHeight: 26 },

  // 이미지
  imgWrap:         { alignItems: 'center', marginVertical: 6 },
  img:             { width: IMG_MAX, height: IMG_MAX * 0.65, borderRadius: 10, backgroundColor: '#f0f0f0' },
  imgCaption:      { fontSize: 12, color: '#aaa', marginTop: 5, textAlign: 'center' },

  // 구분선
  hr:              { height: 1, backgroundColor: '#ebebeb', marginVertical: 10 },

  // 목록
  listWrap:        { gap: 6 },
  listItem:        { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  listBullet:      { fontSize: 15, color: '#1B4FD8', fontWeight: '700', minWidth: 20, lineHeight: 26 },
  listText:        { flex: 1, fontSize: 15, color: '#222', lineHeight: 26 },

  // 표
  table:           { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e0e8ff', marginVertical: 4 },
  tableRow:        { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eef0f8' },
  tableLastRow:    { borderBottomWidth: 0 },
  tableHeaderRow:  { backgroundColor: '#EEF2FF' },
  tableCell:       { flex: 1, padding: 10, borderRightWidth: 1, borderRightColor: '#eef0f8' },
  tableCellLast:   { borderRightWidth: 0 },
  tableCellText:   { fontSize: 13, color: '#333', lineHeight: 20 },
  tableHeaderText: { color: '#1B4FD8', fontWeight: '700' },

  // 하단
  bottomBar:       { borderTopWidth: 1, borderTopColor: '#ebebeb', paddingVertical: 13, paddingHorizontal: 18, backgroundColor: '#fff', alignItems: 'center' },
  externalBtn:     {},
  externalBtnText: { color: '#1B4FD8', fontSize: 14, fontWeight: '600' },
});
