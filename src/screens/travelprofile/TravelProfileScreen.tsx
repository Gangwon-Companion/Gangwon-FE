import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../../constants/colors';
import { getTravelProfile, getTravelProfileAnalysisJob, startTravelProfileAnalysis, type TravelProfile } from './api';
import { TRAVEL_AXES, TRAVEL_TYPE_CATALOG } from './catalog';

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function TravelProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<TravelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setError(null);
    try {
      setProfile(await getTravelProfile(signal));
    } catch (requestError) {
      if (!signal?.aborted) setError(requestError instanceof Error ? requestError.message : '여행 성향을 불러오지 못했어요.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const analyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setError(null);
    try {
      const submitted = await startTravelProfileAnalysis();
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const job = await getTravelProfileAnalysisJob(submitted.jobId);
        if (job.status === 'COMPLETED' && job.profile) {
          setProfile(job.profile);
          return;
        }
        if (job.status === 'FAILED') throw new Error(job.errorMessage || '여행 성향 분석에 실패했어요.');
        await wait(1000);
      }
      throw new Error('분석 시간이 길어지고 있어요. 잠시 후 다시 확인해주세요.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '여행 성향 분석에 실패했어요.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>나의 여행 유형</Text>
        <View style={styles.back} />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>여행 성향을 불러오는 중이에요.</Text></View> : (
        <ScrollView contentContainerStyle={styles.content}>
          {profile?.status === 'COMPLETED' && profile.travelerType ? <ProfileResult profile={profile} /> : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🧭</Text>
              <Text style={styles.emptyTitle}>{profile?.status === 'INSUFFICIENT_DATA' ? '기록이 조금 더 필요해요' : '아직 분석된 여행 유형이 없어요'}</Text>
              <Text style={styles.muted}>검색, 방문, 저장 코스와 리뷰를 바탕으로 검사 없이 자동 분석해요.</Text>
            </View>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={analyzing} onPress={() => void analyze()} style={[styles.button, analyzing && styles.buttonDisabled]}>
            {analyzing ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{profile?.status === 'COMPLETED' ? '다시 분석하기' : '자동 분석하기'}</Text>}
          </Pressable>
          <TravelTypeGuide currentType={profile?.travelerType ?? null} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ProfileResult({ profile }: { profile: TravelProfile }) {
  return (
    <>
      <View style={styles.resultCard}>
        <Text style={styles.code}>{profile.travelerType}</Text>
        <Text style={styles.title}>{profile.title}</Text>
        <Text style={styles.description}>{profile.description}</Text>
        <View style={styles.tags}>{profile.tags.map((tag) => <Text key={tag} style={styles.tag}>#{tag}</Text>)}</View>
      </View>
      {profile.axisScores ? <View style={styles.axisCard}>
        <Text style={styles.sectionTitle}>여행 성향 분석</Text>
        {TRAVEL_AXES.map((axis) => {
          const scores = profile.axisScores?.[axis.key] as Record<string, number>;
          const left = scores[axis.left];
          return <View key={axis.key} style={styles.axisRow}>
            <View style={styles.axisLabels}><Text>{axis.left} {axis.leftLabel} {left}%</Text><Text>{100 - left}% {axis.rightLabel} {axis.right}</Text></View>
            <View style={styles.track}><View style={[styles.fill, { width: `${left}%` }]} /></View>
          </View>;
        })}
      </View> : null}
      {profile.evidences.length ? <View style={styles.evidenceCard}><Text style={styles.sectionTitle}>이렇게 분석했어요</Text>{profile.evidences.map((evidence) => <Text key={evidence} style={styles.evidence}>• {evidence}</Text>)}</View> : null}
    </>
  );
}

function TravelTypeGuide({ currentType }: { currentType: TravelProfile['travelerType'] }) {
  return (
    <>
      <View style={styles.guideCard}>
        <Text style={styles.sectionTitle}>알파벳은 무엇을 뜻하나요?</Text>
        <Text style={styles.guideIntro}>네 가지 여행 선택 기준을 순서대로 조합해 하나의 유형을 만들어요.</Text>
        {TRAVEL_AXES.map((axis) => (
          <View key={axis.key} style={styles.guideAxis}>
            <View style={styles.guidePair}>
              <Text style={styles.guideCode}>{axis.left}</Text><Text style={styles.guideLabel}>{axis.leftLabel}</Text>
              <Text style={styles.guideDivider}>↔</Text>
              <Text style={styles.guideCode}>{axis.right}</Text><Text style={styles.guideLabel}>{axis.rightLabel}</Text>
            </View>
            <Text style={styles.guideDescription}>{axis.description}</Text>
          </View>
        ))}
      </View>
      <View style={styles.catalogCard}>
        <Text style={styles.sectionTitle}>16가지 여행 유형</Text>
        <Text style={styles.guideIntro}>각 코드를 눌러보지 않아도 한눈에 의미를 비교할 수 있어요.</Text>
        {TRAVEL_TYPE_CATALOG.map((type) => (
          <View key={type.code} style={[styles.catalogRow, currentType === type.code && styles.catalogRowActive]}>
            <Text style={[styles.catalogCode, currentType === type.code && styles.catalogCodeActive]}>{type.code}</Text>
            <View style={styles.catalogBody}>
              <Text style={styles.catalogTitle}>{type.title}{currentType === type.code ? ' · 나의 유형' : ''}</Text>
              <Text style={styles.catalogDescription}>{type.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  resultCard: { backgroundColor: colors.primary, borderRadius: 24, padding: 24, alignItems: 'center', gap: 10 },
  code: { color: colors.white, fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  title: { color: colors.white, fontSize: 22, fontWeight: '800' },
  description: { color: 'rgba(255,255,255,0.9)', textAlign: 'center', fontSize: 15, lineHeight: 23 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4 },
  tag: { color: colors.primary, backgroundColor: colors.white, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontWeight: '700' },
  axisCard: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  axisRow: { gap: 8 },
  axisLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 10, backgroundColor: colors.primaryLight, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
  evidenceCard: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 10 },
  evidence: { color: colors.gray500, lineHeight: 21 },
  emptyCard: { backgroundColor: colors.white, borderRadius: 20, padding: 28, alignItems: 'center', gap: 12 },
  emptyIcon: { fontSize: 42 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center' },
  muted: { color: colors.gray500, textAlign: 'center', lineHeight: 21 },
  error: { color: '#DC2626', textAlign: 'center' },
  button: { minHeight: 52, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  guideCard: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 16 },
  guideIntro: { color: colors.gray500, fontSize: 13, lineHeight: 19 },
  guideAxis: { gap: 5, borderTopWidth: 1, borderTopColor: colors.gray200, paddingTop: 12 },
  guidePair: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  guideCode: { color: colors.white, backgroundColor: colors.primary, borderRadius: 7, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3, fontWeight: '900' },
  guideLabel: { color: colors.text, fontSize: 13, fontWeight: '700' },
  guideDivider: { color: colors.gray400, marginHorizontal: 4 },
  guideDescription: { color: colors.gray500, fontSize: 12, lineHeight: 18 },
  catalogCard: { backgroundColor: colors.white, borderRadius: 20, padding: 20, gap: 10 },
  catalogRow: { flexDirection: 'row', gap: 12, borderRadius: 12, padding: 12, backgroundColor: colors.background },
  catalogRowActive: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  catalogCode: { width: 48, color: colors.primary, fontSize: 14, fontWeight: '900' },
  catalogCodeActive: { color: colors.text },
  catalogBody: { flex: 1, gap: 3 },
  catalogTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  catalogDescription: { color: colors.gray500, fontSize: 12, lineHeight: 17 },
});
