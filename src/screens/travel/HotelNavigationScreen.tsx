import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#008A9A';

export default function HotelNavigationScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>호텔 찾기</Text>
      </View>
      <View style={styles.empty}>
        <Ionicons name="bed-outline" size={56} color={PRIMARY} />
        <Text style={styles.emptyTitle}>호텔 검색</Text>
        <Text style={styles.emptyDesc}>원하는 지역의 호텔을 찾아보세요</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2933' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1F2933' },
  emptyDesc: { fontSize: 14, color: '#9CA3AF' },
});
