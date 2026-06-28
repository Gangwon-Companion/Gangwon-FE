import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const THEME_COLOR = '#008A9A';
const BG_COLOR = '#F7F8FA';

const themes = ['액티비티', '자연', '걷기', '힐링', '문화', '축제'];

const courses = [
  {
    image: 'https://images.unsplash.com/photo-1683009427590-dd987135e66c?w=400&h=300&fit=crop',
    title: '사막 어드벤처 트레일',
    location: 'UAE 사막',
    duration: '2일',
    theme: '액티비티',
    rating: '4.7',
  },
  {
    image: 'https://images.unsplash.com/photo-1600582910964-5b7c109e6868?w=400&h=300&fit=crop',
    title: '열대 섬 힐링 여행',
    location: '발리, 인도네시아',
    duration: '3일',
    theme: '힐링',
    rating: '4.9',
  },
  {
    image: 'https://images.unsplash.com/photo-1708037429826-de89ac0dd6c7?w=400&h=300&fit=crop',
    title: '역사 도시 워킹 투어',
    location: '쉐프샤우엔',
    duration: '1일',
    theme: '문화',
    rating: '4.8',
  },
];

export default function ThemeTabScreen() {
  const navigation = useNavigation();
  const [selectedTheme, setSelectedTheme] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 테마</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 테마 필터 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {themes.map((theme, index) => (
            <TouchableOpacity
              key={theme}
              onPress={() => setSelectedTheme(index)}
              style={[
                styles.filterChip,
                selectedTheme === index ? styles.filterChipActive : styles.filterChipInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedTheme === index ? styles.filterChipTextActive : styles.filterChipTextInactive,
                ]}
              >
                {theme}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>추천 여행 코스</Text>

          {courses.map((course, index) => (
            <View key={index} style={styles.card}>
              <Image source={{ uri: course.image }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                {/* 제목 + 별점 */}
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{course.title}</Text>
                  <Text style={styles.cardRating}>★ {course.rating}</Text>
                </View>

                {/* 위치 + 기간 */}
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.metaText}>{course.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.metaText}>{course.duration}</Text>
                  </View>
                </View>

                {/* 테마 뱃지 */}
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{course.theme}</Text>
                  </View>
                </View>

                {/* 버튼 */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>자세히 보기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>저장</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
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
  filterScroll: {
    marginTop: 20,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: THEME_COLOR,
  },
  filterChipInactive: {
    backgroundColor: '#fff',
  },
  filterChipText: {
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterChipTextInactive: {
    color: '#6B7280',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2933',
    marginBottom: 16,
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
  cardRating: {
    fontSize: 13,
    color: THEME_COLOR,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#BFE8E2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    color: THEME_COLOR,
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
    paddingHorizontal: 16,
    backgroundColor: BG_COLOR,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
