import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { useContentWidth, useDesktopLayout } from '../../hooks/useContentWidth';
import ResponsiveGrid from '../../components/ResponsiveGrid';

type PromotionBanner = {
  id: number;
  category: string;
  title: string;
  description: string;
  region: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  linkUrl: string | null;
};

type PromotionBannerListResponse = {
  festivalAvailable: boolean;
  message: string;
  items: PromotionBanner[];
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
  {
    label: '테마별 관광지 보기',
    description: '여행 취향에 맞는 강원 관광지를 찾아보세요',
    icon: 'sparkles-outline',
    route: 'ThemeTab',
  },
  {
    label: '숙소',
    description: '강원 지역 숙소 목록을 확인해보세요',
    icon: 'bed-outline',
    route: 'HotelsTab',
  },
  {
    label: '음식점',
    description: '식당과 카페 정보를 함께 둘러보세요',
    icon: 'restaurant-outline',
    route: 'RestaurantsTab',
  },
] as const;

export default function HomeScreen() {
  const desktop = useDesktopLayout();
  const width = useContentWidth();
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const [banners, setBanners] = useState<PromotionBanner[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const [promotionsError, setPromotionsError] = useState<string | null>(null);

  const openLink = useCallback(async (url: string | null) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('링크를 열지 못했습니다.', error);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadPromotions = async () => {
      setPromotionsLoading(true);
      setPromotionsError(null);
      try {
        const apiBaseUrl = await getApiBaseUrl(controller.signal);
        const bannerResponse = await fetch(`${apiBaseUrl}/api/v1/banners?limit=5`, {
          headers: requestHeaders,
          signal: controller.signal,
        });

        if (!bannerResponse.ok) throw new Error(`행사 배너 요청 실패 (${bannerResponse.status})`);
        const bannerData: PromotionBannerListResponse = await bannerResponse.json();
        if (!controller.signal.aborted) {
          setBanners(bannerData.items ?? []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPromotionsError(error instanceof Error ? error.message : '프로모션을 불러오지 못했습니다.');
        }
      } finally {
        if (!controller.signal.aborted) setPromotionsLoading(false);
      }
    };

    void loadPromotions();
    return () => controller.abort();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: (desktop ? 0 : tabBarHeight) + 24 }]}
      >
        <View style={[styles.header, desktop && styles.desktopHeader]}>
          <View style={styles.headerTop}>
            <View style={styles.titleBox}>
              <Text style={[styles.headerTitle, desktop && styles.desktopTitle]}>어디로 떠나볼까요?</Text>
              <Text style={styles.headerDescription}>
                테마 관광지, 숙소, 음식점 정보를 한곳에서 확인해보세요.
              </Text>
            </View>
            <Text style={styles.brandName}>강원동행</Text>
          </View>
        </View>

        <View style={styles.content}>
          <ResponsiveGrid>
            {TAB_ITEMS.map((tab, index) => (
              <TouchableOpacity
                key={tab.route}
                onPress={() => navigation.navigate(tab.route)}
                style={[styles.actionCard, index === 0 && styles.actionCardWide, desktop && styles.desktopActionCard, !desktop && { marginBottom: 12 }]}
                activeOpacity={0.86}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={tab.icon as any} size={22} color={COLORS.primary} />
                </View>
                <View style={styles.actionTextBox}>
                  <Text style={styles.actionTitle}>{tab.label}</Text>
                  <Text style={styles.actionDescription}>{tab.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </ResponsiveGrid>

          {promotionsLoading && <ActivityIndicator color={COLORS.primary} style={styles.bannerLoading} />}
          {!promotionsLoading && banners.length > 0 && (
            <View style={styles.bannerSection}>
              <Text style={styles.sectionTitle}>장소 배너</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerScroll}>
                {banners.map((banner) => (
                  <TouchableOpacity
                    key={banner.id}
                    activeOpacity={banner.linkUrl ? 0.85 : 1}
                    onPress={() => void openLink(banner.linkUrl)}
                    style={[styles.promoBanner, { width: desktop ? 370 : Math.min(310, width - 48) }]}
                  >
                    {banner.imageUrl ? <Image source={{ uri: banner.imageUrl }} style={styles.bannerImage} /> : null}
                    <View style={styles.bannerOverlay} />
                    <View style={styles.bannerContent}>
                      <Text style={styles.bannerMeta}>{banner.region} · {banner.category}</Text>
                      <Text style={styles.promoTitle} numberOfLines={1}>{banner.title}</Text>
                      <Text style={styles.promoSub} numberOfLines={2}>{banner.description}</Text>
                      <Text style={styles.bannerDate}>{banner.startDate} ~ {banner.endDate}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {!promotionsLoading && promotionsError && (
            <View style={styles.promotionErrorBox}>
              <Ionicons name="information-circle-outline" size={18} color="#92400E" />
              <View style={styles.promotionErrorCopy}>
                <Text style={styles.promotionErrorTitle}>행사 정보를 불러오지 못했어요</Text>
                <Text style={styles.promotionError}>잠시 후 다시 확인해 주세요.</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  desktopHeader: { paddingTop: 60, paddingBottom: 60, paddingHorizontal: 40, marginTop: 28, marginHorizontal: 24, borderRadius: 24 },
  desktopTitle: { fontSize: 38, lineHeight: 50 },
  desktopActionCard: { flexDirection: 'column', alignItems: 'flex-start', minHeight: 208, padding: 24 },
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
  },
  titleBox: {
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 16,
  },
  greeting: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
  },
  headerDescription: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  actionGrid: {
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    minHeight: 86,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardWide: {
    minHeight: 96,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextBox: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 5,
  },
  actionDescription: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 18,
  },
  bannerSection: {
    marginTop: 2,
  },
  promoBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    width: 310,
    minHeight: 180,
    marginRight: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bannerScroll: { marginBottom: 24 },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 80, 90, 0.62)',
  },
  bannerContent: { padding: 20 },
  bannerMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginBottom: 6,
  },
  bannerDate: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
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
  bannerLoading: { marginVertical: 32 },
  promotionErrorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'center', width: '100%', maxWidth: 520, padding: 16, marginBottom: 24, borderRadius: 14, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  promotionErrorCopy: { flex: 1 },
  promotionErrorTitle: { color: '#78350F', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  promotionError: { color: '#92400E', fontSize: 12 },
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
});
