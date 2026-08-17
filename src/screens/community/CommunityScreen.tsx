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
import {
  CommunityApiComment,
  CommunityApiImage,
  CommunityApiPostDetail,
  CommunityApiPostSummary,
  createCommunityComment,
  createCommunityPost,
  deleteCommunityPost,
  fetchCommunityPost,
  fetchCommunityPosts,
  likeCommunityPost,
  updateCommunityPost,
} from './api';

type ScreenMode = 'list' | 'detail' | 'form';

function toComment(comment: CommunityApiComment): CommunityPost['comments'][number] {
  return {
    id: comment.id,
    author: comment.author,
    content: comment.content,
    createdAt: comment.createdAt,
    createdAtMs: Date.parse(comment.createdAt) || Date.now(),
    liked: false,
    likeCount: 0,
  };
}

function summaryToPost(post: CommunityApiPostSummary): CommunityPost {
  return {
    id: post.id,
    title: post.title,
    author: post.author,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
    isMine: false,
    content: post.title,
    media: [],
    course: post.courseId ? MY_TRAVEL_COURSES.find((course) => course.id === post.courseId) : undefined,
    hashtags: [],
    liked: false,
    saved: false,
    likeCount: post.likeCount,
    saveCount: 0,
    comments: [],
    createdAt: post.createdAt,
    createdAtMs: Date.parse(post.createdAt) || Date.now(),
  };
}

function detailToPost(post: CommunityApiPostDetail, previous?: CommunityPost): CommunityPost {
  const media: CommunityMedia[] = post.images.map((image: CommunityApiImage, index) => ({
    id: index + 1,
    type: 'image',
    uri: image.url,
    originalUri: image.s3Key,
  }));
  return {
    ...(previous ?? summaryToPost(post)),
    title: post.title,
    content: post.content,
    media,
    course: post.courseId ? MY_TRAVEL_COURSES.find((course) => course.id === post.courseId) : undefined,
    likeCount: post.likeCount,
    comments: post.comments.map(toComment),
  };
}

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

  useEffect(() => {
    let active = true;
    fetchCommunityPosts()
      .then(async (response) => {
        if (!active || response.content.length === 0) return;
        const detailedPosts = await Promise.all(response.content.map(async (summary) => {
          try {
            return detailToPost(await fetchCommunityPost(summary.id), summaryToPost(summary));
          } catch {
            return summaryToPost(summary);
          }
        }));
        if (active) setPosts(detailedPosts);
      })
      .catch(() => {
        // BE가 실행되지 않은 개발 환경에서는 mock 데이터를 유지한다.
      });
    return () => {
      active = false;
    };
  }, []);

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
        searchTerms.every((term) => [post.title, post.content, ...post.hashtags]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term)));

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
      title: post.title ?? post.content.slice(0, 120),
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
    void fetchCommunityPost(postId)
      .then((post) => {
        setPosts((current) => current.map((item) => (item.id === postId ? detailToPost(post, item) : item)));
      })
      .catch(() => undefined);
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
    const post = posts.find((item) => item.id === postId);
    if (post) void likeCommunityPost(postId, post.liked).catch(() => undefined);
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

  const deletePost = (postId: number) => {
    Alert.alert('게시글 삭제', '이 게시글을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void deleteCommunityPost(postId)
            .then(() => {
              setPosts((current) => current.filter((post) => post.id !== postId));
              setSelectedPostId(null);
              setEditingPostId(null);
              setMode('list');
            })
            .catch(() => Alert.alert('삭제 실패', '로그인 상태와 서버 연결을 확인해주세요.'));
        },
      },
    ]);
  };

  const toggleExpanded = (postId: number) => {
    setExpandedPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId],
    );
  };

  const addComment = () => {
    const content = commentText.trim();
    if (!selectedPost || !content) return;

    void createCommunityComment(selectedPost.id, content)
      .then((comment) => {
        updatePost(selectedPost.id, (post) => ({ ...post, comments: [...post.comments, toComment(comment)] }));
        setCommentText('');
      })
      .catch(() => Alert.alert('댓글 등록 실패', '로그인 상태와 서버 연결을 확인해주세요.'));
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
    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title || !content) {
      Alert.alert('내용을 입력해주세요', '게시글 제목과 내용을 입력해주세요.');
      return;
    }

    const hashtags = draft.hashtags
      .split(/[\s,]+/)
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter(Boolean);
    const course = MY_TRAVEL_COURSES.find((item) => item.id === draft.courseId);
    const media = draft.media;

    const payload = {
      title,
      content,
      courseId: draft.courseId,
      images: media.map((item, index) => ({
        s3Key: item.originalUri ?? item.uri,
        url: item.uri,
        sortOrder: index,
      })),
    };
    const request = editingPost
      ? updateCommunityPost(editingPost.id, payload)
      : createCommunityPost(payload);

    void request
      .then((saved) => {
        const nextPost = detailToPost(
          saved,
          editingPost ? { ...editingPost, isMine: true } : { ...summaryToPost(saved), isMine: true },
        );
        setPosts((current) => editingPost
          ? current.map((post) => (post.id === editingPost.id ? nextPost : post))
          : [nextPost, ...current]);
        setSelectedPostId(nextPost.id);
        setMode('detail');
      })
      .catch(() => Alert.alert('게시글 저장 실패', '로그인 상태와 서버 연결을 확인해주세요.'));
  };

  const renderList = () => (
    <>
      <View style={styles.topTitleBar}>
        <Text style={styles.topTitle}>강원동행</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 96 }]}
      >
        <CommunityFilterBar
          hashtagSearch={hashtagSearch}
          onChangeHashtagSearch={setHashtagSearch}
        />

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
      <TouchableOpacity style={[styles.fab, { bottom: tabBarHeight + 16 }]} onPress={openCreateForm} activeOpacity={0.9} accessibilityLabel="게시글 작성">
        <Ionicons name="create-outline" size={22} color={COLORS.white} />
      </TouchableOpacity>
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
                  <View style={styles.ownerActions}>
                    <TouchableOpacity onPress={() => openEditForm(selectedPost)} style={styles.editButton}>
                      <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.editButtonText}>수정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deletePost(selectedPost.id)}
                      style={styles.deleteButton}
                      accessibilityLabel="게시글 삭제"
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {selectedPost.title ? <Text style={styles.detailTitle}>{selectedPost.title}</Text> : null}
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
    backgroundColor: '#F5F7F8',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  scrollContent: {
    paddingTop: 12,
    paddingHorizontal: 20,
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
  topTitleBar: {
    backgroundColor: COLORS.primary,
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  topTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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
  ownerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
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
  detailTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
    marginBottom: 10,
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
