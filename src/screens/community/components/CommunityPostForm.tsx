import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUNITY_COLORS as COLORS, MAX_MEDIA_COUNT } from '../constants';
import { CommunityMedia, DraftPost, MediaType, TravelCourse } from '../types';
import CommunityMediaList from './CommunityMediaList';
import TravelCourseCard from './TravelCourseCard';

type Props = {
  draft: DraftPost;
  courses: TravelCourse[];
  isEditing: boolean;
  bottomPadding: number;
  onChangeDraft: (draft: DraftPost) => void;
  onAddMedia: (type: MediaType) => void;
  onRemoveMedia: (mediaId: number) => void;
  onOpenMedia: (media: CommunityMedia) => void;
  onSubmit: () => void;
};

export default function CommunityPostForm({
  draft,
  courses,
  isEditing,
  bottomPadding,
  onChangeDraft,
  onAddMedia,
  onRemoveMedia,
  onOpenMedia,
  onSubmit,
}: Props) {
  const selectedCourse = courses.find((course) => course.id === draft.courseId);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
      >
        <Text style={styles.inputLabel}>제목</Text>
        <TextInput
          value={draft.title}
          onChangeText={(title) => onChangeDraft({ ...draft, title })}
          placeholder="게시글 제목을 입력해주세요"
          placeholderTextColor={COLORS.textMuted}
          style={styles.titleInput}
          maxLength={120}
        />

        <Text style={styles.inputLabel}>글 내용</Text>
        <TextInput
          value={draft.content}
          onChangeText={(content) => onChangeDraft({ ...draft, content })}
          placeholder="강원 여행 이야기를 들려주세요."
          placeholderTextColor={COLORS.textMuted}
          style={styles.contentInput}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.inputLabel}>사진/동영상</Text>
        <View style={styles.attachMetaRow}>
          <Text style={styles.attachMetaText}>
            사진과 동영상 합쳐서 {draft.media.length}/{MAX_MEDIA_COUNT}개 첨부
          </Text>
        </View>
        <View style={styles.attachRow}>
          <TouchableOpacity onPress={() => onAddMedia('image')} style={styles.attachButton}>
            <Ionicons name="image-outline" size={20} color={COLORS.primary} />
            <Text style={styles.attachText}>사진 추가</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onAddMedia('video')} style={styles.attachButton}>
            <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
            <Text style={styles.attachText}>동영상 추가</Text>
          </TouchableOpacity>
        </View>
        {draft.media.length > 0 ? (
          <CommunityMediaList
            media={draft.media}
            tileSize="draft"
            removable
            onOpenMedia={onOpenMedia}
            onRemoveMedia={onRemoveMedia}
          />
        ) : (
          <View style={styles.draftEmptyMedia}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.textMuted} />
            <Text style={styles.draftEmptyText}>사진 또는 동영상을 추가하면 여기에 표시됩니다.</Text>
          </View>
        )}

        <Text style={styles.inputLabel}>저장된 여행 코스</Text>
        {courses.map((course) => {
          const active = draft.courseId === course.id;
          return (
            <TouchableOpacity
              key={course.id}
              onPress={() => onChangeDraft({ ...draft, courseId: active ? null : course.id })}
              style={[styles.courseSelect, active && styles.courseSelectActive]}
            >
              <View style={styles.courseSelectIcon}>
                <Ionicons name={active ? 'checkmark' : 'map-outline'} size={18} color={active ? COLORS.white : COLORS.primary} />
              </View>
              <View style={styles.courseSelectText}>
                <Text style={styles.courseSelectTitle}>{course.title}</Text>
                <Text style={styles.courseSelectSub}>{course.days} · {course.places.join(' -> ')}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.inputLabel}>해시태그</Text>
        <TextInput
          value={draft.hashtags}
          onChangeText={(hashtags) => onChangeDraft({ ...draft, hashtags })}
          placeholder="예: 강릉 반려동물동반 바다산책"
          placeholderTextColor={COLORS.textMuted}
          style={styles.hashtagInput}
        />

        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>게시 전 미리보기</Text>
          <Text style={styles.previewContent} numberOfLines={3}>
            {draft.content || '작성한 내용이 여기에 표시됩니다.'}
          </Text>
          {draft.media.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewMediaRow}>
              {draft.media.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  style={styles.previewMediaTile}
                  onPress={() => onOpenMedia(item)}
                >
                  <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                  {item.type === 'video' ? (
                    <View style={styles.videoBadge}>
                      <Ionicons name="play" size={13} color={COLORS.white} />
                      <Text style={styles.videoBadgeText}>동영상</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
          <TravelCourseCard course={selectedCourse} />
        </View>

        <TouchableOpacity onPress={onSubmit} style={styles.submitButton} activeOpacity={0.9}>
          <Text style={styles.submitText}>{isEditing ? '수정 완료' : '게시글 등록'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 9,
  },
  contentInput: {
    minHeight: 168,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    padding: 14,
    marginBottom: 20,
  },
  titleInput: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: 15,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  attachMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -4,
    marginBottom: 8,
  },
  attachMetaText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  attachRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  attachButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  attachText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  draftEmptyMedia: {
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginBottom: 20,
  },
  draftEmptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  courseSelect: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    padding: 12,
    marginBottom: 10,
  },
  courseSelectActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FBF9',
  },
  courseSelectIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseSelectText: {
    flex: 1,
  },
  courseSelectTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  courseSelectSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  hashtagInput: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    paddingHorizontal: 13,
    marginBottom: 20,
  },
  previewBox: {
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 16,
  },
  previewTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  previewContent: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 20,
  },
  previewMediaRow: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 10,
  },
  previewMediaTile: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
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
  submitButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
});
