import { useContentWidth } from '../../hooks/useContentWidth';
import { Alert } from '../../utils/alert';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { buildRequestHeaders, getApiBaseUrl } from '../home/api';

const PRIMARY = '#008A9A';

type SavedPlace = { id: number; placeType: string; placeId: number; visitOrder: number; day?: number; name?: string | null; visitTime?: string | null; address?: string | null };
type SavedCourse = { id: number; name: string; places: SavedPlace[] };
const typeLabel = (type: string) => ({ ATTRACTION: '관광지', DESTINATION: '관광지', RESTAURANT: '음식점', LODGING: '숙소' }[type] ?? type);

export default function MyTravelCoursesScreen() {
  const cardWidth = Math.min(420, useContentWidth() - 72);
  const [courses, setCourses] = useState<SavedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePlaces, setActivePlaces] = useState<Record<string, number>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = await getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/v1/courses`, { headers: await buildRequestHeaders() });
        if (!response.ok) throw new Error(`내 여행 조회 실패 (${response.status})`);
        const data = await response.json() as SavedCourse[];
        if (active) setCourses(data);
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
            if (!response.ok) throw new Error(`삭제 실패 (${response.status})`);
            setCourses((current) => current.filter((course) => course.id !== courseId));
          } catch {
            Alert.alert('삭제 실패', '로그인 상태와 서버 연결을 확인해주세요.');
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
            const days = [...new Set(course.places.map((place) => place.day ?? 1))].sort((a, b) => a - b);
            return (
              <View key={course.id} style={styles.courseSection}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseIcon}><Ionicons name="map" size={20} color={PRIMARY} /></View>
                  <View style={styles.courseHeaderText}><Text style={styles.courseTitle}>{course.name}</Text><Text style={styles.courseMeta}>{days.length}일 · {course.places.length}개 장소</Text></View>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteCourse(course.id)}
                    disabled={deletingId === course.id}
                    hitSlop={8}
                    accessibilityLabel="여행 코스 삭제"
                  >
                    {deletingId === course.id
                      ? <ActivityIndicator size="small" color="#9CA3AF" />
                      : <Ionicons name="trash-outline" size={20} color="#9CA3AF" />}
                  </Pressable>
                </View>
                {days.map((day) => {
                  const places = [...course.places].filter((place) => (place.day ?? 1) === day).sort((a, b) => a.visitOrder - b.visitOrder);
                  const key = `${course.id}-${day}`;
                  return (
                    <View key={key} style={styles.daySection}>
                      <Text style={styles.dayTitle}>{day}일차</Text>
                      <ScrollView horizontal snapToInterval={cardWidth + 12} decelerationRate="fast" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placeList}
                        onMomentumScrollEnd={(event) => {
                          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + 12));
                          setActivePlaces((current) => ({ ...current, [key]: nextIndex }));
                        }}>
                        {places.map((place, index) => (
                          <View key={place.id} style={[styles.placeCard, { width: cardWidth }]}>
                            <View style={styles.placeTop}><View style={styles.orderBadge}><Text style={styles.orderText}>{index + 1}</Text></View><Text style={styles.placeType}>{typeLabel(place.placeType)}</Text></View>
                            <Text style={styles.placeName}>{place.name || `${typeLabel(place.placeType)} ${index + 1}`}</Text>
                            {!!place.visitTime && <Text style={styles.visitTime}>{place.visitTime}</Text>}
                            {!!place.address && <Text style={styles.address}>{place.address}</Text>}
                          </View>
                        ))}
                      </ScrollView>
                      <View style={styles.dots}>{places.map((place, index) => <View key={place.id} style={[styles.dot, index === (activePlaces[key] ?? 0) && styles.dotActive]} />)}</View>
                    </View>
                  );
                })}
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
  daySection: { marginTop: 18 }, dayTitle: { paddingHorizontal: 24, marginBottom: 10, fontSize: 15, fontWeight: '800', color: '#006F7C' }, placeList: { paddingHorizontal: 24, gap: 12 }, placeCard: { minHeight: 180, padding: 19, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  placeTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, orderBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E6F6F4', alignItems: 'center', justifyContent: 'center', marginRight: 9 }, orderText: { color: PRIMARY, fontSize: 12, fontWeight: '800' }, placeType: { color: PRIMARY, fontSize: 12, fontWeight: '700' }, placeName: { fontSize: 19, fontWeight: '800', color: '#1F2933' }, visitTime: { marginTop: 9, color: PRIMARY, fontSize: 13, fontWeight: '700' }, address: { marginTop: 7, color: '#6B7280', fontSize: 12, lineHeight: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' }, dotActive: { width: 20, backgroundColor: PRIMARY },
});
