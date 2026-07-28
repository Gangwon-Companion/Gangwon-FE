import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUNITY_COLORS as COLORS } from '../constants';

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onWrite?: () => void;
};

export default function CommunityHeader({ title, subtitle, showBack = false, onBack, onWrite }: Props) {
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconButton} accessibilityLabel="뒤로가기">
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
      </View>
      {!showBack ? (
        <TouchableOpacity onPress={onWrite} style={styles.writeButton} activeOpacity={0.86}>
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          <Text style={styles.writeButtonText}>글쓰기</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 96,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    marginTop: 5,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
  },
  writeButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});
