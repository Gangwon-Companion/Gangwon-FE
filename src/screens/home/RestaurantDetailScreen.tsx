import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { RootStackParamList } from '../../navigation/types';
import {
  ApiResponseError,
  createPlaceReview,
  deletePlaceReview,
  getApiBaseUrl,
  PlaceReview,
  requestHeaders,
  ReviewPayload,
  updatePlaceReview,
} from './api';
import ReviewSection from './components/ReviewSection';

type Props = NativeStackScreenProps<RootStackParamList, 'RestaurantDetail'>;
const PAGE_HORIZONTAL_PADDING = 40;

type RestaurantDetailResponse = {
  restaurantId?: number;
  name?: string | null;
  menuType?: string | null;
  rating?: number | null;
  region?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photos?: string[];
  reviews?: PlaceReview[];
  reviewCount?: number;
  firstMenu?: string | null;
  treatMenu?: string | null;
  openTime?: string | null;
  restDate?: string | null;
  parking?: string | null;
  infoCenter?: string | null;
};

type ApiErrorResponse = {
  message?: string;
};

const COLORS = {
  primary: '#008A9A',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#1F2933',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  red: '#EF4444',
};
const APP_IDENTIFIER = 'com.gangwon.gangwonfe';
const INFO_FALLBACK = '정보 제공 없음';
const NAVER_MAP_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/kr/app/id311867728',
  android: 'market://details?id=com.nhn.android.nmap',
  default: 'https://map.naver.com',
});

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  const displayValue = value === null || value === undefined || value === '' ? INFO_FALLBACK : value;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, displayValue === INFO_FALLBACK && styles.infoValueMuted]}>{displayValue}</Text>
    </View>
  );
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json() as ApiErrorResponse;
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export default function RestaurantDetailScreen({ navigation, route }: Props) {
  const { restaurantId, name, imageUrl, menuType, rating, region } = route.params;
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(280, width - PAGE_HORIZONTAL_PADDING);
  const [detail, setDetail] = useState<RestaurantDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingMap, setOpeningMap] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const imageUrls = useMemo(() => {
    const sourcePhotos = detail ? detail.photos ?? [] : [imageUrl];
    return [...new Set(sourcePhotos.filter((item): item is string => Boolean(item)))];
  }, [detail?.photos, imageUrl]);
  const displayName = detail?.name ?? name;
  const displayMenuType = detail?.menuType ?? menuType ?? null;
  const displayRating = detail?.rating ?? rating;
  const displayRegion = detail?.region ?? region ?? null;
  const address = detail?.address ?? displayRegion;
  const latitude = detail?.latitude ?? null;
  const longitude = detail?.longitude ?? null;
  const reviews = detail?.reviews ?? [];
  const reviewCount = detail?.reviewCount ?? reviews.length;

  const loadDetail = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const apiBaseUrl = await getApiBaseUrl(signal);
      const response = await fetch(`${apiBaseUrl}/api/v1/restaurants/${restaurantId}`, {
        headers: requestHeaders,
        signal,
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, `맛집 상세 요청 실패 (${response.status})`));
      }
      const data: RestaurantDetailResponse = await response.json();
      if (!signal?.aborted) setDetail(data);
    } catch (loadError) {
      if (!signal?.aborted) {
        setError(loadError instanceof Error ? loadError.message : '맛집 상세 정보를 불러오지 못했습니다.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadDetail(controller.signal);
    return () => controller.abort();
  }, [loadDetail]);

  useEffect(() => {
    setImageIndex(0);
  }, [imageUrls.length]);

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
    const nextIndex = Math.max(0, Math.min(imageUrls.length - 1, rawIndex));
    setImageIndex(nextIndex);
  };

  const runReviewAction = async (action: () => Promise<void>) => {
    setReviewSubmitting(true);
    try {
      await action();
      await loadDetail();
    } catch (reviewError) {
      const message = reviewError instanceof ApiResponseError && reviewError.status === 401
        ? '로그인 후 이용할 수 있습니다.'
        : reviewError instanceof Error
          ? reviewError.message
          : '리뷰 요청 처리 중 오류가 발생했습니다.';
      Alert.alert('리뷰 처리 실패', message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const createReview = (payload: ReviewPayload) => (
    runReviewAction(() => createPlaceReview('restaurants', restaurantId, payload).then(() => undefined))
  );

  const updateReview = (reviewId: number, payload: ReviewPayload) => (
    runReviewAction(() => updatePlaceReview('restaurants', restaurantId, reviewId, payload).then(() => undefined))
  );

  const deleteReview = (reviewId: number) => (
    runReviewAction(() => deletePlaceReview('restaurants', restaurantId, reviewId))
  );

  const openDirections = async () => {
    if (latitude === null || longitude === null) {
      Alert.alert('좌표 정보 없음', '이 맛집의 위도와 경도를 확인할 수 없습니다.');
      return;
    }

    setOpeningMap(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('위치 권한 필요', '현재 위치에서 길찾기를 하려면 위치 권한을 허용해 주세요.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      const params = [
        ['slat', current.coords.latitude.toString()],
        ['slng', current.coords.longitude.toString()],
        ['sname', '현재 위치'],
        ['dlat', latitude.toString()],
        ['dlng', longitude.toString()],
        ['dname', displayName],
        ['appname', APP_IDENTIFIER],
      ].map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');

      try {
        await Linking.openURL(`nmap://route/car?${params}`);
      } catch {
        Alert.alert('네이버 지도 앱 필요', '길찾기를 이용하려면 네이버 지도 앱을 설치해 주세요.', [
          { text: '취소', style: 'cancel' },
          { text: '설치하기', onPress: () => void Linking.openURL(NAVER_MAP_STORE_URL) },
        ]);
      }
    } catch {
      Alert.alert('위치 확인 실패', '현재 위치를 가져오지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setOpeningMap(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.headerSub}>맛집 상세 정보</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator
        contentContainerStyle={styles.content}
      >
        {imageUrls.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageScroll}
              scrollEventThrottle={16}
              style={styles.imageSlider}
            >
              {imageUrls.map((photo) => (
                <Image
                  key={photo}
                  source={{ uri: photo }}
                  style={[styles.heroImage, { width: imageWidth }]}
                />
              ))}
            </ScrollView>
            {imageUrls.length > 1 ? (
              <View style={styles.imageFooter}>
                <View style={styles.dots}>
                  {imageUrls.map((photo, index) => (
                    <View
                      key={photo}
                      style={[styles.dot, index === imageIndex && styles.dotActive]}
                    />
                  ))}
                </View>
                <Text style={styles.imageCount}>{imageIndex + 1} / {imageUrls.length}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { width: imageWidth }]}>
            <Ionicons name="restaurant-outline" size={52} color={COLORS.textMuted} />
            <Text style={styles.placeholderText}>등록된 사진이 없습니다</Text>
          </View>
        )}

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{displayName}</Text>
          <View style={styles.inlineInfo}>
            <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.inlineInfoText}>
              {displayMenuType ?? '메뉴 정보 없음'} · {address ?? '주소 정보 없음'}
            </Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color="#EAB308" />
              <Text style={styles.badgeText}>{displayRating?.toFixed(1) ?? '-'}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>{reviewCount}개 리뷰</Text>
            </View>
          </View>
        </View>

        {loading && <ActivityIndicator color={COLORS.primary} style={styles.loading} />}
        {!loading && error ? (
          <View style={styles.messageBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void loadDetail()} style={styles.retryButton}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <InfoRow label="지역" value={displayRegion} />
          <InfoRow label="업종" value={displayMenuType} />
          <InfoRow label="주소" value={address} />
          <InfoRow label="대표 메뉴" value={detail?.firstMenu} />
          <InfoRow label="취급 메뉴" value={detail?.treatMenu} />
          <InfoRow label="영업시간" value={detail?.openTime} />
          <InfoRow label="휴무일" value={detail?.restDate} />
          <InfoRow label="주차" value={detail?.parking} />
          <InfoRow label="문의" value={detail?.infoCenter} />
        </View>

        <ReviewSection
          reviews={reviews}
          reviewCount={reviewCount}
          submitting={reviewSubmitting}
          onCreate={createReview}
          onUpdate={updateReview}
          onDelete={deleteReview}
        />

        <TouchableOpacity
          onPress={() => void openDirections()}
          disabled={openingMap}
          style={[styles.mapButton, openingMap && styles.buttonDisabled]}
        >
          {openingMap ? <ActivityIndicator color={COLORS.white} /> : (
            <>
              <Ionicons name="navigate-outline" size={18} color={COLORS.white} />
              <Text style={styles.mapButtonText}>길찾기</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTextBox: { flex: 1, minWidth: 0 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  imageSlider: { borderRadius: 12, backgroundColor: '#EDF1F3' },
  heroImage: { height: 240, borderRadius: 12, backgroundColor: COLORS.border },
  imagePlaceholder: {
    height: 220,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EDF1F3',
  },
  placeholderText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  imageFooter: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 2,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 18, backgroundColor: COLORS.primary },
  imageCount: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  titleBlock: { paddingVertical: 18 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '800', lineHeight: 29 },
  inlineInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10 },
  inlineInfoText: { flex: 1, color: COLORS.textSub, fontSize: 14, lineHeight: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: {
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: COLORS.bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
  },
  badgeText: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' },
  loading: { marginVertical: 24 },
  messageBox: { alignItems: 'center', gap: 12, padding: 20 },
  errorText: { color: COLORS.red, fontSize: 14, textAlign: 'center' },
  retryButton: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: COLORS.white, fontWeight: '700' },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  infoRow: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F4',
  },
  infoLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  infoValue: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  infoValueMuted: { color: COLORS.textMuted },
  mapButton: {
    minHeight: 50,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  mapButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
  buttonDisabled: { opacity: 0.7 },
});
