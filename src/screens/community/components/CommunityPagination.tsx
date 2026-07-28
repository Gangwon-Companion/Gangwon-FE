import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUNITY_COLORS as COLORS } from '../constants';

type Props = {
  page: number;
  totalPages: number;
  hidden?: boolean;
  onChangePage: (page: number) => void;
};

export default function CommunityPagination({ page, totalPages, hidden = false, onChangePage }: Props) {
  if (hidden) return null;

  return (
    <View style={styles.pagination}>
      <TouchableOpacity
        disabled={page === 1}
        onPress={() => onChangePage(Math.max(1, page - 1))}
        style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
      >
        <Ionicons name="chevron-back" size={17} color={page === 1 ? COLORS.textMuted : COLORS.primary} />
        <Text style={[styles.pageButtonText, page === 1 && styles.pageButtonTextDisabled]}>이전</Text>
      </TouchableOpacity>

      <Text style={styles.pageText}>{page} / {totalPages}</Text>

      <TouchableOpacity
        disabled={page === totalPages}
        onPress={() => onChangePage(Math.min(totalPages, page + 1))}
        style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
      >
        <Text style={[styles.pageButtonText, page === totalPages && styles.pageButtonTextDisabled]}>다음</Text>
        <Ionicons name="chevron-forward" size={17} color={page === totalPages ? COLORS.textMuted : COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pagination: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  pageButton: {
    minWidth: 88,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  pageButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  pageText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
