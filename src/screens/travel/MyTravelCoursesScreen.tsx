import { useContentWidth } from '../../hooks/useContentWidth';
import { Alert } from '../../utils/alert';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { buildRequestHeaders, getApiBaseUrl } from '../home/api';

const PRIMARY = '#008A9A';

type SavedPlace = { id: number; placeType: string; placeId: number; visitOrder: number; day?: number; name?: string | null; visitTime?: string | null; address?: string | null };
type SavedCourse = { id: number; courseId?: number; name: string; places: SavedPlace[] };
const typeLabel = (type: string) => ({ ATTRACTION: '관광지', DESTINATION: '관광지', RESTAURANT: '음식점', LODGING: '숙소' }[type] ?? type);
const isLodging = (place: SavedPlace) => place.placeType === 'LODGING';

function getCourseId(course: SavedCourse) {
  return course.courseId ?? course.id;
}

function normalizeCourses(data: unknown): SavedCourse[] {
  const items = Array.isArray(data) ? data : Array.isArray((data as any)?.content) ? (data as any).content : [];
  return items.map((item: any) => ({
    ...item,
    id: item.courseId ?? item.id,
    courseId: item.courseId ?? item.id,
    name: item.name ?? item.title ?? '이름 없는 여행 코스',
    places: Array.isArray(item.places) ? item.places : [],
  })).filter((course: SavedCourse) => Number.isFinite(course.id));
}

