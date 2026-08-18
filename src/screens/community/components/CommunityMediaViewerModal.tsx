import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUNITY_COLORS as COLORS } from '../constants';
import { CommunityMedia } from '../types';

type Props = {
  media: CommunityMedia | null;
  onClose: () => void;
};

export default function CommunityMediaViewerModal({ media, onClose }: Props) {
  return (
    <Modal
      visible={Boolean(media)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.mediaModal}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.mediaModalClose}
          accessibilityLabel="미디어 닫기"
        >
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        {media ? (
          <View style={styles.mediaModalBody}>
            <Image
              source={{ uri: media.uri }}
              style={styles.mediaModalImage}
              resizeMode="contain"
            />
            <View style={styles.mediaModalCaption}>
              <Ionicons
                name={media.type === 'video' ? 'play-circle-outline' : 'image-outline'}
                size={18}
                color={COLORS.white}
              />
              <Text style={styles.mediaModalText}>
                {media.type === 'video' ? '동영상 원본 보기' : '사진 원본 보기'}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mediaModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  mediaModalClose: {
    position: 'absolute',
    right: 18,
    top: 42,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaModalBody: {
    alignItems: 'center',
    gap: 16,
  },
  mediaModalImage: {
    width: '100%',
    height: '78%',
  },
  mediaModalCaption: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
  },
  mediaModalText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
