import { Alert } from '../../utils/alert';
import { notifyCommunityChanged } from '../../utils/communityEvents';
import { notifyPlaceReviewChanged } from '../../utils/placeReviewEvents';
import { bumpProfileImageVersion, getVersionedProfileImageUrl } from '../../utils/profileImageVersion';
import React, { useCallback, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Image,
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
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import TravelProfileSummaryCard from '../travelprofile/TravelProfileSummaryCard';

import { ApiError, clearAccessToken } from '../../api/auth';
import { deletePlaceReview, updatePlaceReview, type ReviewResource } from '../home/api';
import {
  deleteCommunityComment,
  deleteCommunityPost,
  likeCommunityComment,
  likeCommunityPost,
  saveCommunityPost,
  updateCommunityComment,
} from '../community/api';
import {
  changeNickname,
  changePassword,
  changeProfileImage,
  getMyCommunityPosts,
  getMyCommunityComments,
  getMyLikedCommunityPosts,
  getMyLikedComments,
  getMyPage,
  getMyReviews,
  getMySavedCommunityPosts,
  logout,
  MyCommunityPost,
  MyCommunityComment,
  MyLikedComment,
  MyPageData,
  MyReview,
  uploadProfileImage,
  withdraw,
} from './api';

const COLORS = {
  primary: '#008A9A',
  primaryBg: '#E3F4F2',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#1F2933',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  red: '#EF4444',
  redBg: '#FEF2F2',
};

type Editor = 'nickname' | 'password' | 'review' | 'comment' | null;
type ActivityTab = 'posts' | 'liked' | 'saved' | 'myComments' | 'likedComments' | 'reviews';

const ACTIVITY_TABS: Array<{ key: ActivityTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'posts', label: '내 게시글', icon: 'document-text-outline' },
  { key: 'liked', label: '좋아요', icon: 'heart-outline' },
  { key: 'saved', label: '저장', icon: 'bookmark-outline' },
  { key: 'myComments', label: '내 댓글', icon: 'chatbubble-outline' },
  { key: 'likedComments', label: '좋아요 댓글', icon: 'heart-circle-outline' },
  { key: 'reviews', label: '내 리뷰', icon: 'star-outline' },
];
const PASSWORD_RULE_MESSAGE = '8자 이상, 영문 대문자와 숫자를 포함해주세요';

const REVIEW_RESOURCE_MAP: Record<MyReview['placeType'], ReviewResource> = {
  DESTINATION: 'destinations',
  RESTAURANT: 'restaurants',
  LODGING: 'lodgings',
};

