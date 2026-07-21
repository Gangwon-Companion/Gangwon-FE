import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const requestHeaders = { 'ngrok-skip-browser-warning': 'true' };
const REQUEST_TIMEOUT_MS = 3500;
const ACCESS_TOKEN_STORAGE_KEYS = [
  'accessToken',
  'ACCESS_TOKEN',
  'auth.accessToken',
  'token',
  'jwt',
];

export type Theme = {
  id: number;
  code: string;
  name: string;
};

export type DestinationListItem = {
  id: number;
  title: string;
  firstImage: string | null;
};

export type ThemeDestinationsResponse = {
  themeId: number;
  themeCode: string;
  themeName: string;
  destinationList: DestinationListItem[];
};

export type DestinationImage = {
  id: number;
  destinationId: number;
  originImgUrl: string | null;
  smallImgUrl: string | null;
  serialNum: string | null;
};

export type PetInfo = {
  id: number;
  destinationId: number;
  contentId: number;
  accompanyType: string | null;
  needItems: string | null;
  petFacilities: string | null;
  caution: string | null;
  accidentRisk: string | null;
};

export type AccessibilityInfo = {
  id: number;
  destinationId: number;
  contentId: number;
  parking: string | null;
  route: string | null;
  entrance: string | null;
  elevator: string | null;
  restroom: string | null;
  wheelchair: string | null;
  braileBlock: string | null;
  helpDog: string | null;
  guideHuman: string | null;
};

export type DestinationDetail = {
  id: number;
  destinationId: number;
  title: string;
  addr1: string | null;
  addr2: string | null;
  tel: string | null;
  overview: string | null;
  homepage: string | null;
  usageTime: string | null;
  restDate: string | null;
  parking: string | null;
  inquiry: string | null;
  destinationImageList: DestinationImage[];
  petInfo: PetInfo | null;
  accessibilityInfo: AccessibilityInfo | null;
};

let cachedBaseUrl: string | null = null;
let resolutionPromise: Promise<string> | null = null;

export class ApiResponseError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiResponseError';
    this.status = status;
  }
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, '');
}

function getBundlerHost(): string | null {
  const scriptUrl = NativeModules?.SourceCode?.scriptURL as string | undefined;
  if (!scriptUrl) return null;

  try {
    const parsed = new URL(scriptUrl);
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

function buildCandidates() {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const bundlerHost = getBundlerHost();

  return unique([
    envBaseUrl ? normalizeBaseUrl(envBaseUrl) : null,
    bundlerHost ? `http://${bundlerHost}:8080` : null,
    Platform.OS === 'android' ? 'http://10.0.2.2:8080' : null,
    'http://localhost:8080',
    'http://127.0.0.1:8080',
  ]);
}

async function getStoredAccessToken() {
  for (const key of ACCESS_TOKEN_STORAGE_KEYS) {
    const token = await AsyncStorage.getItem(key);
    if (token) return token;
  }

  return null;
}

export async function buildRequestHeaders() {
  const headers: Record<string, string> = { ...requestHeaders };
  const accessToken = await getStoredAccessToken();

  if (accessToken) {
    headers.Authorization = accessToken.startsWith('Bearer ')
      ? accessToken
      : `Bearer ${accessToken}`;
  }

  return headers;
}

async function probeBaseUrl(baseUrl: string, signal?: AbortSignal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeout);
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }

    signal.addEventListener(
      'abort',
      () => controller.abort(),
      { once: true },
    );
  }

  try {
    await fetch(`${baseUrl}/api/v1/themes`, {
      headers: await buildRequestHeaders(),
      signal: controller.signal,
    });
    return baseUrl;
  } finally {
    clearTimeout(timeout);
  }
}

type ApiBaseUrlOptions = {
  skipProbe?: boolean;
};

export async function getApiBaseUrl(signal?: AbortSignal, options?: ApiBaseUrlOptions) {
  if (cachedBaseUrl) return cachedBaseUrl;

  if (options?.skipProbe) {
    const [candidate] = buildCandidates();
    if (!candidate) throw new Error('백엔드 API 주소를 찾지 못했습니다.');
    cachedBaseUrl = candidate;
    return candidate;
  }

  if (resolutionPromise) return resolutionPromise;

  resolutionPromise = (async () => {
    const candidates = buildCandidates();
    let lastError: unknown = null;

    for (const candidate of candidates) {
      try {
        const resolved = await probeBaseUrl(candidate, signal);
        cachedBaseUrl = resolved;
        return resolved;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('백엔드 API 주소를 찾지 못했습니다.');
  })();

  try {
    return await resolutionPromise;
  } finally {
    resolutionPromise = null;
  }
}

export async function fetchThemes(signal?: AbortSignal) {
  const apiBaseUrl = await getApiBaseUrl(signal);
  const response = await fetch(`${apiBaseUrl}/api/v1/themes`, {
    headers: await buildRequestHeaders(),
    signal,
  });

  if (!response.ok) {
    throw new Error(`테마 목록 요청 실패 (${response.status})`);
  }

  return response.json() as Promise<Theme[]>;
}

export async function fetchThemeDestinations(
  themeId: number,
  options?: { pet?: boolean; accessibility?: boolean; signal?: AbortSignal },
) {
  const apiBaseUrl = await getApiBaseUrl(options?.signal);
  const params = new URLSearchParams({
    pet: String(options?.pet ?? false),
    accessibility: String(options?.accessibility ?? false),
  });
  const response = await fetch(`${apiBaseUrl}/api/v1/themes/${themeId}/destinations?${params.toString()}`, {
    headers: await buildRequestHeaders(),
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(`장소 목록 요청 실패 (${response.status})`);
  }

  return response.json() as Promise<ThemeDestinationsResponse>;
}

export async function fetchDestinationDetail(
  destinationId: number,
  options?: { pet?: boolean; accessibility?: boolean; signal?: AbortSignal },
) {
  const apiBaseUrl = await getApiBaseUrl(options?.signal);
  const params = new URLSearchParams({
    pet: String(options?.pet ?? false),
    accessibility: String(options?.accessibility ?? false),
  });
  const response = await fetch(`${apiBaseUrl}/api/v1/destinations/${destinationId}/detail?${params.toString()}`, {
    headers: await buildRequestHeaders(),
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new ApiResponseError(`장소 상세 요청 실패 (${response.status})`, response.status);
  }

  return response.json() as Promise<DestinationDetail>;
}

export { requestHeaders };
