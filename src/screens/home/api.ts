import { NativeModules, Platform } from 'react-native';

const requestHeaders = { 'ngrok-skip-browser-warning': 'true' };
const REQUEST_TIMEOUT_MS = 3500;

let cachedBaseUrl: string | null = null;
let resolutionPromise: Promise<string> | null = null;

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
    const response = await fetch(`${baseUrl}/api/v1/lodgings?size=1&page=0`, {
      headers: requestHeaders,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Probe failed (${response.status})`);
    }
    return baseUrl;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getApiBaseUrl(signal?: AbortSignal) {
  if (cachedBaseUrl) return cachedBaseUrl;
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

export { requestHeaders };
