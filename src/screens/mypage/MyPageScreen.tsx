import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ApiError, clearAccessToken } from '../../api/auth';
import { changeNickname, changePassword, getMyPage, logout, MyPageData } from './api';

const COLORS = {
  primary: '#008A9A', primaryBg: '#E3F4F2', bg: '#F7F8FA', white: '#FFFFFF',
  text: '#1F2933', textSub: '#6B7280', textMuted: '#9CA3AF', border: '#E5E7EB',
  red: '#EF4444', redBg: '#FEF2F2',
};

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type Editor = 'nickname' | 'password' | null;

function errorMessage(error: unknown, field?: string) {
  if (error instanceof ApiError) {
    const fieldError = field ? error.errors.find((item) => item.field === field) : undefined;
    return fieldError?.message ?? error.errors[0]?.message ?? error.message;
  }
  return '요청 처리 중 오류가 발생했습니다.';
}

export default function MyPageScreen() {
  const navigation = useNavigation<NavProp>();
  const [data, setData] = useState<MyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const goToLogin = useCallback(() => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  }, [navigation]);

  const load = useCallback(async (signal?: AbortSignal, refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setData(await getMyPage(signal));
    } catch (loadError) {
      if (signal?.aborted) return;
      if (loadError instanceof ApiError && loadError.status === 401) {
        Alert.alert('로그인 필요', '로그인 정보가 없거나 만료되었습니다.', [{ text: '확인', onPress: goToLogin }]);
      } else {
        setError(errorMessage(loadError));
      }
    } finally {
      if (!signal?.aborted) { setLoading(false); setRefreshing(false); }
    }
  }, [goToLogin]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const openNickname = () => { setNickname(data?.nickname ?? ''); setEditor('nickname'); };
  const closeEditor = () => { if (!saving) { setEditor(null); setCurrentPassword(''); setNewPassword(''); } };

  const submitNickname = async () => {
    const value = nickname.trim();
    if (!value) return Alert.alert('입력 확인', '닉네임을 입력해 주세요.');
    if ([...value].length > 6) return Alert.alert('입력 확인', '닉네임은 최대 6자까지 입력할 수 있습니다.');
    setSaving(true);
    try {
      await changeNickname(value);
      setData((previous) => previous ? { ...previous, nickname: value } : previous);
      setEditor(null);
      Alert.alert('변경 완료', '닉네임이 변경되었습니다.');
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) return goToLogin();
      Alert.alert('변경 실패', errorMessage(submitError, 'nickname'));
    } finally { setSaving(false); }
  };

  const submitPassword = async () => {
    if (!currentPassword || !newPassword) return Alert.alert('입력 확인', '현재 비밀번호와 새 비밀번호를 입력해 주세요.');
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setEditor(null); setCurrentPassword(''); setNewPassword('');
      Alert.alert('변경 완료', '비밀번호가 변경되었습니다.');
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) return goToLogin();
      Alert.alert('변경 실패', errorMessage(submitError));
    } finally { setSaving(false); }
  };

  const performLogout = async () => {
    try { await logout(); }
    catch (logoutError) {
      if (!(logoutError instanceof ApiError && logoutError.status === 401)) {
        return Alert.alert('로그아웃 실패', errorMessage(logoutError));
      }
    }
    await clearAccessToken();
    goToLogin();
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('정말 로그아웃 하시겠어요?')) void performLogout();
      return;
    }

    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void performLogout() },
    ]);
  };

  const joinedAt = data?.joinedAt
    ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(data.joinedAt))
    : '-';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(undefined, true)} tintColor={COLORS.primary} />}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이 페이지</Text>
          {loading ? <ActivityIndicator color={COLORS.white} /> : data ? (
            <View style={styles.profileRow}>
              <View style={styles.avatar}><Ionicons name="person" size={42} color={COLORS.primary} /></View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>{data.nickname}</Text>
                  <TouchableOpacity onPress={openNickname}><Ionicons name="pencil" size={18} color={COLORS.white} /></TouchableOpacity>
                </View>
                <Text style={styles.profileEmail}>{data.email}</Text>
                <Text style={styles.profileMeta}>@{data.username} · 가입일 {joinedAt}</Text>
              </View>
            </View>
          ) : <Text style={styles.headerError}>{error ?? '정보를 불러오지 못했습니다.'}</Text>}
        </View>

        <View style={styles.content}>
          {error && !loading && <TouchableOpacity style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>다시 시도</Text></TouchableOpacity>}
          <Text style={styles.sectionTitle}>여행 활동</Text>
          <View style={styles.statsCard}>
            {[
              ['저장 코스', data?.travelStats.savedCourseCount ?? 0],
              ['방문 장소', data?.travelStats.visitedPlaceCount ?? 0],
              ['작성 리뷰', data?.travelStats.reviewCount ?? 0],
            ].map(([label, value], index) => (
              <View key={String(label)} style={[styles.stat, index > 0 && styles.statBorder]}>
                <Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>계정 관리</Text>
          <MenuRow icon="person-outline" label="닉네임 변경" onPress={openNickname} />
          <MenuRow icon="lock-closed-outline" label="비밀번호 변경" onPress={() => setEditor('password')} />
          <MenuRow icon="log-out-outline" label="로그아웃" onPress={confirmLogout} danger />
          <View style={styles.footer}><Text style={styles.footerText}>Travelin v1.0.0</Text></View>
        </View>
      </ScrollView>

      <Modal visible={editor !== null} transparent animationType="fade" onRequestClose={closeEditor}>
        <Pressable style={styles.overlay} onPress={closeEditor}>
          <Pressable style={styles.modal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{editor === 'nickname' ? '닉네임 변경' : '비밀번호 변경'}</Text>
            {editor === 'nickname' ? (
              <TextInput style={styles.input} value={nickname} onChangeText={setNickname} maxLength={6} placeholder="새 닉네임 (최대 6자)" />
            ) : <>
              <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="현재 비밀번호" />
              <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="새 비밀번호" />
            </>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeEditor} disabled={saving}><Text>취소</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={() => void (editor === 'nickname' ? submitNickname() : submitPassword())} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>변경</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function MenuRow({ icon, label, onPress, danger = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  return <TouchableOpacity style={styles.menuRow} onPress={onPress}>
    <View style={[styles.menuIcon, danger && styles.dangerBg]}><Ionicons name={icon} size={22} color={danger ? COLORS.red : COLORS.primary} /></View>
    <Text style={[styles.menuLabel, danger && { color: COLORS.red }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary }, scroll: { flex: 1, backgroundColor: COLORS.bg }, scrollContent: { paddingBottom: 110 },
  header: { minHeight: 190, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 30 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '700', marginBottom: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 }, avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, gap: 5 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, profileName: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  profileEmail: { color: 'rgba(255,255,255,0.9)', fontSize: 13 }, profileMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 12 }, headerError: { color: COLORS.white, textAlign: 'center' },
  content: { padding: 24, gap: 12 }, sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  statsCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, paddingVertical: 20, marginBottom: 8 }, stat: { flex: 1, alignItems: 'center', gap: 6 }, statBorder: { borderLeftWidth: 1, borderLeftColor: COLORS.border },
  statValue: { fontSize: 21, fontWeight: '700', color: COLORS.primary }, statLabel: { fontSize: 12, color: COLORS.textSub },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, gap: 14 }, menuIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' }, dangerBg: { backgroundColor: COLORS.redBg }, menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  retry: { alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 9, backgroundColor: COLORS.white, borderRadius: 10 }, retryText: { color: COLORS.primary, fontWeight: '600' },
  footer: { alignItems: 'center', paddingTop: 16 }, footerText: { color: COLORS.textMuted, fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }, modal: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, gap: 14 }, modalTitle: { fontSize: 19, fontWeight: '700', color: COLORS.text },
  input: { height: 50, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, color: COLORS.text }, modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 }, cancelButton: { flex: 1, height: 48, borderRadius: 12, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }, saveButton: { flex: 1, height: 48, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }, saveText: { color: COLORS.white, fontWeight: '700' },
});
