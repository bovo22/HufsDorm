import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CommunityStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { BUILDINGS } from '../../constants/buildings';

type Props = NativeStackScreenProps<CommunityStackParamList, 'CommunityHome'>;

interface Board {
  board: string;
  title: string;
  description: string;
  emoji: string;
  genderFilter?: 'male' | 'female';
}

const BOARDS: Board[] = [
  { board: 'all',      title: '전체 게시판',     description: '전체 기숙사생 공개',  emoji: '🏠' },
  { board: 'male',     title: '남자 기숙사',      description: 'A동 · E동',           emoji: '👦', genderFilter: 'male' },
  { board: 'female',   title: '여자 기숙사',      description: 'B동 · C동 · D동',     emoji: '👧', genderFilter: 'female' },
  { board: 'roommate', title: '룸메이트',         description: '구해요 · 찾아요',      emoji: '🤝' },
  { board: 'delivery', title: '배달팟',           description: '같이 시켜먹어요',      emoji: '🍕' },
  { board: 'group',    title: '모임',             description: '원하는 모임 만들기',   emoji: '👥' },
];

export default function CommunityHomeScreen({ navigation }: Props) {
  const { appUser } = useAuth();
  const userGender = appUser ? BUILDINGS[appUser.building].gender : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {BOARDS.map(b => {
        // 성별 분리 게시판 — 본인 성별만 진입 가능
        const locked = b.genderFilter != null && b.genderFilter !== userGender;
        return (
          <TouchableOpacity
            key={b.board}
            style={[styles.card, locked && styles.cardLocked]}
            onPress={() => !locked && navigation.navigate('PostList', { board: b.board, title: b.title })}
            activeOpacity={locked ? 1 : 0.7}
          >
            <Text style={styles.cardEmoji}>{b.emoji}</Text>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, locked && styles.textLocked]}>{b.title}</Text>
              <Text style={styles.cardDesc}>{b.description}</Text>
            </View>
            {locked && <Text style={styles.lockBadge}>🔒</Text>}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f8f8f8' },
  content:    { padding: 16, gap: 10 },
  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 14, elevation: 1 },
  cardLocked: { opacity: 0.4 },
  cardEmoji:  { fontSize: 28 },
  cardText:   { flex: 1 },
  cardTitle:  { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  textLocked: { color: '#aaa' },
  cardDesc:   { fontSize: 13, color: '#888' },
  lockBadge:  { fontSize: 16 },
});
