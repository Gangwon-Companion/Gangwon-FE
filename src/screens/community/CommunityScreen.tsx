import { useDesktopLayout } from '../../hooks/useContentWidth';
import { Alert } from '../../utils/alert';
import { notifyCommunityChanged, subscribeCommunityChanged } from '../../utils/communityEvents';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import type { TabParamList } from '../../navigation/TabNavigator';
import { getMyPage } from '../mypage/api';
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
  CommunityComment,
  CommunityPost,
  CommentSortOption,
  DraftPost,
  MediaType,
  PeriodOption,
  SortOption,
  TravelCourse,
} from './types';
import {
  EMPTY_DRAFT_POST,
  MEDIA_PRESETS,
} from './mockCommunityData';
import {
  CommunityApiComment,
  CommunityApiImage,
  CommunityApiPostDetail,
  CommunityApiPostSummary,
  createCommunityComment,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  fetchCommunityPost,
  fetchCommunityPosts,
  likeCommunityPost,
  likeCommunityComment,
  saveCommunityPost,
  updateCommunityComment,
  updateCommunityPost,
  fetchMyCommunityCourses,
  uploadCommunityImage,
} from './api';

type ScreenMode = 'list' | 'detail' | 'form';

async function openAppSettings() {
  try {
    await Linking.openSettings();
  } catch {
    Alert.alert('설정 열기 실패', '기기 설정에서 사진 접근 권한을 직접 허용해주세요.');
  }
}

async function ensurePhotoLibraryPermission() {
  if (Platform.OS === 'web') return true;

  const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (currentPermission.granted) return true;

  const permission = currentPermission.canAskAgain
    ? await ImagePicker.requestMediaLibraryPermissionsAsync()
    : currentPermission;

  if (permission.granted) return true;

  const message = permission.canAskAgain
    ? '게시글에 사진을 첨부하려면 사진 접근 권한이 필요합니다.'
    : '사진 접근 권한이 꺼져 있습니다. 기기 설정에서 강원동행의 사진 접근을 허용해주세요.';

  const actions = permission.canAskAgain
    ? [{ text: '확인' }]
    : [
        { text: '취소', style: 'cancel' as const },
        { text: '설정 열기', onPress: () => void openAppSettings() },
      ];

  Alert.alert('사진 접근 권한 필요', message, actions);
  return false;
}

function confirmAction(title: string, message: string, confirmText: string, destructive = false) {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm(message));

  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

function toComment(comment: CommunityApiComment): CommunityPost['comments'][number] {
  return {
    id: comment.commentId ?? comment.id ?? 0,
    author: comment.nickname ?? comment.author,
    avatar: comment.profileImageUrl ?? comment.authorProfileImageUrl ?? null,
    content: comment.content,
    createdAt: comment.createdAt,
    createdAtMs: Date.parse(comment.createdAt) || Date.now(),
    liked: comment.liked,
    isMine: comment.isMine,
    likeCount: comment.likeCount,
  };
}

function getAuthorProfileImage(post: CommunityApiPostSummary, currentUserProfileImageUrl?: string | null) {
  return post.profileImageUrl ?? post.authorProfileImageUrl ?? (post.isMine ? currentUserProfileImageUrl : null);
}

function getAuthorName(post: CommunityApiPostSummary, currentUserNickname?: string | null) {
  return post.isMine && currentUserNickname ? currentUserNickname : post.nickname ?? post.author;
}

function getPostId(post: CommunityApiPostSummary) {
  return post.postId ?? post.id ?? 0;
}

