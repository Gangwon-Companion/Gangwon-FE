import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { colors } from '../../constants/colors';
import { getTravelProfile, type TravelProfile } from './api';

export default function TravelProfileSummaryCard() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<TravelProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    getTravelProfile(controller.signal)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []));

  const completed = profile?.status === 'COMPLETED' && profile.travelerType;
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('TravelProfile')}>
      <View style={styles.icon}><Ionicons name="compass-outline" size={24} color={colors.primary} /></View>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>나의 여행 유형</Text>
        {loading ? <ActivityIndicator size="small" color={colors.primary} style={styles.loader} /> : completed ? (
          <>
            <Text style={styles.title}><Text style={styles.code}>{profile.travelerType}</Text> · {profile.title}</Text>
            <Text style={styles.description} numberOfLines={2}>{profile.description}</Text>
          </>
        ) : (
          <Text style={styles.description}>활동 기록으로 나만의 여행 유형을 알아보세요.</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  icon: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minHeight: 44, justifyContent: 'center' },
  eyebrow: { color: colors.gray500, fontSize: 12, fontWeight: '700', marginBottom: 3 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800' },
  code: { color: colors.primary },
  description: { color: colors.gray500, fontSize: 12, lineHeight: 17 },
  loader: { alignSelf: 'flex-start', marginTop: 4 },
});
