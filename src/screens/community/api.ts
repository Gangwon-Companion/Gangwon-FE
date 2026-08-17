import { buildRequestHeaders, getApiBaseUrl } from '../home/api';

export type CommunityApiImage = {
  s3Key: string;
  url: string;
  sortOrder: number;
};

export type CommunityApiComment = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
};

export type CommunityApiPostSummary = {
  id: number;
  title: string;
  author: string;
  viewCount: number;
  likeCount: number;
  imageCount: number;
  courseId: number | null;
  createdAt: string;
};

export type CommunityApiPostDetail = CommunityApiPostSummary & {
  content: string;
  updatedAt: string;
  images: CommunityApiImage[];
  comments: CommunityApiComment[];
};

export type CommunityApiPage = {
  content: CommunityApiPostSummary[];
  totalPages: number;
  totalElements: number;
};

type PostPayload = {
  title: string;
  content: string;
  courseId: number | null;
  images: CommunityApiImage[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = await getApiBaseUrl(undefined, { skipProbe: true });
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(await buildRequestHeaders()),
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `커뮤니티 요청에 실패했습니다. (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body?.message === 'string') message = body.message;
    } catch {
      // 응답 본문이 없는 오류는 상태 코드 메시지를 사용한다.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function fetchCommunityPosts(options?: { page?: number; size?: number; keyword?: string }) {
  const params = new URLSearchParams({
    page: String(options?.page ?? 0),
    size: String(options?.size ?? 50),
    sort: 'createdAt,desc',
  });
  if (options?.keyword?.trim()) params.set('keyword', options.keyword.trim());
  return request<CommunityApiPage>(`/api/v1/community/posts?${params.toString()}`);
}

export function fetchCommunityPost(postId: number) {
  return request<CommunityApiPostDetail>(`/api/v1/community/posts/${postId}`);
}

export function createCommunityPost(payload: PostPayload) {
  return request<CommunityApiPostDetail>('/api/v1/community/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCommunityPost(postId: number, payload: PostPayload) {
  return request<CommunityApiPostDetail>(`/api/v1/community/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteCommunityPost(postId: number) {
  return request<void>(`/api/v1/community/posts/${postId}`, { method: 'DELETE' });
}

export function createCommunityComment(postId: number, content: string) {
  return request<CommunityApiComment>(`/api/v1/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function likeCommunityPost(postId: number, liked: boolean) {
  return request<void>(`/api/v1/community/posts/${postId}/likes`, {
    method: liked ? 'DELETE' : 'POST',
  });
}
