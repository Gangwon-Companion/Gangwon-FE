import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUNITY_COLORS as COLORS } from '../constants';
import { CommunityMedia } from '../types';

type Props = {
  media: CommunityMedia[];
  onOpenMedia?: (media: CommunityMedia) => void;
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
  const [activeIndex, setActiveIndex] = useState(0);

  if (media.length === 0) {
    if (!showEmpty) return null;

    return (
      <View style={styles.emptyMedia}>
        <Ionicons name="images-outline" size={28} color={COLORS.textMuted} />
        <Text style={styles.emptyMediaText}>첨부된 사진 또는 동영상이 없습니다</Text>
      </View>
    );
  }

  const renderTile = (item: CommunityMedia, index: number) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.9}
      style={[styles.mediaTile, styles[`${tileSize}Tile`]]}
      onPress={() => onOpenMedia?.(item)}
      disabled={!onOpenMedia}
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
        <TouchableOpacity onPress={() => onRemoveMedia?.(item.id)} style={styles.removeMediaButton} accessibilityLabel="첨부 삭제">
          <Ionicons name="close" size={15} color={COLORS.white} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );

  if (tileSize === 'post') {
    const pageWidth = Dimensions.get('window').width - 32;
    return (
      <View style={styles.carousel}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth))}
        >
          {media.map((item, index) => (
            <View key={item.id} style={{ width: pageWidth }}>
              {renderTile(item, index)}
            </View>
          ))}
        </ScrollView>
        {media.length > 1 ? (
          <View style={styles.dots}>
            {media.map((item, index) => <View key={item.id} style={[styles.dot, index === activeIndex && styles.activeDot]} />)}
          </View>
        ) : null}
      </View>
    );
  }

  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>{media.map(renderTile)}</ScrollView>;
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
    width: '100%',
    height: (Dimensions.get('window').width - 32) * 1.25,
    borderRadius: 0,
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
  carousel: {
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  dots: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  activeDot: {
    backgroundColor: COLORS.white,
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
