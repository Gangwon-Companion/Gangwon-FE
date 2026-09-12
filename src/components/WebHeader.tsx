import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TabParamList } from '../navigation/types';

const tabs: { name: keyof TabParamList; label: string; routes: string[] }[] = [
  { name: '홈', label: '여행지 둘러보기', routes: ['홈', 'ThemeTab', 'ThemeDestinations', 'DestinationDetail', 'HotelsTab', 'HotelDetail', 'RestaurantsTab', 'RestaurantDetail'] },
  { name: '내여행', label: '내 여행', routes: ['내여행'] },
  { name: 'AI추천', label: 'AI 여행 추천', routes: ['AI추천'] },
  { name: '커뮤니티', label: '커뮤니티', routes: ['커뮤니티'] },
  { name: '마이', label: '마이 페이지', routes: ['마이'] },
];

export default function WebHeader({ activeRoute, onNavigate }: { activeRoute?: string; onNavigate: (screen: keyof TabParamList) => void }) {
  return <View style={styles.header}>
    <View style={styles.inner}>
      <Pressable accessibilityRole="link" accessibilityLabel="강원동행 홈" style={styles.brand} onPress={() => onNavigate('홈')}>
        <Ionicons name="paper-plane" size={25} color="#008A9A" />
        <Text style={styles.brandText}>강원동행</Text>
      </Pressable>
      <View style={styles.links}>
        {tabs.map(tab => {
          const selected = !!activeRoute && tab.routes.includes(activeRoute);
          return <Pressable key={tab.name} accessibilityRole="link" accessibilityState={{ selected }} onPress={() => onNavigate(tab.name)} style={[styles.link, selected && styles.selected]}>
            <Text style={[styles.label, selected && styles.selectedText]}>{tab.label}</Text>
          </Pressable>;
        })}
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  header: { width: '100%', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  inner: { width: '100%', height: 76, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  brandText: { fontSize: 23, fontWeight: '800', color: '#006F7C' },
  links: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { paddingVertical: 13, paddingHorizontal: 14, borderRadius: 10 },
  selected: { backgroundColor: '#E6F6F4' },
  label: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  selectedText: { color: '#006F7C', fontWeight: '800' },
});
