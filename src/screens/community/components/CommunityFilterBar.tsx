import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUNITY_COLORS as COLORS } from '../constants';

type Props = {
  hashtagSearch: string;
  onChangeHashtagSearch: (value: string) => void;
};

export default function CommunityFilterBar({
  hashtagSearch,
  onChangeHashtagSearch,
}: Props) {
  return (
    <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color={COLORS.textMuted} />
        <TextInput
          value={hashtagSearch}
          onChangeText={onChangeHashtagSearch}
          placeholder="게시글 검색"
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
  );
}

const styles = StyleSheet.create({
  searchBox: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 14,
    marginHorizontal: -4,
    marginBottom: 12,
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
