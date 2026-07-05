import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { getApiBaseUrl, requestHeaders } from './api';

type PopularPeriod = 'today' | 'week' | 'month';

type HotplaceItem = {
  hotplaceId: number;
  displayName: string;
  areaName: string | null;
  signguName: string | null;
  congestionRate: number | null;
  baseDate: string | null;
};

type HotplaceListResponse = {
  totalCount: number;
  items: HotplaceItem[];
};

const COLORS = {
  primary: '#008A9A',
  primaryLight: '#BFE8E2',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#1F2933',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  red: '#EF4444',
};

const TAB_ITEMS = [
  { label: '테마', route: 'ThemeTab' },
  { label: '숙소', route: 'HotelsTab' },
  { label: '맛집', route: 'RestaurantsTab' },
] as const;

const PERIOD_OPTIONS: Array<{ key: PopularPeriod; label: string }> = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '일주일' },
  { key: 'month', label: '한달' },
];

const DEALS = [
  {
    image: 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=300&h=200&fit=crop',
    title: '숙박 특가',
    discount: '30% 할인',
  },
  {
    image: 'https://images.unsplash.com/photo-1663530761401-15eefb544889?w=300&h=200&fit=crop',
    title: '맛집 이벤트',
    discount: '20% 할인',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [popularPeriod, setPopularPeriod] = useState<PopularPeriod>('today');
  const [popularPlaces, setPopularPlaces] = useState<HotplaceItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);

  const openNaverMap = useCallback(async (place: HotplaceItem) => {
    const query = [place.displayName, place.areaName].filter(Boolean).join(' ');
    const url = `https://map.naver.com/v5/search/${encodeURIComponent(query)}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('네이버 지도를 열지 못했습니다.', error);
    }
  }, []);

  const loadPopularPlaces = useCallback(async (period: PopularPeriod, signal?: AbortSignal) => {
    setPopularLoading(true);
    setPopularError(null);

    try {
      const apiBaseUrl = await getApiBaseUrl(signal);
      const response = await fetch(`${apiBaseUrl}/api/v1/promotions/hotplace?period=${period}`, {
        headers: requestHeaders,
        signal,
      });
      if (!response.ok) throw new Error(`인기 여행지 요청 실패 (${response.status})`);

      const data: HotplaceListResponse = await response.json();
      if (signal?.aborted) return;
      setPopularPlaces(data.items);
    } catch (loadError) {
      if (signal?.aborted) return;
      setPopularError(loadError instanceof Error ? loadError.message : '인기 여행지를 불러오지 못했습니다.');
    } finally {
      if (!signal?.aborted) setPopularLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadPopularPlaces(popularPeriod, controller.signal);

    return () => controller.abort();
  }, [popularPeriod, loadPopularPlaces]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>안녕하세요, 여행자님</Text>
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

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="여행지, 숙소를 검색하세요..."
              placeholderTextColor={COLORS.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        <View style={styles.content}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScroll}
            contentContainerStyle={styles.tabContent}
          >
            {TAB_ITEMS.map((tab, index) => (
              <TouchableOpacity
                key={tab.route}
                onPress={() => {
                  setActiveTab(index);
                  navigation.navigate(tab.route);
                }}
                style={[styles.tabBtn, activeTab === index && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.card}>
            <View style={styles.upcomingHeader}>
              <View style={styles.calendarIcon}>
                <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>다가오는 여행</Text>
                <Text style={styles.cardSub}>이번 주</Text>
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

          <View style={styles.promoBanner}>
            <Text style={styles.promoTitle}>강원도 여행</Text>
            <Text style={styles.promoSub}>인기 숙소 패키지</Text>
            <TouchableOpacity style={styles.promoBtnWrap}>
              <Text style={styles.promoBtn}>살펴보기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>인기 여행지</Text>
            <View style={styles.periodSelector}>
              {PERIOD_OPTIONS.map((option) => {
                const isActive = popularPeriod === option.key;

                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setPopularPeriod(option.key)}
                    style={[styles.periodChip, isActive && styles.periodChipActive]}
                  >
                    <Text style={[styles.periodChipText, isActive && styles.periodChipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {popularLoading && <ActivityIndicator size="large" color={COLORS.primary} style={styles.popularLoading} />}

          {!popularLoading && popularError && (
            <View style={styles.popularMessageBox}>
              <Text style={styles.popularErrorText}>{popularError}</Text>
              <TouchableOpacity
                style={styles.popularRetryButton}
                onPress={() => void loadPopularPlaces(popularPeriod)}
              >
                <Text style={styles.popularRetryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          )}

          {!popularLoading && !popularError && popularPlaces.length === 0 && (
            <Text style={styles.popularEmptyText}>표시할 인기 여행지가 없습니다.</Text>
          )}

          {!popularLoading && !popularError && popularPlaces.map((place) => (
            <TouchableOpacity
              key={place.hotplaceId}
              activeOpacity={0.85}
              onPress={() => void openNaverMap(place)}
              style={styles.placeCard}
            >
              <View style={[styles.placeImage, styles.placeImagePlaceholder]}>
                <Ionicons name="map-outline" size={36} color={COLORS.textMuted} />
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeTitle}>{place.displayName}</Text>
                <View style={styles.placeRow}>
                  <Text style={styles.placeLocation}>{place.areaName}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>할인 프로모션</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 24,
  },
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 1,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSub,
  },
  periodChipTextActive: {
    color: COLORS.white,
  },
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
  placeImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  popularLoading: {
    marginVertical: 24,
  },
  popularMessageBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  popularErrorText: {
    color: COLORS.red,
    fontSize: 14,
    textAlign: 'center',
  },
  popularRetryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  popularRetryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  popularEmptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
