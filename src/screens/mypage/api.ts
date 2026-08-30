import { ApiError, clearAccessToken, getAccessToken, parseApiError } from '../../api/auth';
import { getApiBaseUrl, requestHeaders } from '../home/api';

export type MyPageData = {
  username: string;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  joinedAt?: string;
  createdAt?: string;
  travelStats: {
    savedCourseCount: number;
    visitedPlaceCount: number;
    reviewCount: number;
  };
};

export type MyCommunityPost = {
  id: number;
  postId?: number;
  title: string;
  content?: string;
  author: string;
  nickname?: string;
  profileImageUrl?: string | null;
  authorProfileImageUrl?: string | null;
  viewCount: number;
  likeCount: number;
  commentCount?: number;
  imageCount: number;
  courseId: number | null;
  isMine: boolean;
  liked: boolean;
  saved: boolean;
  saveCount: number;
  hashtags: string[];
  createdAt: string;
};

export type MyCommunityPostPage = {
  content: MyCommunityPost[];
  totalPages: number;
  totalElements: number;
};

export type MyReview = {
  placeType: 'DESTINATION' | 'RESTAURANT' | 'LODGING';
  placeId: number;
  placeName: string;
  reviewId: number;
  content: string;
  rating: number;
  createdAt: string;
};

export type MyLikedComment = {
  commentId: number;
  postId: number;
  postTitle?: string | null;
  postContent?: string | null;
  author: string;
  nickname?: string;
  profileImageUrl?: string | null;
  authorProfileImageUrl?: string | null;
  content: string;
  likeCount: number;
  liked?: boolean;
  isMine?: boolean;
  createdAt: string;
};

export type MyCommunityComment = {
  commentId: number;
  postId: number;
  postTitle?: string | null;
  postContent?: string | null;
  content: string;
  likeCount: number;
  createdAt: string;
};

async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new ApiError('로그인이 필요합니다.', 401, 'UNAUTHORIZED');

  const baseUrl = await getApiBaseUrl(init.signal ?? undefined);
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...requestHeaders,
      'Content-Type': 'application/json',
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) await clearAccessToken();
  if (!response.ok) throw await parseApiError(response);
  return response;
}

export async function getMyPage(signal?: AbortSignal): Promise<MyPageData> {
  const response = await authenticatedFetch('/api/v1/users/me', { signal });
  const data = await response.json();
  return { ...data, joinedAt: data.joinedAt ?? data.createdAt ?? '' };
}

function normalizeCommunityPostPage(data: any): MyCommunityPostPage {
  const content = Array.isArray(data?.content) ? data.content : [];
  return {
    ...data,
    content: content.map((item: any) => ({
      ...item,
      id: item.postId ?? item.id,
      postId: item.postId ?? item.id,
      title: item.title ?? item.content ?? '제목 없음',
      author: item.author ?? item.nickname ?? '',
      likeCount: item.likeCount ?? 0,
      saveCount: item.saveCount ?? 0,
      imageCount: item.imageCount ?? item.mediaUrls?.length ?? item.images?.length ?? 0,
      hashtags: item.hashtags ?? [],
      createdAt: item.createdAt ?? '',
    })),
    totalPages: data?.totalPages ?? 1,
    totalElements: data?.totalElements ?? content.length,
  };
}

export async function changeNickname(nickname: string) {
  await authenticatedFetch('/api/v1/users/me/nickname', {
    method: 'PATCH',
    body: JSON.stringify({ nickname }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await authenticatedFetch('/api/v1/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function changeProfileImage(profileImageS3Key: string | null) {
  await authenticatedFetch('/api/v1/users/me/profile-image', {
    method: 'PATCH',
    body: JSON.stringify({ profileImageS3Key }),
  });
}

export async function uploadProfileImage(uri: string, fileName = 'profile.jpg', contentType = 'image/jpeg') {
  const presignResponse = await authenticatedFetch('/api/v1/users/me/profile-image/presigned-url', {
    method: 'POST',
    body: JSON.stringify({ originalFileName: fileName, contentType }),
  });
  const presigned = await presignResponse.json() as { s3Key: string; uploadUrl: string };
  const blob = await (await fetch(uri)).blob();
  const uploadResponse = await fetch(presigned.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
  if (!uploadResponse.ok) throw new Error(`S3 프로필 이미지 업로드 실패 (${uploadResponse.status})`);
  return { s3Key: presigned.s3Key, url: presigned.uploadUrl.split('?')[0] };
}

export async function getMyCommunityPosts(signal?: AbortSignal): Promise<MyCommunityPostPage> {
  const response = await authenticatedFetch('/api/v1/users/me/community/posts', { signal });
  return normalizeCommunityPostPage(await response.json());
}

export async function getMyLikedCommunityPosts(signal?: AbortSignal): Promise<MyCommunityPostPage> {
  const response = await authenticatedFetch('/api/v1/users/me/community/liked-posts', { signal });
  return normalizeCommunityPostPage(await response.json());
}

export async function getMySavedCommunityPosts(signal?: AbortSignal): Promise<MyCommunityPostPage> {
  const response = await authenticatedFetch('/api/v1/users/me/community/saved-posts', { signal });
  return normalizeCommunityPostPage(await response.json());
}

export async function getMyReviews(signal?: AbortSignal): Promise<MyReview[]> {
  const response = await authenticatedFetch('/api/v1/users/me/reviews', { signal });
  return response.json();
}

export async function getMyLikedComments(signal?: AbortSignal): Promise<MyLikedComment[]> {
  const response = await authenticatedFetch('/api/v1/users/me/community/liked-comments', { signal });
  const data = await response.json();
  const items = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
  return items.map((item: any) => ({
    commentId: item.commentId ?? item.id,
    postId: item.postId,
    postTitle: item.postTitle ?? item.title ?? null,
    postContent: item.postContent ?? null,
    author: item.author ?? item.nickname ?? '',
    nickname: item.nickname,
    profileImageUrl: item.profileImageUrl ?? null,
    authorProfileImageUrl: item.authorProfileImageUrl ?? null,
    content: item.content ?? '',
    likeCount: item.likeCount ?? 0,
    liked: item.liked,
    isMine: item.isMine,
    createdAt: item.createdAt ?? '',
  }));
}

export async function getMyCommunityComments(signal?: AbortSignal): Promise<MyCommunityComment[]> {
  const response = await authenticatedFetch('/api/v1/users/me/community/comments', { signal });
  const data = await response.json();
  const items = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
  return items.map((item: any) => ({
    commentId: item.commentId ?? item.id,
    postId: item.postId,
    postTitle: item.postTitle ?? item.title ?? null,
    postContent: item.postContent ?? null,
    content: item.content ?? '',
    likeCount: item.likeCount ?? 0,
    createdAt: item.createdAt ?? '',
  }));
}

export async function logout() {
  await authenticatedFetch('/api/v1/users/me/logout', { method: 'POST' });
  await clearAccessToken();
}

export async function withdraw() {
  await authenticatedFetch('/api/v1/users/me', { method: 'DELETE' });
  await clearAccessToken();
}
