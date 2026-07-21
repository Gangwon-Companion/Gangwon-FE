import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { fetchThemes, Theme } from './api';

const COLORS = {
  primary: '#008A9A',
  primaryLight: '#BFE8E2',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#1F2933',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  red: '#EF4444',
};

export default function ThemeTabScreen() {
  const navigation = useNavigation<any>();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThemes = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchThemes(signal);
      if (signal?.aborted) return;
      setThemes(data);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : '테마 목록을 불러오지 못했습니다.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadThemes(controller.signal);

    return () => controller.abort();
  }, [loadThemes]);

  const handleThemePress = useCallback((theme: Theme) => {
    navigation.navigate('ThemeDestinations', {
      themeId: theme.id,
      themeName: theme.name,
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>여행 테마</Text>
          <Text style={styles.headerSub}>관심 있는 테마를 골라보세요</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>테마 목록</Text>
          <TouchableOpacity
            onPress={() => void loadThemes()}
            style={styles.refreshButton}
            accessibilityRole="button"
            accessibilityLabel="테마 목록 새로고침"
          >
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.messageBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.messageText}>테마를 불러오는 중입니다.</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.messageBox}>
            <Ionicons name="alert-circle-outline" size={36} color={COLORS.red} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadThemes()}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && themes.length === 0 && (
          <View style={styles.messageBox}>
            <Ionicons name="file-tray-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.messageText}>표시할 테마가 없습니다.</Text>
          </View>
        )}

        {!loading && !error && themes.map((theme) => (
          <TouchableOpacity
            key={theme.id}
            activeOpacity={0.85}
            style={styles.themeCard}
            onPress={() => handleThemePress(theme)}
          >
            <View style={styles.themeIcon}>
              <Ionicons name="compass-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.themeInfo}>
              <Text style={styles.themeName}>{theme.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBox: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  messageText: {
    color: COLORS.textSub,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  themeCard: {
    minHeight: 84,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  themeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeInfo: {
    flex: 1,
    minWidth: 0,
  },
  themeName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
