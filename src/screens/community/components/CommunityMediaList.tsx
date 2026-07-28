import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUNITY_COLORS as COLORS } from '../constants';
import { CommunityMedia } from '../types';

type Props = {
  media: CommunityMedia[];
  onOpenMedia: (media: CommunityMedia) => void;
  showEmpty?: boolean;
  tileSize?: 'post' | 'draft' | 'preview';
  removable?: boolean;
  onRemoveMedia?: (mediaId: number) => void;
};

export default function CommunityMediaList({
  media,
  onOpenMedia,
  showEmpty = true,
  tileSize = 'post',
  removable = false,
  onRemoveMedia,
}: Props) {
  if (media.length === 0) {
    if (!showEmpty) return null;

    return (
      <View style={styles.emptyMedia}>
        <Ionicons name="images-outline" size={28} color={COLORS.textMuted} />
        <Text style={styles.emptyMediaText}>첨부된 사진 또는 동영상이 없습니다</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
      {media.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.9}
          style={[styles.mediaTile, styles[`${tileSize}Tile`]]}
          onPress={() => onOpenMedia(item)}
        >
          <Image source={{ uri: item.uri }} style={styles.mediaImage} />
          {tileSize === 'draft' ? (
            <View style={styles.draftMediaNumber}>
              <Text style={styles.draftMediaNumberText}>{index + 1}</Text>
            </View>
          ) : null}
          {item.type === 'video' ? (
            <View style={styles.videoBadge}>
              <Ionicons name="play" size={13} color={COLORS.white} />
              <Text style={styles.videoBadgeText}>동영상</Text>
            </View>
          ) : null}
          {removable ? (
            <TouchableOpacity
              onPress={() => onRemoveMedia?.(item.id)}
              style={styles.removeMediaButton}
              accessibilityLabel="첨부 삭제"
            >
              <Ionicons name="close" size={15} color={COLORS.white} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mediaRow: {
    gap: 10,
    paddingVertical: 14,
  },
  mediaTile: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  postTile: {
    width: 180,
    height: 132,
  },
  draftTile: {
    width: 118,
    height: 118,
  },
  previewTile: {
    width: 96,
    height: 96,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(31,41,51,0.78)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  videoBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyMedia: {
    minHeight: 94,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    marginVertical: 14,
  },
  emptyMediaText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  draftMediaNumber: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftMediaNumberText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },
  removeMediaButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(31,41,51,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
