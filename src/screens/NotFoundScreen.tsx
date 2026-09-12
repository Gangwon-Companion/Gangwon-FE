import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

export default function NotFoundScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'NotFound'>) {
  return <View style={styles.page}>
    <Text style={styles.title}>페이지를 찾을 수 없어요</Text>
    <Text>주소를 확인하거나 홈에서 여행지를 찾아보세요.</Text>
    <Pressable accessibilityRole="link" onPress={() => navigation.replace('Main')} style={styles.button}>
      <Text style={styles.label}>홈으로 이동</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  button: { backgroundColor: '#008A9A', borderRadius: 12, padding: 16 },
  label: { color: '#fff', fontWeight: '700' },
});
