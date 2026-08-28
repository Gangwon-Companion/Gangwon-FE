import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCESS_TOKEN_KEY = 'accessToken';

export type ApiFieldError = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  errors: ApiFieldError[];

  constructor(message: string, status: number, code?: string, errors: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export function saveAccessToken(token: string) {
  return AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  return AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function parseApiError(response: Response) {
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // JSON 형식이 아닌 오류 응답은 상태 코드 기반 메시지를 사용한다.
  }

  const errors: ApiFieldError[] = Array.isArray(body?.errors)
    ? body.errors
        .filter((item: any) => typeof item?.field === 'string' && typeof item?.message === 'string')
        .map((item: any) => ({ field: item.field, message: item.message }))
    : [];

  return new ApiError(
    typeof body?.message === 'string' ? body.message : `요청에 실패했습니다. (${response.status})`,
    response.status,
    typeof body?.code === 'string' ? body.code : undefined,
    errors,
  );
}
