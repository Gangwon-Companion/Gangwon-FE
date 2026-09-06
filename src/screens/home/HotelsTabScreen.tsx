import ResponsiveGrid from '../../components/ResponsiveGrid';
import { openWebMap } from '../../utils/webMap';
import { Alert } from '../../utils/alert';
﻿import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { RootStackParamList } from '../../navigation/types';
import { buildRequestHeaders, getApiBaseUrl } from './api';

const THEME_COLOR = '#008A9A';
const BG_COLOR = '#F7F8FA';
const APP_IDENTIFIER = 'com.gangwon.gangwonfe';
const NAVER_MAP_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/kr/app/id311867728',
  android: 'market://details?id=com.nhn.android.nmap',
  default: 'https://map.naver.com',
});

type LodgingListItem = {
  lodgingId: number;
  name: string;
  thumbnailUrl: string | null;
  region: string | null;
  rating: number | null;
};

type LodgingListResponse = {
  totalCount: number;
  items: LodgingListItem[];
};

type LodgingDetailResponse = {
  photos: string[];
  reviews: unknown[];
  rating: number | null;
  reviewCount?: number;
  location: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  };
};

type Hotel = LodgingListItem & {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  reviewCount: number;
  imageUrl: string | null;
};

const formatLocationText = (hotel: Hotel) => {
  if (hotel.address && hotel.region) {
    if (hotel.address.includes(hotel.region)) return hotel.address;
    return `${hotel.address} · ${hotel.region}`;
  }

  return hotel.address ?? hotel.region ?? '주소 정보 없음';
};

export default function HotelsTabScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'HotelsTab'>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingHotelId, setOpeningHotelId] = useState<number | null>(null);

  const loadHotels = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = await getApiBaseUrl(signal);
      const params = new URLSearchParams({ page: '0', size: '50' });
      const keyword = debouncedSearchQuery.trim();
      if (keyword) params.set('keyword', keyword);

      const listResponse = await fetch(`${apiBaseUrl}/api/v1/lodgings?${params.toString()}`, {
        headers: await buildRequestHeaders(),
        signal,
      });
      if (!listResponse.ok) throw new Error(`숙소 목록 요청 실패 (${listResponse.status})`);

      const list: LodgingListResponse = await listResponse.json();
      if (signal?.aborted) return;

      const details = await Promise.all(
        list.items.map(async (item): Promise<Hotel> => {
          try {
            const detailResponse = await fetch(`${apiBaseUrl}/api/v1/lodgings/${item.lodgingId}`, {
              headers: await buildRequestHeaders(),
              signal,
            });
            if (!detailResponse.ok) throw new Error();
            const detail: LodgingDetailResponse = await detailResponse.json();
            return {
              ...item,
              address: detail.location.address,
              latitude: detail.location.latitude,
              longitude: detail.location.longitude,
              rating: detail.rating ?? item.rating,
              reviewCount: detail.reviewCount ?? detail.reviews.length,
              imageUrl: item.thumbnailUrl ?? detail.photos[0] ?? null,
            };
          } catch {
            return {
              ...item,
              address: null,
              latitude: null,
              longitude: null,
              reviewCount: 0,
              imageUrl: item.thumbnailUrl,
            };
          }
        }),
      );

      if (signal?.aborted) return;
      setHotels(details);
      setTotalCount(list.totalCount);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : '숙소 정보를 불러오지 못했습니다.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    void loadHotels(controller.signal);

    return () => controller.abort();
  }, [loadHotels]));

  const openNaverDirections = async (hotel: Hotel) => {
    if (Platform.OS === 'web') {
      openWebMap(hotel.name, hotel.address);
      return;
    }
    if (hotel.latitude === null || hotel.longitude === null) {
      Alert.alert('위치 정보 없음', '이 숙소의 위도와 경도를 확인할 수 없습니다.');
      return;
    }

    setOpeningHotelId(hotel.lodgingId);
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
        ['dlat', hotel.latitude.toString()],
        ['dlng', hotel.longitude.toString()],
        ['dname', hotel.name],
        ['appname', APP_IDENTIFIER],
      ]
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      try {
        await Linking.openURL(`nmap://route/car?${params}`);
      } catch {
        Alert.alert('네이버 지도 필요', '길찾기를 사용하려면 네이버 지도 앱을 설치해 주세요.', [
          { text: '취소', style: 'cancel' },
          { text: '설치하기', onPress: () => void Linking.openURL(NAVER_MAP_STORE_URL) },
        ]);
      }
    } catch {
      Alert.alert('위치 확인 실패', '현재 위치를 가져오지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setOpeningHotelId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>숙소</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="숙소 이름, 지역 검색"
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              onSubmitEditing={() => setDebouncedSearchQuery(searchQuery.trim())}
              clearButtonMode="while-editing"
            />
            {Platform.OS === 'android' && searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                accessibilityRole="button"
                accessibilityLabel="검색어 지우기"
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.resultHeader}>
            <Text style={styles.sectionTitle}>
              {debouncedSearchQuery ? '검색 결과' : '숙소 목록'}
            </Text>
            <Text style={styles.resultCount}>{totalCount}개 숙소</Text>
          </View>

          {loading && <ActivityIndicator size="large" color={THEME_COLOR} style={styles.loading} />}

          {!loading && error && (
            <View style={styles.messageBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => void loadHotels()}>
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && hotels.length === 0 && (
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? '검색 결과가 없습니다.' : '조건에 맞는 숙소가 없습니다.'}
            </Text>
          )}

<ResponsiveGrid>
          {hotels.map((hotel) => (
            <View key={hotel.lodgingId} style={styles.card}>
              {hotel.imageUrl ? (
                <Image source={{ uri: hotel.imageUrl }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.imagePlaceholder]}>
                  <Ionicons name="bed-outline" size={48} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{hotel.name}</Text>
                </View>

                <View style={styles.locationBlock}>
                  <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.locationText}>{formatLocationText(hotel)}</Text>
                </View>

                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#EAB308" />
                  <Text style={styles.ratingText}>{hotel.rating?.toFixed(1) ?? '-'}</Text>
                  <Text style={styles.reviewText}>({hotel.reviewCount}개 리뷰)</Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      openingHotelId === hotel.lodgingId && styles.buttonDisabled,
                    ]}
                    disabled={openingHotelId === hotel.lodgingId}
                    onPress={() => void openNaverDirections(hotel)}
                  >
                    {openingHotelId === hotel.lodgingId ? (
                      <ActivityIndicator size="small" color="#6B7280" />
                    ) : (
                      <>
                        <Ionicons name="navigate-outline" size={16} color="#6B7280" />
                        <Text style={styles.secondaryButtonText}>{Platform.OS === 'web' ? '웹 지도' : '길찾기'}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('HotelDetail', {
                      lodgingId: hotel.lodgingId,
                      name: hotel.name,
                      imageUrl: hotel.imageUrl,
                      rating: hotel.rating,
                      region: hotel.region,
                    })}
                  >
                    <Text style={styles.primaryButtonText}>상세보기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
</ResponsiveGrid>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: THEME_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    color: '#1F2933',
    fontSize: 14,
    paddingVertical: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  loading: {
    marginTop: 48,
  },
  messageBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: THEME_COLOR,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 48,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2933',
  },
  resultCount: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 192,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  cardBody: {
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2933',
    flex: 1,
    marginRight: 8,
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2933',
  },
  reviewText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: THEME_COLOR,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BG_COLOR,
    borderRadius: 12,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
