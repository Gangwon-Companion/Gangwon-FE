import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PlaceReview, ReviewPayload } from '../api';

type Props = {
  reviews: PlaceReview[];
  reviewCount: number;
  submitting: boolean;
  onCreate: (payload: ReviewPayload) => Promise<void>;
  onUpdate: (reviewId: number, payload: ReviewPayload) => Promise<void>;
  onDelete: (reviewId: number) => Promise<void>;
};

const COLORS = {
  primary: '#008A9A',
  white: '#FFFFFF',
  text: '#1F2933',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  bg: '#F7F8FA',
  red: '#EF4444',
};

const RATINGS = [1, 2, 3, 4, 5];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR');
}

function RatingPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.ratingPicker}>
      {RATINGS.map((rating) => (
        <TouchableOpacity
          key={rating}
          onPress={() => onChange(rating)}
          style={[styles.ratingButton, value === rating && styles.ratingButtonActive]}
        >
          <Ionicons name="star" size={14} color={value >= rating ? '#EAB308' : COLORS.textMuted} />
          <Text style={[styles.ratingButtonText, value === rating && styles.ratingButtonTextActive]}>
            {rating}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ReviewSection({
  reviews,
  reviewCount,
  submitting,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);

  useEffect(() => {
    if (!submitting) return;
    setEditingId((current) => current);
  }, [submitting]);

  const submitCreate = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      Alert.alert('입력 확인', '리뷰 내용을 입력해 주세요.');
      return;
    }

    await onCreate({ content: trimmedContent, rating });
    setContent('');
    setRating(5);
  };

  const startEdit = (review: PlaceReview) => {
    setEditingId(review.reviewId);
    setEditContent(review.content);
    setEditRating(review.rating);
  };

  const submitUpdate = async (reviewId: number) => {
    const trimmedContent = editContent.trim();
    if (!trimmedContent) {
      Alert.alert('입력 확인', '리뷰 내용을 입력해 주세요.');
      return;
    }

    await onUpdate(reviewId, { content: trimmedContent, rating: editRating });
    setEditingId(null);
    setEditContent('');
    setEditRating(5);
  };

  const confirmDelete = (reviewId: number) => {
    const runDelete = () => void onDelete(reviewId);
    if (Platform.OS === 'web') {
      if (globalThis.confirm('리뷰를 삭제할까요?')) runDelete();
      return;
    }

    Alert.alert('리뷰 삭제', '리뷰를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: runDelete },
    ]);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>리뷰</Text>
        <Text style={styles.reviewCount}>{reviewCount}개</Text>
      </View>

      <View style={styles.form}>
        <RatingPicker value={rating} onChange={setRating} />
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="리뷰를 작성해 주세요."
          placeholderTextColor={COLORS.textMuted}
          multiline
        />
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={() => void submitCreate()}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitButtonText}>등록</Text>}
        </TouchableOpacity>
      </View>

      {reviews.length > 0 ? (
        <View style={styles.reviewList}>
          {reviews.map((review) => (
            <View key={review.reviewId} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewNickname}>{review.nickname}</Text>
                <View style={styles.reviewRating}>
                  <Ionicons name="star" size={13} color="#EAB308" />
                  <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
                </View>
              </View>

              {editingId === review.reviewId ? (
                <View style={styles.editBox}>
                  <RatingPicker value={editRating} onChange={setEditRating} />
                  <TextInput
                    style={styles.input}
                    value={editContent}
                    onChangeText={setEditContent}
                    placeholder="리뷰를 수정해 주세요."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                  />
                  <View style={styles.reviewActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setEditingId(null)} disabled={submitting}>
                      <Text style={styles.actionButtonText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButtonPrimary, submitting && styles.buttonDisabled]}
                      onPress={() => void submitUpdate(review.reviewId)}
                      disabled={submitting}
                    >
                      <Text style={styles.actionButtonPrimaryText}>수정</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.reviewContent}>{review.content}</Text>
                  <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                  <View style={styles.reviewActions}>
                    <TouchableOpacity style={styles.textAction} onPress={() => startEdit(review)}>
                      <Text style={styles.textActionText}>수정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.textAction} onPress={() => confirmDelete(review.reviewId)}>
                      <Text style={[styles.textActionText, styles.deleteText]}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>아직 등록된 리뷰가 없습니다.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  reviewCount: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  form: { gap: 10, marginBottom: 16 },
  ratingPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ratingButton: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 10,
  },
  ratingButtonActive: { borderColor: COLORS.primary, backgroundColor: '#E3F4F2' },
  ratingButtonText: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' },
  ratingButtonTextActive: { color: COLORS.primary },
  input: {
    minHeight: 82,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  submitButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  buttonDisabled: { opacity: 0.7 },
  reviewList: { gap: 10 },
  reviewCard: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, gap: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  reviewNickname: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  reviewRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewRatingText: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' },
  reviewContent: { color: COLORS.textSub, fontSize: 14, lineHeight: 21 },
  reviewDate: { color: COLORS.textMuted, fontSize: 12 },
  reviewActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  textAction: { paddingHorizontal: 8, paddingVertical: 4 },
  textActionText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  deleteText: { color: COLORS.red },
  editBox: { gap: 10 },
  actionButton: {
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  actionButtonText: { color: COLORS.textSub, fontSize: 13, fontWeight: '800' },
  actionButtonPrimary: {
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  actionButtonPrimaryText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20 },
});
