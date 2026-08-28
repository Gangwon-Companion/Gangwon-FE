import { ApiError, clearAccessToken, getAccessToken, parseApiError } from '../../api/auth';
import { getApiBaseUrl, requestHeaders } from '../home/api';

export type MyPageData = {
  username: string;
  email: string;
  nickname: string;
  joinedAt: string;
  travelStats: {
    savedCourseCount: number;
    visitedPlaceCount: number;
    reviewCount: number;
  };
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
  return response.json();
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

export async function logout() {
  await authenticatedFetch('/api/v1/users/me/logout', { method: 'POST' });
  await clearAccessToken();
}
