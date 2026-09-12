import ResponsiveGrid from '../../components/ResponsiveGrid';
import { subscribePlaceReviewChanged } from '../../utils/placeReviewEvents';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { RootStackParamList } from '../../navigation/types';
import { ApiResponseError, DestinationListItem, fetchDestinationDetail, fetchThemeDestinations, getReviewSummary } from './api';

type Props = NativeStackScreenProps<RootStackParamList, 'ThemeDestinations'>;

const PAGE_SIZE = 10;

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

type DestinationListItemWithReview = DestinationListItem & {
  rating: number | null;
  reviewCount: number;
};

export default function ThemeDestinationListScreen({ navigation, route }: Props) {
  const { themeId, themeName = '테마 여행지' } = route.params;
  const [destinations, setDestinations] = useState<DestinationListItemWithReview[]>([]);
  const [pet, setPet] = useState(false);
  const [accessibility, setAccessibility] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(destinations.length / PAGE_SIZE));
  const pagedDestinations = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return destinations.slice(start, start + PAGE_SIZE);
  }, [destinations, page]);

  const loadDestinations = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchThemeDestinations(themeId, {
        pet,
        accessibility,
        signal,
      });
      if (signal?.aborted) return;
      const hydratedDestinations = await Promise.all(
        data.destinationList.map(async (destination): Promise<DestinationListItemWithReview> => {
          try {
            const detail = await fetchDestinationDetail(destination.id, {
              pet,
              accessibility,
              signal,
            });
            const reviewSummary = getReviewSummary(detail.reviews, detail.rating ?? destination.rating, detail.reviewCount);
            return {
              ...destination,
              rating: reviewSummary.rating,
              reviewCount: reviewSummary.reviewCount,
            };
          } catch (detailError) {
            const shouldFallback =
              detailError instanceof ApiResponseError
              && detailError.status === 404
              && (pet || accessibility);

            if (shouldFallback) {
              try {
                const detail = await fetchDestinationDetail(destination.id, {
                  pet: false,
                  accessibility: false,
                  signal,
                });
                const reviewSummary = getReviewSummary(detail.reviews, detail.rating ?? destination.rating, detail.reviewCount);
                return {
                  ...destination,
                  rating: reviewSummary.rating,
                  reviewCount: reviewSummary.reviewCount,
                };
              } catch {
                // 상세 데이터가 아직 없으면 목록 데이터만 사용한다.
              }
            }

            return {
              ...destination,
              rating: destination.rating ?? null,
              reviewCount: destination.reviewCount ?? 0,
            };
          }
        }),
      );

      if (signal?.aborted) return;
      setDestinations(hydratedDestinations);
      setPage(1);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : '장소 목록을 불러오지 못했습니다.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [accessibility, pet, themeId]);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    void loadDestinations(controller.signal);

    return () => controller.abort();
  }, [loadDestinations]));

  useEffect(() => subscribePlaceReviewChanged((change) => {
    if (change.resource !== 'destinations') return;
    void loadDestinations();
  }), [loadDestinations]);

  const openDetail = useCallback((destination: DestinationListItem) => {
    navigation.navigate('DestinationDetail', {
      destinationId: destination.id,
      title: destination.title,
      firstImage: destination.firstImage,
      pet,
      accessibility,
    });
  }, [accessibility, navigation, pet]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>{themeName}</Text>
          <Text style={styles.headerSub}>테마에 맞는 장소를 둘러보세요</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>장소 목록</Text>
            <Text style={styles.resultCount}>{destinations.length}개 장소</Text>
          </View>
          <TouchableOpacity
            onPress={() => void loadDestinations()}
            style={styles.refreshButton}
            accessibilityRole="button"
            accessibilityLabel="장소 목록 새로고침"
          >
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setPet(false);
              setAccessibility(false);
            }}
            style={[styles.filterChip, !pet && !accessibility && styles.filterChipActive]}
          >
            <Ionicons
              name="list-outline"
              size={16}
              color={!pet && !accessibility ? COLORS.white : COLORS.textSub}
            />
            <Text style={[styles.filterText, !pet && !accessibility && styles.filterTextActive]}>전체</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setPet((current) => !current)}
            style={[styles.filterChip, pet && styles.filterChipActive]}
          >
            <Ionicons
              name="paw-outline"
              size={16}
              color={pet ? COLORS.white : COLORS.textSub}
            />
            <Text style={[styles.filterText, pet && styles.filterTextActive]}>반려동물 동반</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setAccessibility((current) => !current)}
            style={[styles.filterChip, accessibility && styles.filterChipActive]}
          >
            <Ionicons
              name="accessibility-outline"
              size={16}
              color={accessibility ? COLORS.white : COLORS.textSub}
            />
            <Text style={[styles.filterText, accessibility && styles.filterTextActive]}>무장애</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.messageBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.messageText}>장소를 불러오는 중입니다.</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.messageBox}>
            <Ionicons name="alert-circle-outline" size={36} color={COLORS.red} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadDestinations()}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && destinations.length === 0 && (
          <View style={styles.messageBox}>
            <Ionicons name="image-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.messageText}>조건에 맞는 장소가 없습니다.</Text>
          </View>
        )}

<ResponsiveGrid>
        {!loading && !error && pagedDestinations.map((destination) => (
          <TouchableOpacity
            key={destination.id}
            activeOpacity={0.86}
            style={styles.destinationCard}
            onPress={() => openDetail(destination)}
          >
            {destination.firstImage ? (
              <Image source={{ uri: destination.firstImage }} style={styles.destinationImage} />
            ) : (
              <View style={[styles.destinationImage, styles.imagePlaceholder]}>
                <Ionicons name="image-outline" size={34} color={COLORS.textMuted} />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.destinationTitle}>{destination.title}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#EAB308" />
                <Text style={styles.ratingText}>{destination.rating?.toFixed(1) ?? '-'}</Text>
                <Text style={styles.reviewText}>({destination.reviewCount}개 리뷰)</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
</ResponsiveGrid>

        {!loading && !error && destinations.length > 0 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
              disabled={page === 1}
              onPress={() => setPage((current) => Math.max(1, current - 1))}
            >
              <Ionicons name="chevron-back" size={18} color={page === 1 ? COLORS.textMuted : COLORS.primary} />
              <Text style={[styles.pageButtonText, page === 1 && styles.pageButtonTextDisabled]}>이전</Text>
            </TouchableOpacity>

            <Text style={styles.pageText}>{page} / {totalPages}</Text>

            <TouchableOpacity
              style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
              disabled={page === totalPages}
              onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              <Text style={[styles.pageButtonText, page === totalPages && styles.pageButtonTextDisabled]}>다음</Text>
              <Ionicons name="chevron-forward" size={18} color={page === totalPages ? COLORS.textMuted : COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBox: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  resultCount: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  filterChip: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSub,
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  messageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  messageText: {
    color: COLORS.textSub,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  destinationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  destinationImage: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF1F3',
  },
  cardBody: {
    padding: 16,
  },
  destinationTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  ratingText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  pagination: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  pageButton: {
    minWidth: 88,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  pageButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  pageText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
