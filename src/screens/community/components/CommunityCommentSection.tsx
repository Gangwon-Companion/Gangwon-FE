import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMENT_SORT_OPTIONS, COMMUNITY_COLORS as COLORS } from '../constants';
import { CommentSortOption, CommunityComment } from '../types';

type Props = {
  comments: CommunityComment[];
  commentText: string;
  sort: CommentSortOption;
  onChangeCommentText: (text: string) => void;
  onChangeSort: (sort: CommentSortOption) => void;
  onAddComment: () => void;
  onToggleCommentLike: (commentId: number) => void;
};

export default function CommunityCommentSection({
  comments,
  commentText,
  sort,
  onChangeCommentText,
  onChangeSort,
  onAddComment,
  onToggleCommentLike,
}: Props) {
  return (
    <View style={styles.commentSection}>
      <View style={styles.commentHeader}>
        <Text style={styles.sectionTitle}>댓글 {comments.length}</Text>
        <View style={styles.commentSortRow}>
          {COMMENT_SORT_OPTIONS.map((option) => {
            const active = sort === option.key;

            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => onChangeSort(option.key)}
                style={[styles.commentSortButton, active && styles.commentSortButtonActive]}
              >
                <Text style={[styles.commentSortText, active && styles.commentSortTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.commentInputRow}>
        <TextInput
          value={commentText}
          onChangeText={onChangeCommentText}
          placeholder="댓글을 입력하세요"
          placeholderTextColor={COLORS.textMuted}
          style={styles.commentInput}
        />
        <TouchableOpacity onPress={onAddComment} style={styles.commentSubmit}>
          <Ionicons name="send" size={17} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {comments.map((comment) => (
        <View key={comment.id} style={styles.commentItem}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentInitial}>{comment.author.slice(0, 1)}</Text>
          </View>
          <View style={styles.commentBody}>
            <View style={styles.commentMeta}>
              <Text style={styles.commentAuthor}>{comment.author}</Text>
              <Text style={styles.commentTime}>{comment.createdAt}</Text>
            </View>
            <Text style={styles.commentContent}>{comment.content}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onToggleCommentLike(comment.id)}
            style={styles.commentLikeButton}
            accessibilityLabel="댓글 좋아요"
          >
            <Ionicons
              name={comment.liked ? 'heart' : 'heart-outline'}
              size={17}
              color={comment.liked ? COLORS.red : COLORS.textMuted}
            />
            <Text style={[styles.commentLikeText, comment.liked && styles.commentLikeTextActive]}>
              {comment.likeCount}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  commentSection: {
    marginTop: 20,
  },
  commentHeader: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  commentSortRow: {
    flexDirection: 'row',
    gap: 6,
  },
  commentSortButton: {
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  commentSortButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  commentSortText: {
    color: COLORS.textSub,
    fontSize: 12,
    fontWeight: '800',
  },
  commentSortTextActive: {
    color: COLORS.white,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    paddingHorizontal: 13,
  },
  commentSubmit: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInitial: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  commentBody: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  commentTime: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  commentContent: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 19,
  },
  commentLikeButton: {
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  commentLikeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  commentLikeTextActive: {
    color: COLORS.red,
  },
});
