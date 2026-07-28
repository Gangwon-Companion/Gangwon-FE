import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUNITY_COLORS as COLORS } from '../constants';
import { CommunityMedia, CommunityPost } from '../types';
import CommunityMediaList from './CommunityMediaList';
import TravelCourseCard from './TravelCourseCard';

type Props = {
  post: CommunityPost;
  expanded: boolean;
  onOpenDetail: (postId: number) => void;
  onToggleExpanded: (postId: number) => void;
  onToggleLike: (postId: number) => void;
  onToggleSave: (postId: number) => void;
  onToggleSearchTag: (tag: string) => void;
  onOpenMedia: (media: CommunityMedia) => void;
};

export default function CommunityPostCard({
  post,
  expanded,
  onOpenDetail,
  onToggleExpanded,
  onToggleLike,
  onToggleSave,
  onToggleSearchTag,
  onOpenMedia,
}: Props) {
  const shouldClamp = post.content.length > 90;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.postCard}
      onPress={() => onOpenDetail(post.id)}
    >
      <View style={styles.authorRow}>
        <Image source={{ uri: post.avatar }} style={styles.avatar} />
        <View style={styles.authorText}>
          <Text style={styles.authorName}>{post.author}</Text>
          <Text style={styles.postTime}>{post.createdAt}</Text>
        </View>
        {post.isMine ? <Text style={styles.mineBadge}>내 글</Text> : null}
      </View>

      <Text style={styles.postContent} numberOfLines={expanded ? undefined : 3}>
        {post.content}
      </Text>
      {shouldClamp ? (
        <TouchableOpacity
          onPress={(event) => {
            event.stopPropagation();
            onToggleExpanded(post.id);
          }}
        >
          <Text style={styles.moreText}>{expanded ? '접기' : '글 더보기'}</Text>
        </TouchableOpacity>
      ) : null}

      <CommunityMediaList
        media={post.media}
        onOpenMedia={onOpenMedia}
      />
      <TravelCourseCard course={post.course} />

      <View style={styles.tagRow}>
        {post.hashtags.map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={(event) => {
              event.stopPropagation();
              onToggleSearchTag(tag);
            }}
            style={styles.tagChip}
          >
            <Text style={styles.tagText}>#{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={(event) => {
            event.stopPropagation();
            onToggleLike(post.id);
          }}
          style={styles.actionButton}
        >
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={19} color={post.liked ? COLORS.red : COLORS.textSub} />
          <Text style={styles.actionText}>{post.likeCount}</Text>
        </TouchableOpacity>
        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSub} />
          <Text style={styles.actionText}>{post.comments.length}</Text>
        </View>
        <TouchableOpacity
          onPress={(event) => {
            event.stopPropagation();
            onToggleSave(post.id);
          }}
          style={styles.actionButton}
        >
          <Ionicons name={post.saved ? 'bookmark' : 'bookmark-outline'} size={18} color={post.saved ? COLORS.primary : COLORS.textSub} />
          <Text style={styles.actionText}>{post.saveCount}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.border,
  },
  authorText: {
    flex: 1,
  },
  authorName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  postTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  mineBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  postContent: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  moreText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },
  tagChip: {
    borderRadius: 999,
    backgroundColor: '#EEF2F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: COLORS.textSub,
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 14,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    color: COLORS.textSub,
    fontSize: 13,
    fontWeight: '800',
  },
});
