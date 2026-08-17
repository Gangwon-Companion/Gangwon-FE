import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import CommunityMediaList from './CommunityMediaList';
import { CommunityPost } from '../types';

const COLORS = {
  background: '#F5F7F8',
  card: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#8A9199',
  border: '#E5E8EA',
  accent: '#0E9BA6',
};

type Props = {
  post: CommunityPost;
  expanded: boolean;
  onOpenDetail: (postId: number) => void;
  onToggleExpanded: (postId: number) => void;
  onToggleLike: (postId: number) => void;
  onToggleSave: (postId: number) => void;
};

export default function CommunityPostCard({
  post,
  expanded,
  onOpenDetail,
  onToggleExpanded,
  onToggleLike,
  onToggleSave,
}: Props) {
  const previewComments = post.comments.slice(0, 2);
  const isLongCaption = post.content.length > 90;
  const location = post.course?.places?.[0] ?? '강원도';

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => onOpenDetail(post.id)} activeOpacity={0.85}>
        <Image source={{ uri: post.avatar }} style={styles.avatar} />
        <View style={styles.headerCopy}>
          <Text style={styles.authorName} numberOfLines={1}>{post.author}</Text>
          <Text style={styles.meta} numberOfLines={1}>{location} · {post.createdAt}</Text>
        </View>
        <TouchableOpacity onPress={() => onOpenDetail(post.id)} style={styles.moreButton} accessibilityLabel="게시물 더보기">
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.mediaContainer}>
        <CommunityMediaList media={post.media} />
        {post.course ? (
          <View style={styles.regionBadge}><Text style={styles.regionBadgeText}>강원</Text></View>
        ) : null}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onToggleLike(post.id)} accessibilityLabel="좋아요">
            <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={24} color={post.liked ? COLORS.accent : COLORS.text} />
            <Text style={styles.actionCount}>{post.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onOpenDetail(post.id)} accessibilityLabel="댓글 보기">
            <Ionicons name="chatbubble-outline" size={24} color={COLORS.text} />
            <Text style={styles.actionCount}>{post.comments.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookmarkButton} onPress={() => onToggleSave(post.id)} accessibilityLabel="게시물 저장">
            <Ionicons name={post.saved ? 'bookmark' : 'bookmark-outline'} size={24} color={post.saved ? COLORS.accent : COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.proofRow}>
          <Image source={{ uri: post.avatar }} style={styles.miniAvatar} />
          <Text style={styles.proofText}><Text style={styles.semibold}>{post.author}</Text>님 외 여러 명이 좋아합니다</Text>
        </View>

        <TouchableOpacity onPress={() => onOpenDetail(post.id)} activeOpacity={0.9}>
          <Text style={styles.caption} numberOfLines={expanded ? undefined : 2}>
            <Text style={styles.semibold}>{post.author}</Text>{' '}{post.content}
          </Text>
          {isLongCaption ? (
            <Text style={styles.moreText} onPress={() => onToggleExpanded(post.id)}>{expanded ? '접기' : '더 보기'}</Text>
          ) : null}
        </TouchableOpacity>

        {previewComments.map((comment) => (
          <TouchableOpacity key={comment.id} style={styles.commentRow} onPress={() => onOpenDetail(post.id)}>
            <Text style={styles.commentText} numberOfLines={1}>
              <Text style={styles.semibold}>{comment.author}</Text>{' '}{comment.content}
            </Text>
            <Ionicons name="heart-outline" size={16} color={COLORS.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: -4,
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: COLORS.card,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.border },
  headerCopy: { flex: 1, marginLeft: 10 },
  authorName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  meta: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  moreButton: { width: 30, height: 30, alignItems: 'flex-end', justifyContent: 'center' },
  mediaContainer: { position: 'relative', backgroundColor: COLORS.card },
  regionBadge: { position: 'absolute', top: 10, right: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4 },
  regionBadgeText: { color: '#FFFFFF', fontSize: 12 },
  cardContent: { paddingHorizontal: 14 },
  actionBar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { color: COLORS.text, fontSize: 13 },
  bookmarkButton: { marginLeft: 'auto' },
  proofRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  miniAvatar: { width: 16, height: 16, borderRadius: 8, marginRight: 7 },
  proofText: { color: COLORS.muted, fontSize: 14 },
  semibold: { color: COLORS.text, fontWeight: '600' },
  caption: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  moreText: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
  commentRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  commentText: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 20 },
});
