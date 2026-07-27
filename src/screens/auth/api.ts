import { getApiBaseUrl, requestHeaders } from '../home/api';

const LOGIN_TIMEOUT_MS = 8000;

type LoginResponse = {
  token: string;
};

type ErrorResponse = {
  code?: string;
  message?: string;
};

export async function login(username: string, password: string) {
  const apiBaseUrl = await getApiBaseUrl(undefined, { skipProbe: true });
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

  try {
    response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        ...requestHeaders,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('로그인 요청 시간이 초과됐습니다. 휴대폰에서 PC 백엔드 주소에 접속 가능한지 확인해주세요.');
    }

    throw new Error('백엔드 연결 또는 CORS 설정을 확인해주세요.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let errorBody: ErrorResponse | null = null;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }

    if (response.status === 401 || errorBody?.code === 'LOGIN_FAILED') {
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    throw new Error(errorBody?.message ?? `로그인 요청 실패 (${response.status})`);
  }

  const data: LoginResponse = await response.json();
  if (!data.token) throw new Error('로그인 응답에 토큰이 없습니다.');

  return data.token;
}
