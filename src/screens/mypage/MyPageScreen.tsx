import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

// ─── 색상 상수 ────────────────────────────────────────────────
const COLORS = {
  primary: '#008A9A',
  primaryBg: '#008A9A18',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#1F2933',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',
  red: '#EF4444',
  redBg: '#FEF2F2',
};

// ─── 타입 ─────────────────────────────────────────────────────
type NavProp = NativeStackNavigationProp<RootStackParamList>;

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  screenName?: 'Main';
};

// ─── 메뉴 데이터 ──────────────────────────────────────────────
const MENU_ITEMS: MenuItem[] = [
  {
    icon: 'map-outline',
    label: '내 여행 코스',
    screenName: 'Main',        // TODO: 'MyTravel' 등 실제 스크린명으로 교체
  },
  {
    icon: 'sparkles-outline',
    label: 'AI 코스 추천',
    screenName: 'Main',        // TODO: 'AIRecommend' 등 실제 스크린명으로 교체
  },
  {
    icon: 'bookmark-outline',
    label: '저장한 장소',
  },
  {
    icon: 'settings-outline',
    label: '설정',
  },
];

// ─── 서브 컴포넌트: 메뉴 아이템 ──────────────────────────────
type MenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconBg?: string;
  iconColor?: string;
  textColor?: string;
};

function MenuRow({
  icon,
  label,
  onPress,
  iconBg = COLORS.primaryBg,
  iconColor = COLORS.primary,
  textColor = COLORS.text,
}: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.menuLabel, { color: textColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function MyPageScreen() {
  const navigation = useNavigation<NavProp>();

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => {
            // TODO: 로그아웃 로직 + 온보딩/로그인으로 이동
            // navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── 헤더 ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이 페이지</Text>

          {/* 프로필 */}
          <View style={styles.profileRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
              }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>김철수</Text>
              <Text style={styles.profileEmail}>chulsoo.kim@email.com</Text>
              <View style={styles.pointBadge}>
                <Text style={styles.pointText}>2,340 포인트</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 메뉴 목록 ── */}
        <View style={styles.content}>
          <View style={styles.menuGroup}>
            {MENU_ITEMS.map((item, index) => (
              <MenuRow
                key={index}
                icon={item.icon}
                label={item.label}
                onPress={() => {
                  if (item.screenName) navigation.navigate(item.screenName);
                }}
              />
            ))}
          </View>

          {/* 로그아웃 */}
          <MenuRow
            icon="log-out-outline"
            label="로그아웃"
            onPress={handleLogout}
            iconBg={COLORS.redBg}
            iconColor={COLORS.red}
            textColor={COLORS.red}
          />

          {/* 버전 정보 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Travelin v1.0.0</Text>
            <Text style={styles.footerText}>© 2026 Travelin. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── 스타일 ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // 헤더
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  pointBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginTop: 4,
  },
  pointText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
  },

  // 콘텐츠
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },

  // 메뉴
  menuGroup: {
    gap: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },

  // 푸터
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
