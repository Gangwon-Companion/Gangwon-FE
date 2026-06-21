import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#008A9A';

export default function MyTravelCoursesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>내 여행</Text>
      </View>
      <View style={styles.empty}>
        <Ionicons name="map-outline" size={56} color={PRIMARY} />
        <Text style={styles.emptyTitle}>아직 여행 코스가 없어요</Text>
        <Text style={styles.emptyDesc}>새로운 여행을 계획해보세요</Text>
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