function summaryToPost(
  post: CommunityApiPostSummary,
  courses: TravelCourse[],
  currentUserProfileImageUrl?: string | null,
  currentUserNickname?: string | null,
): CommunityPost {
  return {
    id: getPostId(post),
    title: post.title,
    author: getAuthorName(post, currentUserNickname),
    avatar: getAuthorProfileImage(post, currentUserProfileImageUrl),
    isMine: post.isMine,
    content: post.content ?? post.title,
    media: [],
    course: post.courseId ? courses.find((course) => course.id === post.courseId) : undefined,
    hashtags: post.hashtags ?? [],
    liked: post.liked,
    saved: post.saved,
    likeCount: post.likeCount,
    saveCount: post.saveCount,
    commentCount: post.commentCount ?? 0,
    comments: [],
    createdAt: post.createdAt,
    createdAtMs: Date.parse(post.createdAt) || Date.now(),
  };
}

function detailToPost(
  post: CommunityApiPostDetail,
  courses: TravelCourse[],
  previous?: CommunityPost,
  currentUserProfileImageUrl?: string | null,
  currentUserNickname?: string | null,
): CommunityPost {
  const media: CommunityMedia[] = (post.images?.length
    ? post.images.map((image: CommunityApiImage, index) => ({
        id: index + 1,
        type: 'image' as const,
        uri: image.url,
        originalUri: image.s3Key,
      }))
    : (post.mediaUrls ?? []).map((uri, index) => ({
        id: index + 1,
        type: 'image' as const,
        uri,
        originalUri: uri,
      })));
  return {
    ...(previous ?? summaryToPost(post, courses, currentUserProfileImageUrl, currentUserNickname)),
    title: post.title,
    author: getAuthorName(post, currentUserNickname),
    content: post.content,
    avatar: getAuthorProfileImage(post, currentUserProfileImageUrl) ?? previous?.avatar ?? null,
    media,
    course: post.courseId ? courses.find((course) => course.id === post.courseId) : undefined,
    isMine: post.isMine,
    liked: post.liked,
    hashtags: post.hashtags ?? [],
    saved: post.saved,
    likeCount: post.likeCount,
    saveCount: post.saveCount,
    commentCount: post.commentCount ?? post.comments.length,
    comments: post.comments.map(toComment),
  };
}

