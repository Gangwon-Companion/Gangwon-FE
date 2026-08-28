import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

import { RootStackParamList } from '../../navigation/types';
import { ApiResponseError, DestinationDetail, fetchDestinationDetail } from './api';

type Props = NativeStackScreenProps<RootStackParamList, 'DestinationDetail'>;

const PAGE_HORIZONTAL_PADDING = 40;

const COLORS = {
  primary: '#008A9A',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#1F2933',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  red: '#EF4444',
  warningBg: '#FFF7E6',
  warningText: '#9A5B00',
};

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractUrl(value?: string | null) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return null;

  const hrefMatch = normalizedValue.match(/href\s*=\s*["']([^"']+)["']/i);
  const rawUrl = hrefMatch?.[1] ?? normalizedValue.replace(/<[^>]*>/g, '');
  const decodedUrl = decodeHtmlEntities(rawUrl).trim();

  if (!decodedUrl) return null;
  if (/^https?:\/\//i.test(decodedUrl)) return decodedUrl;

  return `https://${decodedUrl}`;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return null;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{normalizedValue}</Text>
    </View>
  );
}

function EmptySectionText({ children }: { children: string }) {
  return <Text style={styles.emptySectionText}>{children}</Text>;
}

export default function DestinationDetailScreen({ navigation, route }: Props) {
  const { destinationId, title, firstImage, pet, accessibility } = route.params;
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(280, width - PAGE_HORIZONTAL_PADDING);
  const [detail, setDetail] = useState<DestinationDetail | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [detailUnavailable, setDetailUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    setFallbackNotice(null);
    setDetailUnavailable(false);
    setImageIndex(0);

    try {
      const data = await fetchDestinationDetail(destinationId, {
        pet,
        accessibility,
        signal,
      });
      if (signal?.aborted) return;
      setDetail(data);
    } catch (loadError) {
      if (signal?.aborted) return;

      const shouldFallback =
        loadError instanceof ApiResponseError
        && loadError.status === 404
        && (pet || accessibility);

      if (shouldFallback) {
        try {
          const fallbackData = await fetchDestinationDetail(destinationId, {
            pet: false,
            accessibility: false,
            signal,
          });
          if (signal?.aborted) return;
          setDetail(fallbackData);
          setFallbackNotice('선택한 필터의 상세 정보가 없어 기본 상세 정보로 보여드려요.');
          return;
        } catch (fallbackError) {
          if (signal?.aborted) return;
          if (fallbackError instanceof ApiResponseError && fallbackError.status === 404) {
            setDetail(null);
            setDetailUnavailable(true);
            setFallbackNotice('이 장소의 상세 데이터가 아직 준비되지 않았어요. 목록에서 받은 정보만 보여드려요.');
            return;
          }
          setError(fallbackError instanceof Error ? fallbackError.message : '장소 상세 정보를 불러오지 못했습니다.');
          return;
        }
      }

      if (loadError instanceof ApiResponseError && loadError.status === 404) {
        setDetail(null);
        setDetailUnavailable(true);
        setFallbackNotice('이 장소의 상세 데이터가 아직 준비되지 않았어요. 목록에서 받은 정보만 보여드려요.');
        return;
      }

      setError(loadError instanceof Error ? loadError.message : '장소 상세 정보를 불러오지 못했습니다.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [accessibility, destinationId, pet]);

  useEffect(() => {
    const controller = new AbortController();
    void loadDetail(controller.signal);

    return () => controller.abort();
  }, [loadDetail]);

  const imageUrls = useMemo(() => {
    const detailImages = detail?.destinationImageList?.map((item) => (
      item.originImgUrl
    )) ?? [];

    return unique([...detailImages, firstImage]);
  }, [detail, firstImage]);

  const displayTitle = detail?.title ?? title;
  const address = [detail?.addr1, detail?.addr2].map(normalizeText).filter(Boolean).join(' ');
  const homepageUrl = extractUrl(detail?.homepage);
  const hasBasicInfo = Boolean(
    normalizeText(detail?.tel)
    || normalizeText(detail?.usageTime)
    || normalizeText(detail?.restDate)
    || normalizeText(detail?.parking)
    || normalizeText(detail?.inquiry)
    || homepageUrl,
  );

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
    const nextIndex = Math.max(0, Math.min(imageUrls.length - 1, rawIndex));
    setImageIndex(nextIndex);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>{displayTitle}</Text>
          <Text style={styles.headerSub}>장소 상세 정보</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator
        contentContainerStyle={styles.scrollContent}
      >
        {loading && (
          <View style={styles.messageBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.messageText}>상세 정보를 불러오는 중입니다.</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.messageBox}>
            <Ionicons name="alert-circle-outline" size={36} color={COLORS.red} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadDetail()}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (detail || detailUnavailable) && (
          <>
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
                  {imageUrls.map((imageUrl) => (
                    <Image
                      key={imageUrl}
                      source={{ uri: imageUrl }}
                      style={[styles.heroImage, { width: imageWidth }]}
                    />
                  ))}
                </ScrollView>
                {imageUrls.length > 1 && (
                  <View style={styles.imageFooter}>
                    <View style={styles.dots}>
                      {imageUrls.map((imageUrl, index) => (
                        <View
                          key={imageUrl}
                          style={[styles.dot, index === imageIndex && styles.dotActive]}
                        />
                      ))}
                    </View>
                    <Text style={styles.imageCount}>{imageIndex + 1} / {imageUrls.length}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={42} color={COLORS.textMuted} />
                <Text style={styles.placeholderText}>등록된 사진이 없습니다.</Text>
              </View>
            )}

            <View style={styles.titleBlock}>
              <Text style={styles.title}>{displayTitle}</Text>
              {address ? (
                <View style={styles.inlineInfo}>
                  <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                  <Text style={styles.inlineInfoText}>{address}</Text>
                </View>
              ) : null}
            </View>

            {(pet || accessibility) && (
              <View style={styles.filterSummary}>
                {pet && (
                  <View style={[styles.summaryChip, styles.summaryChipActive]}>
                    <Ionicons name="paw-outline" size={15} color={COLORS.white} />
                    <Text style={[styles.summaryChipText, styles.summaryChipTextActive]}>반려동물</Text>
                  </View>
                )}
                {accessibility && (
                  <View style={[styles.summaryChip, styles.summaryChipActive]}>
                    <Ionicons name="accessibility-outline" size={15} color={COLORS.white} />
                    <Text style={[styles.summaryChipText, styles.summaryChipTextActive]}>무장애</Text>
                  </View>
                )}
              </View>
            )}

            {fallbackNotice && (
              <View style={styles.noticeBox}>
                <Ionicons name="information-circle-outline" size={17} color={COLORS.warningText} />
                <Text style={styles.noticeText}>{fallbackNotice}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>소개</Text>
              {normalizeText(detail?.overview) ? (
                <Text style={styles.overview}>{detail?.overview}</Text>
              ) : (
                <EmptySectionText>등록된 소개 정보가 없습니다.</EmptySectionText>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기본 정보</Text>
              {hasBasicInfo ? (
                <>
                  <DetailRow label="전화" value={detail?.tel} />
                  <DetailRow label="이용시간" value={detail?.usageTime} />
                  <DetailRow label="휴무일" value={detail?.restDate} />
                  <DetailRow label="주차" value={detail?.parking} />
                  <DetailRow label="문의" value={detail?.inquiry} />
                  {homepageUrl ? (
                    <TouchableOpacity onPress={() => void Linking.openURL(homepageUrl)} style={styles.linkRow}>
                      <Text style={styles.detailLabel}>참고 사이트</Text>
                      <Text style={styles.linkText} numberOfLines={1}>{homepageUrl}</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : (
                <EmptySectionText>등록된 기본 정보가 없습니다.</EmptySectionText>
              )}
            </View>

            {pet && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>반려동물 정보</Text>
                {detail?.petInfo ? (
                  <>
                    <DetailRow label="동반 여부" value={detail.petInfo.accompanyType} />
                    <DetailRow label="필요 물품" value={detail.petInfo.needItems} />
                    <DetailRow label="시설" value={detail.petInfo.petFacilities} />
                    <DetailRow label="주의사항" value={detail.petInfo.caution} />
                    <DetailRow label="사고 위험" value={detail.petInfo.accidentRisk} />
                  </>
                ) : (
                  <EmptySectionText>등록된 반려동물 상세 정보가 없습니다.</EmptySectionText>
                )}
              </View>
            )}

            {accessibility && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>무장애 정보</Text>
                {detail?.accessibilityInfo ? (
                  <>
                    <DetailRow label="주차" value={detail.accessibilityInfo.parking} />
                    <DetailRow label="접근로" value={detail.accessibilityInfo.route} />
                    <DetailRow label="출입구" value={detail.accessibilityInfo.entrance} />
                    <DetailRow label="엘리베이터" value={detail.accessibilityInfo.elevator} />
                    <DetailRow label="화장실" value={detail.accessibilityInfo.restroom} />
                    <DetailRow label="휠체어" value={detail.accessibilityInfo.wheelchair} />
                    <DetailRow label="점자블록" value={detail.accessibilityInfo.braileBlock} />
                    <DetailRow label="보조견" value={detail.accessibilityInfo.helpDog} />
                    <DetailRow label="안내요원" value={detail.accessibilityInfo.guideHuman} />
                  </>
                ) : (
                  <EmptySectionText>등록된 무장애 상세 정보가 없습니다.</EmptySectionText>
                )}
              </View>
            )}
          </>
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
    minWidth: 0,
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
    paddingTop: 20,
    paddingBottom: 32,
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
  imageSlider: {
    borderRadius: 12,
    backgroundColor: '#EDF1F3',
  },
  heroImage: {
    height: 240,
    borderRadius: 12,
    backgroundColor: '#EDF1F3',
  },
  imageFooter: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 2,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: COLORS.primary,
  },
  imageCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  imagePlaceholder: {
    height: 220,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EDF1F3',
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  titleBlock: {
    paddingVertical: 18,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 29,
  },
  inlineInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
  },
  inlineInfoText: {
    flex: 1,
    color: COLORS.textSub,
    fontSize: 14,
    lineHeight: 20,
  },
  filterSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  summaryChip: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  summaryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  summaryChipText: {
    color: COLORS.textSub,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryChipTextActive: {
    color: COLORS.white,
  },
  noticeBox: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.warningBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    color: COLORS.warningText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  overview: {
    color: COLORS.textSub,
    fontSize: 14,
    lineHeight: 22,
  },
  emptySectionText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  detailRow: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F4',
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  linkRow: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F4',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