function errorMessage(error: unknown, field?: string) {
  if (error instanceof ApiError) {
    const fieldError = field ? error.errors.find((item) => item.field === field) : undefined;
    return fieldError?.message ?? error.errors[0]?.message ?? error.message;
  }
  return error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

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

  Alert.alert(
    '사진 접근 권한 필요',
    permission.canAskAgain
      ? '프로필 사진을 변경하려면 사진 접근 권한이 필요합니다.'
      : '사진 접근 권한이 꺼져 있습니다. 기기 설정에서 강원동행의 사진 접근을 허용해주세요.',
    permission.canAskAgain
      ? [{ text: '확인' }]
      : [
          { text: '취소', style: 'cancel' },
          { text: '설정 열기', onPress: () => void openAppSettings() },
        ],
  );
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

function isValidPassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

export default function MyPageScreen() {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<MyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [activityTab, setActivityTab] = useState<ActivityTab>('posts');
  const [myPosts, setMyPosts] = useState<MyCommunityPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<MyCommunityPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<MyCommunityPost[]>([]);
  const [myComments, setMyComments] = useState<MyCommunityComment[]>([]);
  const [likedComments, setLikedComments] = useState<MyLikedComment[]>([]);
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<MyReview | null>(null);
  const [editingComment, setEditingComment] = useState<MyCommunityComment | null>(null);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState('5');
  const [commentContent, setCommentContent] = useState('');

  const goToLogin = useCallback(() => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  }, [navigation]);

  const handleAuthError = useCallback((requestError: unknown) => {
    if (requestError instanceof ApiError && requestError.status === 401) {
      Alert.alert('로그인 필요', '로그인 정보가 없거나 만료되었습니다.', [{ text: '확인', onPress: goToLogin }]);
      return true;
    }
    return false;
  }, [goToLogin]);

  const loadActivity = useCallback(async (signal?: AbortSignal) => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const [postPage, likedPage, savedPage, myCommentItems, likedCommentItems, reviewItems] = await Promise.allSettled([
        getMyCommunityPosts(signal),
        getMyLikedCommunityPosts(signal),
        getMySavedCommunityPosts(signal),
        getMyCommunityComments(signal),
        getMyLikedComments(signal),
        getMyReviews(signal),
      ]);
      if (signal?.aborted) return;

      const rejected = [postPage, likedPage, savedPage, myCommentItems, likedCommentItems, reviewItems]
        .find((result) => result.status === 'rejected');
      if (rejected?.status === 'rejected' && handleAuthError(rejected.reason)) return;
      if (rejected?.status === 'rejected') setActivityError(errorMessage(rejected.reason));

      setMyPosts(postPage.status === 'fulfilled' ? postPage.value.content ?? [] : []);
      setLikedPosts(likedPage.status === 'fulfilled' ? likedPage.value.content ?? [] : []);
      setSavedPosts(savedPage.status === 'fulfilled' ? savedPage.value.content ?? [] : []);
      setMyComments(myCommentItems.status === 'fulfilled' ? myCommentItems.value ?? [] : []);
      setLikedComments(likedCommentItems.status === 'fulfilled' ? likedCommentItems.value ?? [] : []);
      setReviews(reviewItems.status === 'fulfilled' ? reviewItems.value ?? [] : []);
    } catch (activityError) {
      if (signal?.aborted) return;
      if (!handleAuthError(activityError)) Alert.alert('활동 내역 조회 실패', errorMessage(activityError));
    } finally {
      if (!signal?.aborted) setActivityLoading(false);
    }
  }, [handleAuthError]);

  const load = useCallback(async (signal?: AbortSignal, refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setData(await getMyPage(signal));
      await loadActivity(signal);
    } catch (loadError) {
      if (signal?.aborted) return;
      if (!handleAuthError(loadError)) setError(errorMessage(loadError));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [handleAuthError, loadActivity]);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void load(controller.signal);
      return () => controller.abort();
    }, [load]),
  );

  const currentPosts = useMemo(() => {
    if (activityTab === 'liked') return likedPosts;
    if (activityTab === 'saved') return savedPosts;
    return myPosts;
  }, [activityTab, likedPosts, myPosts, savedPosts]);

  const openNickname = () => {
    setNickname(data?.nickname ?? '');
    setEditor('nickname');
  };

  const closeEditor = () => {
    if (saving) return;
    setEditor(null);
    setCurrentPassword('');
    setNewPassword('');
    setEditingReview(null);
    setEditingComment(null);
    setReviewContent('');
    setReviewRating('5');
    setCommentContent('');
  };

  const submitNickname = async () => {
    const value = nickname.trim();
    if (!value) return Alert.alert('입력 확인', '닉네임을 입력해 주세요.');
    if ([...value].length > 6) return Alert.alert('입력 확인', '닉네임은 최대 6자까지 입력할 수 있습니다.');
    if (!await confirmAction('닉네임 변경', '닉네임을 변경할까요?', '변경')) return;
    setSaving(true);
    try {
      await changeNickname(value);
      await load(undefined, true);
      notifyCommunityChanged();
      setEditor(null);
      Alert.alert('변경 완료', '닉네임이 변경되었습니다.');
    } catch (submitError) {
      if (handleAuthError(submitError)) return;
      Alert.alert('변경 실패', errorMessage(submitError, 'nickname'));
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = async () => {
    if (!currentPassword || !newPassword) return Alert.alert('입력 확인', '현재 비밀번호와 새 비밀번호를 입력해 주세요.');
    if (!isValidPassword(newPassword)) return Alert.alert('입력 확인', PASSWORD_RULE_MESSAGE);
    if (!await confirmAction('비밀번호 변경', '비밀번호를 변경할까요?', '변경')) return;
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      await load(undefined, true);
      closeEditor();
      Alert.alert('변경 완료', '비밀번호가 변경되었습니다.');
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        Alert.alert('변경 실패', '현재 비밀번호가 올바르지 않습니다.');
        return;
      }
      if (handleAuthError(submitError)) return;
      Alert.alert('변경 실패', errorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  const selectAlbumProfilePhoto = async () => {
    if (profileSaving) return;
    if (Platform.OS !== 'web' && !await ensurePhotoLibraryPermission()) return;

    setProfileSaving(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      if (!await confirmAction('프로필 사진 변경', '선택한 사진으로 프로필을 변경할까요?', '변경')) return;

      const asset = result.assets[0];
      const uploaded = await uploadProfileImage(asset.uri, asset.fileName ?? `profile-${Date.now()}.jpg`, asset.mimeType ?? 'image/jpeg');
      await changeProfileImage(uploaded.s3Key);
      bumpProfileImageVersion();
      setData((previous) => previous ? { ...previous, profileImageUrl: uploaded.url } : previous);
      notifyCommunityChanged();
      await load(undefined, true);
    } catch (profileError) {
      if (handleAuthError(profileError)) return;
      Alert.alert('프로필 사진 변경 실패', errorMessage(profileError));
    } finally {
      setProfileSaving(false);
    }
  };

  const resetProfilePhoto = async () => {
    if (profileSaving) return;
    if (!await confirmAction('기본 프로필 사용', '기본 프로필로 변경할까요?', '변경')) return;
    setProfileSaving(true);
    try {
      await changeProfileImage(null);
      bumpProfileImageVersion();
      setData((previous) => previous ? { ...previous, profileImageUrl: null } : previous);
      notifyCommunityChanged();
      await load(undefined, true);
    } catch (profileError) {
      if (handleAuthError(profileError)) return;
      Alert.alert('기본 프로필 변경 실패', errorMessage(profileError));
    } finally {
      setProfileSaving(false);
    }
  };

  const openProfileImageOptions = () => {
    const actions = [
      { text: '앨범에서 선택', onPress: () => void selectAlbumProfilePhoto() },
      { text: '기본 프로필 사용', onPress: () => void resetProfilePhoto() },
      { text: '취소', style: 'cancel' as const },
    ];


    Alert.alert('프로필 사진 변경', '프로필 사진을 선택해주세요.', actions);
  };

  const performLogout = async () => {
    try {
      await logout();
    } catch (logoutError) {
      if (!(logoutError instanceof ApiError && logoutError.status === 401)) return Alert.alert('로그아웃 실패', errorMessage(logoutError));
    }
    await clearAccessToken();
    goToLogin();
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('정말 로그아웃 하시겠어요?')) void performLogout();
      return;
    }
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void performLogout() },
    ]);
  };

  const performWithdraw = async () => {
    setSaving(true);
    try {
      await withdraw();
      goToLogin();
    } catch (withdrawError) {
      if (handleAuthError(withdrawError)) return;
      Alert.alert('회원탈퇴 실패', errorMessage(withdrawError));
    } finally {
      setSaving(false);
    }
  };

  const confirmWithdraw = () => {
    const message = '회원탈퇴 후 현재 계정으로 다시 로그인할 수 없습니다. 정말 탈퇴하시겠어요?';
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) void performWithdraw();
      return;
    }
    Alert.alert('회원탈퇴', message, [
      { text: '취소', style: 'cancel' },
      { text: '탈퇴', style: 'destructive', onPress: () => void performWithdraw() },
    ]);
  };

  const cancelPostLike = async (postId: number) => {
    if (!await confirmAction('좋아요 취소', '이 게시글의 좋아요를 취소할까요?', '취소')) return;
    try {
      await likeCommunityPost(postId, true);
      notifyCommunityChanged();
      await load(undefined, true);
    } catch (likeError) {
      Alert.alert('좋아요 취소 실패', errorMessage(likeError));
    }
  };

  const cancelPostSave = async (postId: number) => {
    if (!await confirmAction('저장 취소', '이 게시글 저장을 취소할까요?', '취소')) return;
    try {
      await saveCommunityPost(postId, true);
      notifyCommunityChanged();
      await load(undefined, true);
    } catch (saveError) {
      Alert.alert('저장 취소 실패', errorMessage(saveError));
    }
  };

  const cancelCommentLike = async (commentId: number) => {
    if (!await confirmAction('댓글 좋아요 취소', '이 댓글의 좋아요를 취소할까요?', '취소')) return;
    try {
      await likeCommunityComment(commentId, true);
      notifyCommunityChanged();
      await load(undefined, true);
    } catch (likeError) {
      Alert.alert('댓글 좋아요 취소 실패', errorMessage(likeError));
    }
  };

  const openCommunityPost = (postId: number) => {
    void loadActivity();
    navigation.navigate('커뮤니티', { postId });
  };

  const removeMyPost = async (postId: number) => {
    if (!await confirmAction('게시글 삭제', '게시글을 삭제할까요?', '삭제', true)) return;
    try {
      await deleteCommunityPost(postId);
      notifyCommunityChanged();
      await load(undefined, true);
    } catch (deleteError) {
      Alert.alert('게시글 삭제 실패', errorMessage(deleteError));
    }
  };

  const openReviewEditor = (review: MyReview) => {
    setEditingReview(review);
    setReviewContent(review.content);
    setReviewRating(String(review.rating));
    setEditor('review');
  };

  const openCommentEditor = (comment: MyCommunityComment) => {
    setEditingComment(comment);
    setCommentContent(comment.content);
    setEditor('comment');
  };

  const openReviewPlace = (review: MyReview) => {
    void loadActivity();
    if (review.placeType === 'DESTINATION') {
      navigation.navigate('DestinationDetail', {
        destinationId: review.placeId,
        title: review.placeName,
        firstImage: null,
        pet: false,
        accessibility: false,
      });
      return;
    }

    if (review.placeType === 'RESTAURANT') {
      navigation.navigate('RestaurantDetail', {
        restaurantId: review.placeId,
        name: review.placeName,
      });
      return;
    }

    navigation.navigate('HotelDetail', {
      lodgingId: review.placeId,
      name: review.placeName,
    });
  };

  const submitReviewEdit = async () => {
    if (!editingReview) return;
    const content = reviewContent.trim();
    const rating = Number(reviewRating);
    if (!content) return Alert.alert('입력 확인', '리뷰 내용을 입력해 주세요.');
    if (Number.isNaN(rating) || rating < 0 || rating > 5) return Alert.alert('입력 확인', '별점은 0점부터 5점까지 입력해 주세요.');
    if (!await confirmAction('리뷰 수정', '리뷰를 수정할까요?', '수정')) return;

    setSaving(true);
    try {
      await updatePlaceReview(REVIEW_RESOURCE_MAP[editingReview.placeType], editingReview.placeId, editingReview.reviewId, { content, rating });
      notifyPlaceReviewChanged({ resource: REVIEW_RESOURCE_MAP[editingReview.placeType], resourceId: editingReview.placeId });
      await load(undefined, true);
      closeEditor();
    } catch (reviewError) {
      Alert.alert('리뷰 수정 실패', errorMessage(reviewError));
    } finally {
      setSaving(false);
    }
  };

  const removeReview = async (review: MyReview) => {
    if (!await confirmAction('리뷰 삭제', '리뷰를 삭제할까요?', '삭제', true)) return;
    try {
      await deletePlaceReview(REVIEW_RESOURCE_MAP[review.placeType], review.placeId, review.reviewId);
      notifyPlaceReviewChanged({ resource: REVIEW_RESOURCE_MAP[review.placeType], resourceId: review.placeId });
      await load(undefined, true);
    } catch (reviewError) {
      Alert.alert('리뷰 삭제 실패', errorMessage(reviewError));
    }
  };

  const submitCommentEdit = async () => {
    if (!editingComment) return;
    const content = commentContent.trim();
    if (!content) return Alert.alert('입력 확인', '댓글 내용을 입력해 주세요.');
    if (!await confirmAction('댓글 수정', '댓글을 수정할까요?', '수정')) return;

    setSaving(true);
    try {
      await updateCommunityComment(editingComment.commentId, content);
      notifyCommunityChanged();
      await load(undefined, true);
      closeEditor();
    } catch (commentError) {
      Alert.alert('댓글 수정 실패', errorMessage(commentError));
    } finally {
      setSaving(false);
    }
  };

  const removeComment = async (comment: MyCommunityComment) => {
    if (!await confirmAction('댓글 삭제', '댓글을 삭제할까요?', '삭제', true)) return;
    try {
      await deleteCommunityComment(comment.commentId);
      notifyCommunityChanged();
      await load(undefined, true);
    } catch (commentError) {
      Alert.alert('댓글 삭제 실패', errorMessage(commentError));
    }
  };

  const joinedAt = data?.joinedAt || data?.createdAt ? formatDate(data.joinedAt ?? data.createdAt ?? '') : '-';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(undefined, true)} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이 페이지</Text>
          {loading ? <ActivityIndicator color={COLORS.white} /> : data ? (
            <View style={styles.profileRow}>
              <TouchableOpacity style={styles.avatarButton} onPress={openProfileImageOptions} activeOpacity={0.84}>
                {data.profileImageUrl ? <Image source={{ uri: getVersionedProfileImageUrl(data.profileImageUrl) ?? data.profileImageUrl }} style={styles.avatarImage} /> : <Ionicons name="person" size={42} color={COLORS.primary} />}
                <View style={styles.cameraBadge}>
                  {profileSaving ? <ActivityIndicator color={COLORS.white} size="small" /> : <Ionicons name="camera" size={15} color={COLORS.white} />}
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>{data.nickname}</Text>
                  <TouchableOpacity onPress={openNickname}><Ionicons name="pencil" size={18} color={COLORS.white} /></TouchableOpacity>
                </View>
                <Text style={styles.profileEmail}>{data.email}</Text>
                <Text style={styles.profileMeta}>@{data.username} · 가입일 {joinedAt}</Text>
              </View>
            </View>
          ) : <Text style={styles.headerError}>{error ?? '정보를 불러오지 못했습니다.'}</Text>}
        </View>

        <View style={styles.content}>
          <TravelProfileSummaryCard />
          {error && !loading && <TouchableOpacity style={styles.retry} onPress={() => void load()}><Text style={styles.retryText}>다시 시도</Text></TouchableOpacity>}
          <Text style={styles.sectionTitle}>여행 활동</Text>
          <View style={styles.statsCard}>
            {[
              ['저장 코스', data?.travelStats.savedCourseCount ?? 0],
              ['방문 장소', data?.travelStats.visitedPlaceCount ?? 0],
              ['작성 리뷰', data?.travelStats.reviewCount ?? reviews.length],
            ].map(([label, value], index) => (
              <View key={String(label)} style={[styles.stat, index > 0 && styles.statBorder]}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>내 커뮤니티</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {ACTIVITY_TABS.map((tab) => (
              <TouchableOpacity key={tab.key} style={[styles.tabButton, activityTab === tab.key && styles.tabButtonActive]} onPress={() => setActivityTab(tab.key)}>
                <Ionicons name={tab.icon} size={14} color={activityTab === tab.key ? COLORS.white : COLORS.textSub} />
                <Text style={[styles.tabText, activityTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.activityCard}>
            {!!activityError && <Text style={styles.activityErrorText}>일부 활동 내역을 불러오지 못했습니다. {activityError}</Text>}
            {activityLoading ? <ActivityIndicator color={COLORS.primary} /> : activityTab === 'reviews' ? (
              reviews.length > 0 ? reviews.map((review) => (
                <ReviewItem
                  key={`${review.placeType}-${review.reviewId}`}
                  review={review}
                  onOpenPlace={openReviewPlace}
                  onEdit={openReviewEditor}
                  onDelete={removeReview}
                />
              )) : <Text style={styles.emptyText}>작성한 리뷰가 없습니다.</Text>
            ) : activityTab === 'myComments' ? (
              myComments.length > 0 ? myComments.map((comment) => (
                <MyCommentItem
                  key={comment.commentId}
                  comment={comment}
                  onOpenPost={openCommunityPost}
                  onEdit={openCommentEditor}
                  onDelete={removeComment}
                />
              )) : <Text style={styles.emptyText}>작성한 댓글이 없습니다.</Text>
            ) : activityTab === 'likedComments' ? (
              likedComments.length > 0 ? likedComments.map((comment) => (
                <LikedCommentItem
                  key={comment.commentId}
                  comment={comment}
                  onOpenPost={openCommunityPost}
                  onCancelLike={cancelCommentLike}
                />
              )) : <Text style={styles.emptyText}>좋아요한 댓글이 없습니다.</Text>
            ) : (
              currentPosts.length > 0 ? currentPosts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  tab={activityTab}
                  onOpenPost={openCommunityPost}
                  onDelete={removeMyPost}
                  onCancelLike={cancelPostLike}
                  onCancelSave={cancelPostSave}
                />
              )) : <Text style={styles.emptyText}>표시할 게시글이 없습니다.</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>계정 관리</Text>
          <MenuRow icon="person-outline" label="닉네임 변경" onPress={openNickname} />
          <MenuRow icon="lock-closed-outline" label="비밀번호 변경" onPress={() => setEditor('password')} />
          <MenuRow icon="log-out-outline" label="로그아웃" onPress={confirmLogout} danger />
          <MenuRow icon="person-remove-outline" label="회원탈퇴" onPress={confirmWithdraw} danger />
        </View>
      </ScrollView>

      <Modal visible={editor !== null} transparent animationType="fade" onRequestClose={closeEditor}>
        <Pressable style={styles.overlay} onPress={closeEditor}>
          <Pressable style={styles.modal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>{editor === 'nickname' ? '닉네임 변경' : editor === 'review' ? '리뷰 수정' : editor === 'comment' ? '댓글 수정' : '비밀번호 변경'}</Text>
            {editor === 'nickname' ? (
              <TextInput style={styles.input} value={nickname} onChangeText={setNickname} maxLength={6} placeholder="새 닉네임 (최대 6자)" />
            ) : editor === 'review' ? (
              <>
                <TextInput style={styles.input} value={reviewRating} onChangeText={setReviewRating} keyboardType="decimal-pad" placeholder="별점 0~5" />
                <TextInput style={[styles.input, styles.reviewInput]} value={reviewContent} onChangeText={setReviewContent} multiline placeholder="리뷰 내용" />
              </>
            ) : editor === 'comment' ? (
              <TextInput style={[styles.input, styles.reviewInput]} value={commentContent} onChangeText={setCommentContent} multiline placeholder="댓글 내용" />
            ) : (
              <>
                <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="현재 비밀번호" />
                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="새 비밀번호" />
                <Text style={styles.helpText}>{PASSWORD_RULE_MESSAGE}</Text>
              </>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeEditor} disabled={saving}><Text>취소</Text></TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => void (editor === 'nickname' ? submitNickname() : editor === 'review' ? submitReviewEdit() : editor === 'comment' ? submitCommentEdit() : submitPassword())}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>변경</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function MenuRow({ icon, label, onPress, danger = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.dangerBg]}>
        <Ionicons name={icon} size={22} color={danger ? COLORS.red : COLORS.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: COLORS.red }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function PostItem({ post, tab, onOpenPost, onDelete, onCancelLike, onCancelSave }: {
  post: MyCommunityPost;
  tab: Exclude<ActivityTab, 'myComments' | 'likedComments' | 'reviews'>;
  onOpenPost: (postId: number) => void;
  onDelete: (postId: number) => Promise<void>;
  onCancelLike: (postId: number) => Promise<void>;
  onCancelSave: (postId: number) => Promise<void>;
}) {
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity style={styles.itemBody} onPress={() => onOpenPost(post.id)} activeOpacity={0.8}>
        <Text style={styles.itemTitle} numberOfLines={1}>{post.title}</Text>
        <Text style={styles.itemMeta}>좋아요 {post.likeCount} · 저장 {post.saveCount} · {formatDate(post.createdAt)}</Text>
      </TouchableOpacity>
      {tab === 'posts' ? (
        <TouchableOpacity style={styles.smallDangerButton} onPress={() => void onDelete(post.id)}><Text style={styles.smallDangerText}>삭제</Text></TouchableOpacity>
      ) : tab === 'liked' ? (
        <TouchableOpacity style={styles.smallButton} onPress={() => void onCancelLike(post.id)}><Text style={styles.smallButtonText}>취소</Text></TouchableOpacity>
      ) : tab === 'saved' ? (
        <TouchableOpacity style={styles.smallButton} onPress={() => void onCancelSave(post.id)}><Text style={styles.smallButtonText}>취소</Text></TouchableOpacity>
      ) : null}
    </View>
  );
}

function MyCommentItem({ comment, onOpenPost, onEdit, onDelete }: {
  comment: MyCommunityComment;
  onOpenPost: (postId: number) => void;
  onEdit: (comment: MyCommunityComment) => void;
  onDelete: (comment: MyCommunityComment) => Promise<void>;
}) {
  const postLabel = comment.postTitle ?? comment.postContent ?? `게시글 #${comment.postId}`;
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity style={styles.itemBody} onPress={() => onOpenPost(comment.postId)} activeOpacity={0.8}>
        <Text style={styles.itemTitle} numberOfLines={1}>{postLabel}</Text>
        <Text style={styles.itemContent} numberOfLines={2}>{comment.content}</Text>
        <Text style={styles.itemMeta}>좋아요 {comment.likeCount} · {formatDate(comment.createdAt)}</Text>
      </TouchableOpacity>
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.smallButton} onPress={() => onEdit(comment)}><Text style={styles.smallButtonText}>수정</Text></TouchableOpacity>
        <TouchableOpacity style={styles.smallDangerButton} onPress={() => void onDelete(comment)}><Text style={styles.smallDangerText}>삭제</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function LikedCommentItem({ comment, onOpenPost, onCancelLike }: {
  comment: MyLikedComment;
  onOpenPost: (postId: number) => void;
  onCancelLike: (commentId: number) => Promise<void>;
}) {
  const postLabel = comment.postTitle ?? comment.postContent ?? `게시글 #${comment.postId}`;
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity style={styles.itemBody} onPress={() => onOpenPost(comment.postId)} activeOpacity={0.8}>
        <Text style={styles.itemTitle} numberOfLines={1}>{postLabel}</Text>
        <Text style={styles.itemContent} numberOfLines={2}>{comment.content}</Text>
        <Text style={styles.itemMeta}>{comment.author} · 좋아요 {comment.likeCount} · {formatDate(comment.createdAt)}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.smallButton} onPress={() => void onCancelLike(comment.commentId)}>
        <Text style={styles.smallButtonText}>취소</Text>
      </TouchableOpacity>
    </View>
  );
}

function ReviewItem({
  review,
  onOpenPlace,
  onEdit,
  onDelete,
}: {
  review: MyReview;
  onOpenPlace: (review: MyReview) => void;
  onEdit: (review: MyReview) => void;
  onDelete: (review: MyReview) => Promise<void>;
}) {
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity style={styles.itemBody} onPress={() => onOpenPlace(review)} activeOpacity={0.8}>
        <Text style={styles.itemTitle} numberOfLines={1}>{review.placeName}</Text>
        <Text style={styles.itemContent} numberOfLines={2}>{review.content}</Text>
        <Text style={styles.itemMeta}>별점 {review.rating.toFixed(1)} · {formatDate(review.createdAt)}</Text>
      </TouchableOpacity>
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.smallButton} onPress={() => onEdit(review)}><Text style={styles.smallButtonText}>수정</Text></TouchableOpacity>
        <TouchableOpacity style={styles.smallDangerButton} onPress={() => void onDelete(review)}><Text style={styles.smallDangerText}>삭제</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 110 },
  header: { minHeight: 190, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 30 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '700', marginBottom: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  cameraBadge: { position: 'absolute', right: -1, bottom: -1, width: 25, height: 25, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  profileInfo: { flex: 1, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileName: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  profileEmail: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  profileMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 12 },
  headerError: { color: COLORS.white, textAlign: 'center' },
  content: { padding: 24, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  statsCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, paddingVertical: 20, marginBottom: 8 },
  stat: { flex: 1, alignItems: 'center', gap: 6 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: COLORS.border },
  statValue: { fontSize: 21, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSub },
  tabRow: { gap: 8, paddingVertical: 2 },
  tabButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', borderRadius: 999, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14 },
  tabButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textSub, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: COLORS.white },
  activityCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, gap: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#F0F2F4', paddingTop: 10 },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  itemContent: { color: COLORS.textSub, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  itemMeta: { color: COLORS.textMuted, fontSize: 12 },
  rowActions: { gap: 6 },
  smallButton: { minHeight: 32, borderRadius: 9, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  smallButtonText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  smallDangerButton: { minHeight: 32, borderRadius: 9, backgroundColor: COLORS.redBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  smallDangerText: { color: COLORS.red, fontSize: 12, fontWeight: '800' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  activityErrorText: { color: '#B45309', fontSize: 12, lineHeight: 18, paddingBottom: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, gap: 14 },
  menuIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  dangerBg: { backgroundColor: COLORS.redBg },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  retry: { alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 9, backgroundColor: COLORS.white, borderRadius: 10 },
  retryText: { color: COLORS.primary, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, gap: 14 },
  modalTitle: { fontSize: 19, fontWeight: '700', color: COLORS.text },
  input: { height: 50, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, color: COLORS.text },
  helpText: { marginTop: -8, color: COLORS.textMuted, fontSize: 12 },
  reviewInput: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, height: 48, borderRadius: 12, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  saveButton: { flex: 1, height: 48, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: COLORS.white, fontWeight: '700' },
});