export default function CommunityScreen() {
  const desktop = useDesktopLayout();
  const route = useRoute<RouteProp<TabParamList, '커뮤니티'>>();
  const navigation = useNavigation<any>();
  const measuredTabBarHeight = useBottomTabBarHeight();
  const tabBarHeight = desktop ? 0 : measuredTabBarHeight;
  const requestedPostId = route.params?.postId;
  const [mode, setMode] = useState<ScreenMode>('list');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
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
  const [courses, setCourses] = useState<TravelCourse[]>([]);
  const [currentUserProfileImageUrl, setCurrentUserProfileImageUrl] = useState<string | null>(null);
  const [currentUserNickname, setCurrentUserNickname] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingComment, setEditingComment] = useState<CommunityComment | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getMyPage()
        .then((user) => {
          if (active) {
            setCurrentUserProfileImageUrl(user.profileImageUrl);
            setCurrentUserNickname(user.nickname);
          }
        })
        .catch(() => {
          if (active) {
            setCurrentUserProfileImageUrl(null);
            setCurrentUserNickname(null);
          }
        });

      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    setPosts((current) => current.map((post) => (
      post.isMine ? { ...post, author: currentUserNickname ?? post.author, avatar: currentUserProfileImageUrl } : post
    )));
  }, [currentUserNickname, currentUserProfileImageUrl]);

  useEffect(() => {
    let active = true;
    fetchMyCommunityCourses().then((items) => {
      if (!active) return;
      setCourses(items.map((course) => ({
        id: course.id,
        title: course.name,
        days: `${course.places.length}개 장소`,
        places: course.places.sort((a, b) => a.visitOrder - b.visitOrder).map((place) => `${place.placeType}:${place.placeId}`),
      })));
    }).catch(() => setCourses([]));
    fetchCommunityPosts()
      .then(async (response) => {
        if (!active) return;
        const detailedPosts = await Promise.all(response.content.map(async (summary) => {
          try {
            return detailToPost(
              await fetchCommunityPost(getPostId(summary)),
              courses,
              summaryToPost(summary, courses, currentUserProfileImageUrl, currentUserNickname),
              currentUserProfileImageUrl,
              currentUserNickname,
            );
          } catch {
            return summaryToPost(summary, courses, currentUserProfileImageUrl, currentUserNickname);
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

  const openDetail = useCallback((postId: number) => {
    setSelectedPostId(postId);
    setCommentText('');
    setMode('detail');
    void fetchCommunityPost(postId)
      .then((post) => {
        setPosts((current) => {
          const previous = current.find((item) => item.id === postId);
          const nextPost = detailToPost(post, courses, previous, currentUserProfileImageUrl, currentUserNickname);
          return previous
            ? current.map((item) => (item.id === postId ? nextPost : item))
            : [nextPost, ...current];
        });
      })
      .catch(() => undefined);
  }, [courses, currentUserNickname, currentUserProfileImageUrl]);

  useEffect(() => {
    if (typeof requestedPostId === 'number') openDetail(requestedPostId);
  }, [openDetail, requestedPostId]);

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

  const refreshPost = useCallback(async (postId: number) => {
    const post = await fetchCommunityPost(postId);
    setPosts((current) => {
      const previous = current.find((item) => item.id === postId);
      const nextPost = detailToPost(post, courses, previous, currentUserProfileImageUrl, currentUserNickname);
      return previous
        ? current.map((item) => (item.id === postId ? nextPost : item))
        : [nextPost, ...current];
    });
  }, [courses, currentUserNickname, currentUserProfileImageUrl]);

  const refreshCommunity = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetchCommunityPosts();
      const detailedPosts = await Promise.all(response.content.map(async (summary) => {
        try {
          return detailToPost(
            await fetchCommunityPost(getPostId(summary)),
            courses,
            summaryToPost(summary, courses, currentUserProfileImageUrl, currentUserNickname),
            currentUserProfileImageUrl,
            currentUserNickname,
          );
        } catch {
          return summaryToPost(summary, courses, currentUserProfileImageUrl, currentUserNickname);
        }
      }));
      setPosts(detailedPosts);
      if (selectedPostId) await refreshPost(selectedPostId);
    } finally {
      setRefreshing(false);
    }
  }, [courses, currentUserNickname, currentUserProfileImageUrl, refreshPost, selectedPostId]);

  const resetToList = useCallback(() => {
    setMode('list');
    setSelectedPostId(null);
    setEditingPostId(null);
    setEditingComment(null);
    setEditingCommentText('');
    setCommentText('');
    setSelectedMedia(null);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      navigation.setParams({ postId: undefined });
      resetToList();
      void refreshCommunity().catch(() => undefined);
    });

    return unsubscribe;
  }, [navigation, refreshCommunity, resetToList]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const currentPostId = route.params?.postId;
      if (typeof currentPostId === 'number') return;
      resetToList();
      void refreshCommunity().catch(() => undefined);
    });

    return unsubscribe;
  }, [navigation, refreshCommunity, resetToList, route.params?.postId]);

  useEffect(() => subscribeCommunityChanged(() => {
    void refreshCommunity().catch(() => undefined);
  }), [refreshCommunity]);

  const toggleLike = (postId: number) => {
    const post = posts.find((item) => item.id === postId);
    if (post) void likeCommunityPost(postId, post.liked)
      .then(() => {
        notifyCommunityChanged();
        return refreshPost(postId);
      })
      .catch(() => refreshPost(postId).catch(() => undefined));
    updatePost(postId, (post) => ({
      ...post,
      liked: !post.liked,
      likeCount: Math.max(0, post.likeCount + (post.liked ? -1 : 1)),
    }));
  };

  const toggleSave = (postId: number) => {
    const current = posts.find((item) => item.id === postId);
    if (!current) return;
    void saveCommunityPost(postId, current.saved)
      .then(() => {
        notifyCommunityChanged();
        return refreshPost(postId);
      })
      .catch(() => refreshPost(postId).catch(() => undefined));
    updatePost(postId, (post) => ({
      ...post,
      saved: !post.saved,
      saveCount: Math.max(0, post.saveCount + (post.saved ? -1 : 1)),
    }));
  };

  const deletePost = (postId: number) => {
    void confirmAction('게시글 삭제', '이 게시글을 삭제할까요?', '삭제', true).then((confirmed) => {
      if (!confirmed) return;
      void deleteCommunityPost(postId)
        .then(() => {
          notifyCommunityChanged();
          setPosts((current) => current.filter((post) => post.id !== postId));
          setSelectedPostId(null);
          setEditingPostId(null);
          setMode('list');
        })
        .catch((deleteError) => Alert.alert(
          '삭제 실패',
          deleteError instanceof Error ? deleteError.message : '로그인 상태와 서버 연결을 확인해주세요.',
        ));
    });
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
        notifyCommunityChanged();
        updatePost(selectedPost.id, (post) => ({
          ...post,
          commentCount: post.commentCount + 1,
          comments: [...post.comments, toComment(comment)],
        }));
        setCommentText('');
        void refreshPost(selectedPost.id);
      })
      .catch(() => Alert.alert('댓글 등록 실패', '로그인 상태와 서버 연결을 확인해주세요.'));
  };

  const toggleCommentLike = (postId: number, commentId: number) => {
    const current = posts.find((item) => item.id === postId)?.comments.find((item) => item.id === commentId);
    if (!current) return;
    void likeCommunityComment(commentId, current.liked)
      .then(() => {
        notifyCommunityChanged();
        return refreshPost(postId);
      })
      .catch(() => refreshPost(postId).catch(() => undefined));
    updatePost(postId, (post) => ({
      ...post,
      comments: post.comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              liked: !comment.liked,
              likeCount: Math.max(0, comment.likeCount + (comment.liked ? -1 : 1)),
            }
          : comment,
      ),
    }));
  };

  const addDraftMedia = async (type: MediaType) => {
    if (type !== 'image') return;
    try {
      if (Platform.OS !== 'web' && !await ensurePhotoLibraryPermission()) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_MEDIA_COUNT,
        quality: 0.85,
      });
      if (result.canceled) return;
      setDraft((current) => ({
        ...current,
        media: [...current.media, ...result.assets.map((asset, index) => ({
          id: Date.now() + index,
          type: 'image' as const,
          uri: asset.uri,
          fileName: asset.fileName ?? undefined,
          mimeType: asset.mimeType ?? undefined,
        }))].slice(0, MAX_MEDIA_COUNT),
      }));
    } catch {
      Alert.alert('사진 선택 실패', '사진을 불러오지 못했습니다. 다시 시도해주세요.');
    }
  };

  const openCommentMenu = (comment: CommunityComment) => {
    const startEdit = () => {
      setEditingComment(comment);
      setEditingCommentText(comment.content);
    };
    const removeComment = () => {
      void confirmAction('댓글 삭제', '댓글을 삭제할까요?', '삭제', true).then((confirmed) => {
        if (!confirmed || !selectedPost) return;
        void deleteCommunityComment(comment.id)
          .then(() => {
            notifyCommunityChanged();
            updatePost(selectedPost.id, (post) => ({
              ...post,
              commentCount: Math.max(0, post.commentCount - 1),
              comments: post.comments.filter((item) => item.id !== comment.id),
            }));
            void refreshPost(selectedPost.id);
          })
          .catch(() => Alert.alert('댓글 삭제 실패', '로그인 상태와 서버 연결을 확인해주세요.'));
      });
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm('댓글을 수정할까요?\n취소를 누르면 삭제 여부를 다시 물어봅니다.')) {
        startEdit();
      } else if (globalThis.confirm('댓글을 삭제할까요?')) {
        removeComment();
      }
      return;
    }

    Alert.alert('댓글 관리', '댓글을 어떻게 할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '수정', onPress: startEdit },
      { text: '삭제', style: 'destructive', onPress: removeComment },
    ]);
  };

  const submitCommentEdit = async () => {
    if (!editingComment || !selectedPost) return;
    const content = editingCommentText.trim();
    if (!content) return Alert.alert('입력 확인', '댓글 내용을 입력해주세요.');
    if (!await confirmAction('댓글 수정', '댓글을 수정할까요?', '수정')) return;

    try {
      const updated = await updateCommunityComment(editingComment.id, content);
      notifyCommunityChanged();
      updatePost(selectedPost.id, (post) => ({
        ...post,
        comments: post.comments.map((comment) =>
          comment.id === editingComment.id ? toComment(updated) : comment,
        ),
      }));
      setEditingComment(null);
      setEditingCommentText('');
      await refreshPost(selectedPost.id);
    } catch {
      Alert.alert('댓글 수정 실패', '로그인 상태와 서버 연결을 확인해주세요.');
    }
  };

  const removeDraftMedia = (mediaId: number) => {
    setDraft((current) => ({
      ...current,
      media: current.media.filter((item) => item.id !== mediaId),
    }));
  };

  const submitPost = async () => {
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
    const media = draft.media;

    const payload = {
      title,
      content,
      courseId: draft.courseId,
      hashtags,
      images: [],
    };
    if (editingPost && !await confirmAction('게시글 수정', '게시글을 수정할까요?', '수정')) return;

    void Promise.all(media.map(async (item, index) => {
      if (item.originalUri && !item.uri.startsWith('file:') && !item.uri.startsWith('content:')) {
        return { s3Key: item.originalUri, url: item.uri, sortOrder: index };
      }
      const uploaded = await uploadCommunityImage(item.uri, item.fileName ?? `community-${Date.now()}-${index}.jpg`, item.mimeType ?? 'image/jpeg');
      return { ...uploaded, sortOrder: index };
    })).then((images) => editingPost
      ? updateCommunityPost(editingPost.id, { ...payload, images })
      : createCommunityPost({ ...payload, images }))
      .then((saved) => {
        notifyCommunityChanged();
        const nextPost = detailToPost(
          saved,
          courses,
          editingPost ? { ...editingPost, isMine: true } : { ...summaryToPost(saved, courses, currentUserProfileImageUrl, currentUserNickname), isMine: true },
          currentUserProfileImageUrl,
          currentUserNickname,
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={COLORS.primary}
            onRefresh={() => void refreshCommunity().catch(() => undefined)}
          />
        }
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
    const authorAvatar = selectedPost.avatar ? (
      <Image source={{ uri: selectedPost.avatar }} style={styles.avatar} />
    ) : (
      <View style={styles.avatarFallback}>
        <Ionicons name="person" size={22} color={COLORS.primary} />
      </View>
    );

    return (
      <>
        <CommunityHeader title="게시글 상세" showBack onBack={goBack} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                tintColor={COLORS.primary}
                onRefresh={() => void refreshCommunity().catch(() => undefined)}
              />
            }
            contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
          >
            <View style={styles.detailCard}>
              <View style={styles.authorRow}>
                {authorAvatar}
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

              <CommunityMediaList media={selectedPost.media} />
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
              onOpenCommentMenu={openCommentMenu}
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
        courses={courses}
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
      <Modal visible={Boolean(editingComment)} transparent animationType="fade" onRequestClose={() => setEditingComment(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditingComment(null)}>
          <Pressable style={styles.commentEditModal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>댓글 수정</Text>
            <TextInput
              value={editingCommentText}
              onChangeText={setEditingCommentText}
              placeholder="댓글을 입력해주세요"
              placeholderTextColor={COLORS.textMuted}
              multiline
              style={styles.commentEditInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditingComment(null)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={() => void submitCommentEdit()}>
                <Text style={styles.modalSaveText}>수정</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    padding: 24,
  },
  commentEditModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  commentEditInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCancelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: COLORS.textSub,
    fontSize: 14,
    fontWeight: '800',
  },
  modalSaveButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },
});
