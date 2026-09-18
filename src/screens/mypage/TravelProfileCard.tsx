import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  getTravelProfile,
  getTravelProfileAnalysisJob,
  startTravelProfileAnalysis,
  type TravelProfile,
} from './api';

const POLL_INTERVAL_MS = 1500;

function message(error: unknown) {
  return error instanceof Error ? error.message : '여행 취향을 불러오지 못했습니다.';
}

export default function TravelProfileCard() {
  const [profile, setProfile] = useState<TravelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTravelProfile();
      if (alive.current) setProfile(result);
    } catch (loadError) {
      if (alive.current) setError(message(loadError));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  const poll = useCallback(async (jobId: string) => {
    try {
      const job = await getTravelProfileAnalysisJob(jobId);
      if (!alive.current) return;
      if (job.status === 'COMPLETED') {
        setProfile(job.profile ?? await getTravelProfile());
        setAnalyzing(false);
        return;
      }
      if (job.status === 'FAILED') {
        setError(job.message ?? '취향 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        setAnalyzing(false);
        return;
      }
      timer.current = setTimeout(() => void poll(jobId), POLL_INTERVAL_MS);
    } catch (pollError) {
      if (!alive.current) return;
      setError(message(pollError));
      setAnalyzing(false);
    }
  }, []);

  const analyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setError(null);
    try {
      const job = await startTravelProfileAnalysis();
      await poll(job.jobId);
    } catch (analysisError) {
      setError(message(analysisError));
      setAnalyzing(false);
    }
  };

  if (loading) return <View style={styles.card}><ActivityIndicator color="#008A9A" /></View>;

  return (
    <View style={styles.card} accessibilityLabel="AI 여행 취향 프로필">
      <View style={styles.heading}>
        <View style={styles.icon}><Ionicons name="sparkles" size={20} color="#008A9A" /></View>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>AI 여행 취향</Text>
          <Text style={styles.title}>{profile?.title ?? '아직 분석된 여행 취향이 없어요'}</Text>
        </View>
      </View>

      {profile?.status === 'COMPLETED' ? (
        <>
          <Text style={styles.description}>{profile.description}</Text>
          <View style={styles.tags}>{profile.tags.map((tag) => <Text key={tag} style={styles.tag}>#{tag}</Text>)}</View>
          {profile.evidences.length > 0 && (
            <View style={styles.evidenceBox}>
              <Text style={styles.evidenceTitle}>이렇게 분석했어요</Text>
              {profile.evidences.map((item) => <Text key={item} style={styles.evidence}>• {item}</Text>)}
            </View>
          )}
        </>
      ) : profile?.status === 'INSUFFICIENT_DATA' ? (
        <Text style={styles.description}>검색, 방문, 코스 저장과 리뷰 활동이 조금 더 쌓이면 취향을 분석할 수 있어요.</Text>
      ) : (
        <Text style={styles.description}>최근 여행 활동을 바탕으로 나만의 여행 스타일을 찾아드려요.</Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={[styles.button, analyzing && styles.buttonDisabled]} onPress={() => void analyze()} disabled={analyzing}>
        {analyzing ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
          <Text style={styles.buttonText}>{profile?.status === 'COMPLETED' ? '다시 분석하기' : '취향 분석하기'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, gap: 13, minHeight: 96 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#E3F4F2', alignItems: 'center', justifyContent: 'center' },
  headingText: { flex: 1, gap: 2 },
  eyebrow: { color: '#008A9A', fontSize: 12, fontWeight: '800' },
  title: { color: '#1F2933', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  description: { color: '#6B7280', fontSize: 13, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag: { color: '#006F7C', backgroundColor: '#E3F4F2', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: '700' },
  evidenceBox: { backgroundColor: '#F7F8FA', borderRadius: 12, padding: 12, gap: 5 },
  evidenceTitle: { color: '#1F2933', fontSize: 12, fontWeight: '800' },
  evidence: { color: '#6B7280', fontSize: 12, lineHeight: 18 },
  error: { color: '#B45309', fontSize: 12, lineHeight: 18 },
  button: { minHeight: 44, borderRadius: 12, backgroundColor: '#008A9A', alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
