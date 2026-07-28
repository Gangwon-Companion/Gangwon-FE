import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import CommunityCommentSection from './components/CommunityCommentSection';
import CommunityFilterBar from './components/CommunityFilterBar';
import CommunityHeader from './components/CommunityHeader';
import CommunityMediaList from './components/CommunityMediaList';
import CommunityMediaViewerModal from './components/CommunityMediaViewerModal';
import CommunityPagination from './components/CommunityPagination';
import CommunityPostCard from './components/CommunityPostCard';
import CommunityPostForm from './components/CommunityPostForm';
import TravelCourseCard from './components/TravelCourseCard';
import {
  COMMUNITY_COLORS as COLORS,
  DAY_MS,
  MAX_MEDIA_COUNT,
  PERIOD_OPTIONS,
  POST_PAGE_SIZE,
} from './constants';
import {
  CommunityMedia,
  CommunityPost,
  CommentSortOption,
  DraftPost,
  MediaType,
  PeriodOption,
  SortOption,
} from './types';
import {
  EMPTY_DRAFT_POST,
  MEDIA_PRESETS,
  MOCK_COMMUNITY_POSTS,
  MY_TRAVEL_COURSES,
} from './mockCommunityData';

type ScreenMode = 'list' | 'detail' | 'form';

export default function CommunityScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [mode, setMode] = useState<ScreenMode>('list');
  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_COMMUNITY_POSTS);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftPost>(EMPTY_DRAFT_POST);
  const [sort, setSort] = useState<SortOption>('latest');
  const [period, setPeriod] = useState<PeriodOption>('all');
  const [hashtagSearch, setHashtagSearch] = useState('');
  const [expandedPostIds, setExpandedPostIds] = useState<number[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSort, setCommentSort] = useState<CommentSortOption>('latest');
  const [page, setPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<CommunityMedia | null>(null);

  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null;
  const editingPost = posts.find((post) => post.id === editingPostId) ?? null;

  const popularTags = useMemo(() => {
    const tags = posts.flatMap((post) => post.hashtags);
    return Array.from(new Set(tags)).slice(0, 8);
  }, [posts]);

  const visiblePosts = useMemo(() => {
    const searchTerms = hashtagSearch
      .split(/[\s,]+/)
      .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean);
    const selectedPeriod = PERIOD_OPTIONS.find((option) => option.key === period);
    const periodStartMs = selectedPeriod?.days ? Date.now() - selectedPeriod.days * DAY_MS : null;

    const filtered = posts.filter((post) => {
      const inPeriod = periodStartMs ? post.createdAtMs >= periodStartMs : true;
      const hasAllTags =
        searchTerms.length === 0 ||
        searchTerms.every((term) =>
          post.hashtags.some((tag) => tag.toLowerCase().includes(term)),
        );

      return inPeriod && hasAllTags;
    });

    return [...filtered].sort((left, right) => {
      if (sort === 'likes') return right.likeCount - left.likeCount;
      if (sort === 'saves') return right.saveCount - left.saveCount;
      return right.createdAtMs - left.createdAtMs;
    });
  }, [hashtagSearch, period, posts, sort]);

  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / POST_PAGE_SIZE));
  const pagedPosts = useMemo(() => {
    const start = (page - 1) * POST_PAGE_SIZE;
    return visiblePosts.slice(start, start + POST_PAGE_SIZE);
  }, [page, visiblePosts]);

  const sortedComments = useMemo(() => {
    if (!selectedPost) return [];

    return [...selectedPost.comments].sort((left, right) => {
      if (commentSort === 'likes') return right.likeCount - left.likeCount;
      return right.createdAtMs - left.createdAtMs;
    });
  }, [commentSort, selectedPost]);

  useEffect(() => {
    setPage(1);
  }, [hashtagSearch, period, sort]);

  const openCreateForm = () => {
    setEditingPostId(null);
    setDraft(EMPTY_DRAFT_POST);
    setMode('form');
  };

  const openEditForm = (post: CommunityPost) => {
    setEditingPostId(post.id);
    setDraft({
      content: post.content,
      hashtags: post.hashtags.join(' '),
      media: post.media,
      courseId: post.course?.id ?? null,
    });
    setMode('form');
  };

  const openDetail = (postId: number) => {
    setSelectedPostId(postId);
    setCommentText('');
    setMode('detail');
  };

  const goBack = () => {
    if (mode === 'form' && editingPostId) {
      setMode('detail');
      return;
    }

    setMode('list');
    setEditingPostId(null);
    setSelectedPostId(null);
  };

  const toggleSearchTag = (tag: string) => {
    const nextTag = tag.replace(/^#/, '');
    const currentTags = hashtagSearch
      .split(/[\s,]+/)
      .map((item) => item.trim().replace(/^#/, ''))
      .filter(Boolean);
    const hasTag = currentTags.some((item) => item.toLowerCase() === nextTag.toLowerCase());
    const nextTags = hasTag
      ? currentTags.filter((item) => item.toLowerCase() !== nextTag.toLowerCase())
      : [...currentTags, nextTag];

    setHashtagSearch(nextTags.map((item) => `#${item}`).join(' '));
  };

  const updatePost = (postId: number, updater: (post: CommunityPost) => CommunityPost) => {
    setPosts((current) => current.map((post) => (post.id === postId ? updater(post) : post)));
  };

  const toggleLike = (postId: number) => {
    updatePost(postId, (post) => ({
      ...post,
      liked: !post.liked,
      likeCount: post.likeCount + (post.liked ? -1 : 1),
    }));
  };

  const toggleSave = (postId: number) => {
    updatePost(postId, (post) => ({
      ...post,
      saved: !post.saved,
      saveCount: post.saveCount + (post.saved ? -1 : 1),
    }));
  };

  const toggleExpanded = (postId: number) => {
    setExpandedPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId],
    );
  };

  const addComment = () => {
    const content = commentText.trim();
    if (!selectedPost || !content) return;

    updatePost(selectedPost.id, (post) => ({
      ...post,
      comments: [
        ...post.comments,
        {
          id: Date.now(),
          author: '나',
          content,
          createdAt: '방금 전',
          createdAtMs: Date.now(),
          liked: false,
          likeCount: 0,
        },
      ],
    }));
    setCommentText('');
  };

  const toggleCommentLike = (postId: number, commentId: number) => {
    updatePost(postId, (post) => ({
      ...post,
      comments: post.comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              liked: !comment.liked,
              likeCount: comment.likeCount + (comment.liked ? -1 : 1),
            }
          : comment,
      ),
    }));
  };

  const addDraftMedia = (type: MediaType) => {
    setDraft((current) => {
      if (current.media.length >= MAX_MEDIA_COUNT) {
        Alert.alert('첨부 개수 제한', `사진과 동영상은 합쳐서 최대 ${MAX_MEDIA_COUNT}개까지 추가할 수 있어요.`);
        return current;
      }

      const presetList = MEDIA_PRESETS[type];
      const sameTypeCount = current.media.filter((item) => item.type === type).length;
      const preset = presetList[sameTypeCount % presetList.length];

      return {
        ...current,
        media: [
          ...current.media,
          {
            id: Date.now() + current.media.length,
            type,
            uri: preset.uri,
            originalUri: preset.originalUri,
          },
        ],
      };
    });
  };

  const removeDraftMedia = (mediaId: number) => {
    setDraft((current) => ({
      ...current,
      media: current.media.filter((item) => item.id !== mediaId),
    }));
  };

  const submitPost = () => {
    const content = draft.content.trim();
    if (!content) {
      Alert.alert('내용을 입력해주세요', '커뮤니티에 공유할 여행 이야기를 적어주세요.');
      return;
    }

    const hashtags = draft.hashtags
      .split(/[\s,]+/)
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter(Boolean);
    const course = MY_TRAVEL_COURSES.find((item) => item.id === draft.courseId);
    const media = draft.media;

    if (editingPost) {
      updatePost(editingPost.id, (post) => ({
        ...post,
        content,
        hashtags,
        course,
        media,
      }));
      setSelectedPostId(editingPost.id);
      setMode('detail');
      return;
    }

    const newPost: CommunityPost = {
      id: Date.now(),
      author: '나',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop',
      isMine: true,
      content,
      media,
      course,
      hashtags,
      liked: false,
      saved: false,
      likeCount: 0,
      saveCount: 0,
      comments: [],
      createdAt: '방금 전',
      createdAtMs: Date.now(),
    };

    setPosts((current) => [newPost, ...current]);
    setSelectedPostId(newPost.id);
    setMode('detail');
  };

  const renderList = () => (
    <>
      <CommunityHeader
        title="커뮤니티"
        subtitle="강원 여행 기록을 나누고 저장해보세요"
        onWrite={openCreateForm}
      />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
      >
        <CommunityFilterBar
          hashtagSearch={hashtagSearch}
          popularTags={popularTags}
          period={period}
          sort={sort}
          onChangeHashtagSearch={setHashtagSearch}
          onToggleSearchTag={toggleSearchTag}
          onChangePeriod={setPeriod}
          onChangeSort={setSort}
        />

        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>게시글 {visiblePosts.length}개</Text>
          <Text style={styles.savedHint}>페이지당 {POST_PAGE_SIZE}개 · 관심기록 {posts.filter((post) => post.saved).length}개</Text>
        </View>

        {visiblePosts.length > 0 ? (
          <>
            {pagedPosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                expanded={expandedPostIds.includes(post.id)}
                onOpenDetail={openDetail}
                onToggleExpanded={toggleExpanded}
                onToggleLike={toggleLike}
                onToggleSave={toggleSave}
                onToggleSearchTag={toggleSearchTag}
                onOpenMedia={setSelectedMedia}
              />
            ))}
            <CommunityPagination
              page={page}
              totalPages={totalPages}
              hidden={visiblePosts.length <= POST_PAGE_SIZE}
              onChangePage={setPage}
            />
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={38} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>관련 게시글이 없습니다</Text>
            <Text style={styles.emptyDesc}>다른 해시태그로 검색해보세요.</Text>
          </View>
        )}
      </ScrollView>
    </>
  );

  const renderDetail = () => {
    if (!selectedPost) {
      return (
        <>
          <CommunityHeader title="게시글 상세" showBack onBack={goBack} />
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>게시글을 찾을 수 없습니다.</Text>
          </View>
        </>
      );
    }

    const expanded = expandedPostIds.includes(selectedPost.id);

    return (
      <>
        <CommunityHeader title="게시글 상세" showBack onBack={goBack} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
          >
            <View style={styles.detailCard}>
              <View style={styles.authorRow}>
                <Image source={{ uri: selectedPost.avatar }} style={styles.avatar} />
                <View style={styles.authorText}>
                  <Text style={styles.authorName}>{selectedPost.author}</Text>
                  <Text style={styles.postTime}>{selectedPost.createdAt}</Text>
                </View>
                {selectedPost.isMine ? (
                  <TouchableOpacity onPress={() => openEditForm(selectedPost)} style={styles.editButton}>
                    <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.editButtonText}>수정</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={styles.detailContent} numberOfLines={expanded ? undefined : 5}>
                {selectedPost.content}
              </Text>
              {selectedPost.content.length > 120 ? (
                <TouchableOpacity onPress={() => toggleExpanded(selectedPost.id)}>
                  <Text style={styles.moreText}>{expanded ? '접기' : '글 더보기'}</Text>
                </TouchableOpacity>
              ) : null}

              <CommunityMediaList media={selectedPost.media} onOpenMedia={setSelectedMedia} />
              <TravelCourseCard course={selectedPost.course} />

              <View style={styles.tagRow}>
                {selectedPost.hashtags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.detailActions}>
                <TouchableOpacity onPress={() => toggleLike(selectedPost.id)} style={styles.detailActionButton}>
                  <Ionicons name={selectedPost.liked ? 'heart' : 'heart-outline'} size={21} color={selectedPost.liked ? COLORS.red : COLORS.textSub} />
                  <Text style={styles.detailActionText}>좋아요 {selectedPost.likeCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleSave(selectedPost.id)} style={styles.detailActionButton}>
                  <Ionicons name={selectedPost.saved ? 'bookmark' : 'bookmark-outline'} size={20} color={selectedPost.saved ? COLORS.primary : COLORS.textSub} />
                  <Text style={styles.detailActionText}>관심기록 {selectedPost.saveCount}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <CommunityCommentSection
              comments={sortedComments}
              commentText={commentText}
              sort={commentSort}
              onChangeCommentText={setCommentText}
              onChangeSort={setCommentSort}
              onAddComment={addComment}
              onToggleCommentLike={(commentId) => toggleCommentLike(selectedPost.id, commentId)}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  };

  const renderForm = () => (
    <>
      <CommunityHeader
        title={editingPost ? '게시글 수정' : '게시글 작성'}
        subtitle="여행 기록과 코스를 함께 공유해보세요"
        showBack
        onBack={goBack}
      />
      <CommunityPostForm
        draft={draft}
        courses={MY_TRAVEL_COURSES}
        isEditing={Boolean(editingPost)}
        bottomPadding={tabBarHeight + 24}
        onChangeDraft={setDraft}
        onAddMedia={addDraftMedia}
        onRemoveMedia={removeDraftMedia}
        onOpenMedia={setSelectedMedia}
        onSubmit={submitPost}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      {mode === 'list' ? renderList() : null}
      {mode === 'detail' ? renderDetail() : null}
      {mode === 'form' ? renderForm() : null}
      <CommunityMediaViewerModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  savedHint: {
    color: COLORS.textSub,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
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
  editButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
  },
  editButtonText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  detailContent: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
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
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  detailActionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  detailActionText: {
    color: COLORS.textSub,
    fontSize: 13,
    fontWeight: '800',
  },
});