export default function MyTravelCoursesScreen() {
  const contentWidth = useContentWidth();
  const cardWidth = Math.min(420, Math.max(240, contentWidth - 72));
  const dayScrollRefs = useRef<Record<number, ScrollView | null>>({});
  const [courses, setCourses] = useState<SavedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDays, setActiveDays] = useState<Record<number, number>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const makeWheelScrollProps = (courseId: number, dayCount: number) => Platform.OS === 'web' ? ({
    onWheel: (event: any) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault?.();
      const direction = event.deltaY > 0 ? 1 : -1;
      const currentIndex = activeDays[courseId] ?? 0;
      const nextIndex = Math.max(0, Math.min(currentIndex + direction, dayCount - 1));
      if (nextIndex === currentIndex) return;
      setActiveDays((current) => ({ ...current, [courseId]: nextIndex }));
      dayScrollRefs.current[courseId]?.scrollTo({ x: nextIndex * contentWidth, animated: true });
    },
  }) : {};

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = await getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/v1/courses`, { headers: await buildRequestHeaders() });
        if (!response.ok) throw new Error(`내 여행 조회 실패 (${response.status})`);
        const data = await response.json();
        if (active) setCourses(normalizeCourses(data));
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : '내 여행을 불러오지 못했습니다.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []));

  const deleteCourse = (courseId: number) => {
    Alert.alert('여행 코스 삭제', '이 여행 코스를 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(courseId);
          try {
            const baseUrl = await getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/courses/${courseId}`, {
              method: 'DELETE',
              headers: await buildRequestHeaders(),
            });
            if (!response.ok) {
              const body = await response.text();
              throw new Error(body || `삭제 실패 (${response.status})`);
            }
            setCourses((current) => current.filter((course) => getCourseId(course) !== courseId));
          } catch (deleteError) {
            Alert.alert('삭제 실패', deleteError instanceof Error ? deleteError.message : '로그인 상태와 서버 연결을 확인해주세요.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.title}>내 여행</Text></View>
      {loading && <ActivityIndicator size="large" color={PRIMARY} style={styles.center} />}
      {!loading && error && <View style={styles.center}><Text style={styles.error}>{error}</Text></View>}
      {!loading && !error && courses.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="map-outline" size={56} color={PRIMARY} />
          <Text style={styles.emptyTitle}>아직 저장한 여행 코스가 없어요</Text>
          <Text style={styles.emptyDesc}>AI 추천에서 마음에 드는 일정을 추가해 보세요.</Text>
        </View>
      )}
      {!loading && !error && courses.length > 0 && (
        <ScrollView contentContainerStyle={styles.courseList} showsVerticalScrollIndicator={false}>
          {courses.map((course) => {
            const courseId = getCourseId(course);
            const itineraryPlaces = course.places.filter((place) => !isLodging(place));
            const lodgings = course.places.filter(isLodging).sort((a, b) => a.visitOrder - b.visitOrder);
            const days = [...new Set(itineraryPlaces.map((place) => place.day ?? 1))].sort((a, b) => a - b);
            const activeDayIndex = Math.min(activeDays[courseId] ?? 0, Math.max(days.length - 1, 0));
            return (
              <View key={courseId} style={styles.courseSection}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseIcon}><Ionicons name="map" size={20} color={PRIMARY} /></View>
                  <View style={styles.courseHeaderText}><Text style={styles.courseTitle}>{course.name}</Text><Text style={styles.courseMeta}>{days.length}일 · {itineraryPlaces.length}개 일정 · 숙소 {lodgings.length}개</Text></View>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteCourse(courseId)}
                    disabled={deletingId === courseId}
                    hitSlop={8}
                    accessibilityLabel="여행 코스 삭제"
                  >
                    {deletingId === courseId
                      ? <ActivityIndicator size="small" color="#9CA3AF" />
                      : <Ionicons name="trash-outline" size={20} color="#9CA3AF" />}
                  </Pressable>
                </View>
                {days.length > 0 && (
                  <>
                    <View style={styles.dayTitleRow}>
                      <Text style={styles.dayTitle}>{days[activeDayIndex]}일차</Text>
                      <Text style={styles.pageCount}>{activeDayIndex + 1} / {days.length}</Text>
                    </View>
                    <ScrollView
                      ref={(ref) => { dayScrollRefs.current[courseId] = ref; }}
                      horizontal
                      pagingEnabled
                      scrollEventThrottle={16}
                      showsHorizontalScrollIndicator={false}
                      style={styles.daysPager}
                      onScroll={(event) => {
                        const nextIndex = Math.round(event.nativeEvent.contentOffset.x / contentWidth);
                        setActiveDays((current) => current[courseId] === nextIndex ? current : { ...current, [courseId]: Math.max(0, Math.min(nextIndex, days.length - 1)) });
                      }}
                      {...makeWheelScrollProps(courseId, days.length)}
                    >
                      {days.map((day) => {
                        const places = [...itineraryPlaces].filter((place) => (place.day ?? 1) === day).sort((a, b) => a.visitOrder - b.visitOrder);
                        const key = `${courseId}-${day}`;
                        return (
                          <View key={key} style={[styles.daySection, { width: contentWidth }]}>
                            <View style={styles.placeList}>
                              {places.map((place, index) => (
                                <View key={place.id} style={[styles.placeCard, { width: cardWidth }]}>
                                  <View style={styles.placeTop}><View style={styles.orderBadge}><Text style={styles.orderText}>{index + 1}</Text></View><Text style={styles.placeType}>{typeLabel(place.placeType)}</Text></View>
                                  <Text style={styles.placeName}>{place.name || `${typeLabel(place.placeType)} ${index + 1}`}</Text>
                                  {!!place.visitTime && <Text style={styles.visitTime}>{place.visitTime}</Text>}
                                  {!!place.address && <Text style={styles.address}>{place.address}</Text>}
                                </View>
                              ))}
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                    {days.length > 1 && (
                      <View style={styles.dots}>
                        {days.map((day, index) => (
                          <Pressable
                            key={`${courseId}-dot-${day}`}
                            onPress={() => {
                              setActiveDays((current) => ({ ...current, [courseId]: index }));
                              dayScrollRefs.current[courseId]?.scrollTo({ x: index * contentWidth, animated: true });
                            }}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={`${day}일차 보기`}
                          >
                            <View style={[styles.dot, index === activeDayIndex && styles.dotActive]} />
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </>
                )}
                {lodgings.length > 0 && (
                  <View style={styles.lodgingSection}>
                    <View style={styles.lodgingHeader}>
                      <View>
                        <Text style={styles.lodgingTitle}>추천된 숙소</Text>
                        <Text style={styles.lodgingMeta}>AI가 추천한 숙소 {lodgings.length}개</Text>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lodgingList}>
                      {lodgings.map((lodging, index) => (
                        <View key={lodging.id} style={[styles.lodgingCard, { width: cardWidth }]}>
                          <View style={styles.placeTop}>
                            <View style={styles.lodgingIcon}><Ionicons name="bed-outline" size={16} color={PRIMARY} /></View>
                            <Text style={styles.placeType}>숙소 {index + 1}</Text>
                          </View>
                          <Text style={styles.placeName}>{lodging.name || `추천 숙소 ${index + 1}`}</Text>
                          {!!lodging.visitTime && <Text style={styles.visitTime}>{lodging.visitTime}</Text>}
                          {!!lodging.address && <Text style={styles.address}>{lodging.address}</Text>}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' }, header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, title: { fontSize: 20, fontWeight: '700', color: '#1F2933' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 }, emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1F2933' }, emptyDesc: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' }, error: { color: '#B45309', textAlign: 'center' },
  courseList: { paddingVertical: 20 }, courseSection: { marginBottom: 28 }, courseHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 6 }, courseIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#E6F6F4', alignItems: 'center', justifyContent: 'center', marginRight: 11 }, courseHeaderText: { flex: 1 }, courseTitle: { fontSize: 18, fontWeight: '800', color: '#1F2933' }, courseMeta: { marginTop: 3, fontSize: 12, color: PRIMARY, fontWeight: '700' }, deleteButton: { padding: 8 },
  daysPager: { marginTop: 18 }, daySection: {}, dayTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 10 }, dayTitle: { fontSize: 15, fontWeight: '800', color: '#006F7C' }, pageCount: { color: '#9CA3AF', fontSize: 12, fontWeight: '800' }, placeList: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12 }, placeCard: { minHeight: 180, padding: 19, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  placeTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, orderBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E6F6F4', alignItems: 'center', justifyContent: 'center', marginRight: 9 }, lodgingIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E6F6F4', alignItems: 'center', justifyContent: 'center', marginRight: 9 }, orderText: { color: PRIMARY, fontSize: 12, fontWeight: '800' }, placeType: { color: PRIMARY, fontSize: 12, fontWeight: '700' }, placeName: { fontSize: 19, fontWeight: '800', color: '#1F2933' }, visitTime: { marginTop: 9, color: PRIMARY, fontSize: 13, fontWeight: '700' }, address: { marginTop: 7, color: '#6B7280', fontSize: 12, lineHeight: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' }, dotActive: { width: 20, backgroundColor: PRIMARY },
  lodgingSection: { marginTop: 18 }, lodgingHeader: { paddingHorizontal: 24, marginBottom: 10 }, lodgingTitle: { fontSize: 15, fontWeight: '800', color: '#006F7C' }, lodgingMeta: { marginTop: 3, color: '#9CA3AF', fontSize: 12, fontWeight: '700' }, lodgingList: { paddingHorizontal: 24, gap: 12 }, lodgingCard: { minHeight: 160, padding: 19, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D7F0ED' },
});
