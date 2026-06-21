import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── 색상 상수 ───────────────────────────────────────────────
const COLORS = {
  primary: '#008A9A',
  primaryLight: '#BFE8E2',
  primaryGradientEnd: '#00A5B8',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#1F2933',
  textMuted: '#9CA3AF',
  textSub: '#6B7280',
  border: '#E5E7EB',
  red: '#EF4444',
};

// ─── 더미 데이터 ──────────────────────────────────────────────
const TABS = ['테마', '호텔', '맛집'];

const POPULAR_PLACES = [
  {
    image: 'https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=400&h=300&fit=crop',
    title: '몰디브 천국',
    location: '몰디브',
    rating: '4.9',
  },
  {
    image: 'https://images.unsplash.com/photo-1600582910964-5b7c109e6868?w=400&h=300&fit=crop',
    title: '발리 비치 리조트',
    location: '인도네시아',
    rating: '4.8',
  },
];

const DEALS = [
  {
    image: 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=300&h=200&fit=crop',
    title: '럭셔리 호텔',
    discount: '30% 할인',
  },
  {
    image: 'https://images.unsplash.com/photo-1663530761401-15eefb544889?w=300&h=200&fit=crop',
    title: '파인 다이닝',
    discount: '20% 할인',
  },
];

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── 헤더 영역 ── */}
        <View style={styles.header}>
          {/* 인사말 + 프로필 */}
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>안녕하세요, 철수님</Text>
              <Text style={styles.headerTitle}>어디로 떠나볼까요?</Text>
            </View>
            <View style={styles.profileArea}>
              <View style={styles.pointBox}>
                <Text style={styles.pointLabel}>포인트</Text>
                <Text style={styles.pointValue}>2,340</Text>
              </View>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' }}
                style={styles.avatar}
              />
            </View>
          </View>

          {/* 검색바 */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="여행지, 호텔을 검색하세요..."
              placeholderTextColor={COLORS.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* ── 콘텐츠 영역 ── */}
        <View style={styles.content}>

          {/* 탭 필터 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScroll}
            contentContainerStyle={styles.tabContent}
          >
            {TABS.map((tab, index) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(index)}
                style={[styles.tabBtn, activeTab === index && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 다가오는 여행 카드 */}
          <View style={styles.card}>
            <View style={styles.upcomingHeader}>
              <View style={styles.calendarIcon}>
                <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>다가오는 여행</Text>
                <Text style={styles.cardSub}>제주도</Text>
              </View>
            </View>
            <Text style={styles.dateText}>2026년 6월 15일 - 6월 18일</Text>
            <View style={styles.upcomingBtns}>
              <TouchableOpacity style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>자세히 보기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary}>
                <Text style={styles.btnSecondaryText}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 프로모션 배너 */}
          <View style={styles.promoBanner}>
            <Text style={styles.promoTitle}>강원도 여행</Text>
            <Text style={styles.promoSub}>특별 여름 패키지</Text>
            <TouchableOpacity style={styles.promoBtnWrap}>
              <Text style={styles.promoBtn}>둘러보기</Text>
            </TouchableOpacity>
          </View>

          {/* 오늘의 인기 여행지 */}
          <Text style={styles.sectionTitle}>오늘의 인기 여행지</Text>
          {POPULAR_PLACES.map((place, index) => (
            <View key={index} style={styles.placeCard}>
              <Image source={{ uri: place.image }} style={styles.placeImage} />
              <View style={styles.placeInfo}>
                <Text style={styles.placeTitle}>{place.title}</Text>
                <View style={styles.placeRow}>
                  <Text style={styles.placeLocation}>{place.location}</Text>
                  <Text style={styles.placeRating}>★ {place.rating}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* 특가 프로모션 */}
          <Text style={styles.sectionTitle}>특가 프로모션</Text>
          <View style={styles.dealGrid}>
            {DEALS.map((deal, index) => (
              <View key={index} style={styles.dealCard}>
                <View>
                  <Image source={{ uri: deal.image }} style={styles.dealImage} />
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{deal.discount}</Text>
                  </View>
                </View>
                <View style={styles.dealInfo}>
                  <Text style={styles.dealTitle}>{deal.title}</Text>
                </View>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── 스타일 ────────────────────────────────────────────────────
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
    paddingBottom: 100, // 하단 탭바 여백
  },

  // 헤더
  header: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '600',
  },
  profileArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointBox: {
    alignItems: 'flex-end',
  },
  pointLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
  },
  pointValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
  },

  // 검색바
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },

  // 콘텐츠
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  // 탭
  tabScroll: {
    marginBottom: 20,
  },
  tabContent: {
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: COLORS.white,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.white,
  },

  // 카드 공통
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // 다가오는 여행
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  calendarIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 13,
    color: COLORS.textSub,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSub,
    marginBottom: 12,
  },
  upcomingBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  btnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: COLORS.textSub,
    fontSize: 14,
    fontWeight: '500',
  },

  // 섹션 타이틀
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },

  // 프로모션 배너
  promoBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  promoTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  promoSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginBottom: 16,
  },
  promoBtnWrap: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 100,
  },
  promoBtn: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },

  // 인기 여행지
  placeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  placeImage: {
    width: '100%',
    height: 160,
  },
  placeInfo: {
    padding: 16,
  },
  placeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  placeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeLocation: {
    fontSize: 13,
    color: COLORS.textSub,
  },
  placeRating: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // 특가 딜
  dealGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  dealCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dealImage: {
    width: '100%',
    height: 110,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.red,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  dealInfo: {
    padding: 12,
  },
  dealTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
});
