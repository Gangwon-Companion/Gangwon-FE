type Listener = () => void;

const listeners = new Set<Listener>();
let profileImageVersion = Date.now();

export function bumpProfileImageVersion() {
  profileImageVersion = Date.now();
  listeners.forEach((listener) => listener());
}

export function getVersionedProfileImageUrl(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    const isSignedUrl =
      params.has('X-Amz-Signature') ||
      params.has('X-Amz-Algorithm') ||
      params.has('X-Amz-Credential') ||
      params.has('Signature') ||
      params.has('Key-Pair-Id') ||
      params.has('Policy');
    if (isSignedUrl) return url;
  } catch {
    // 상대 경로나 비표준 URL은 기존 방식으로 캐시 버전을 붙인다.
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${profileImageVersion}`;
}

export function subscribeProfileImageVersionChanged(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
