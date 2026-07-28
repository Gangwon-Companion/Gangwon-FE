import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUNITY_COLORS as COLORS, PERIOD_OPTIONS, SORT_OPTIONS } from '../constants';
import { PeriodOption, SortOption } from '../types';

type Props = {
  hashtagSearch: string;
  popularTags: string[];
  period: PeriodOption;
  sort: SortOption;
  onChangeHashtagSearch: (value: string) => void;
  onToggleSearchTag: (tag: string) => void;
  onChangePeriod: (period: PeriodOption) => void;
  onChangeSort: (sort: SortOption) => void;
};

export default function CommunityFilterBar({
  hashtagSearch,
  popularTags,
  period,
  sort,
  onChangeHashtagSearch,
  onToggleSearchTag,
  onChangePeriod,
  onChangeSort,
}: Props) {
  const selectedTags = hashtagSearch
    .split(/[\s,]+/)
    .map((item) => item.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean);

  return (
    <>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color={COLORS.textMuted} />
        <TextInput
          value={hashtagSearch}
          onChangeText={onChangeHashtagSearch}
          placeholder="해시태그 여러 개 검색 예: #강릉 #바다산책"
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {hashtagSearch ? (
          <TouchableOpacity onPress={() => onChangeHashtagSearch('')} accessibilityLabel="검색어 지우기">
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickTagRow}>
        {popularTags.map((tag) => {
          const selected = selectedTags.includes(tag.toLowerCase());

          return (
            <TouchableOpacity
              key={tag}
              onPress={() => onToggleSearchTag(tag)}
              style={[styles.quickTag, selected && styles.quickTagActive]}
            >
              <Text style={[styles.quickTagText, selected && styles.quickTagTextActive]}>#{tag}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
        {PERIOD_OPTIONS.map((option) => {
          const active = period === option.key;

          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => onChangePeriod(option.key)}
              style={[styles.periodButton, active && styles.periodButtonActive]}
            >
              <Text style={[styles.periodText, active && styles.periodTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((option) => {
          const active = sort === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => onChangeSort(option.key)}
              style={[styles.sortButton, active && styles.sortButtonActive]}
            >
              <Ionicons name={option.icon} size={15} color={active ? COLORS.white : COLORS.textSub} />
              <Text style={[styles.sortText, active && styles.sortTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  quickTagRow: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 18,
  },
  quickTag: {
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickTagActive: {
    backgroundColor: COLORS.primary,
  },
  quickTagText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  quickTagTextActive: {
    color: COLORS.white,
  },
  periodRow: {
    gap: 8,
    paddingBottom: 14,
  },
  periodButton: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  periodButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  periodText: {
    color: COLORS.textSub,
    fontSize: 12,
    fontWeight: '800',
  },
  periodTextActive: {
    color: COLORS.white,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  sortButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortText: {
    color: COLORS.textSub,
    fontSize: 12,
    fontWeight: '800',
  },
  sortTextActive: {
    color: COLORS.white,
  },
});
