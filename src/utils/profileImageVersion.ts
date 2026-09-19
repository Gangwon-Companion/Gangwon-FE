type Listener = () => void;

const listeners = new Set<Listener>();
let profileImageVersion = Date.now();

export function bumpProfileImageVersion() {
  profileImageVersion = Date.now();
  listeners.forEach((listener) => listener());
}

export function getVersionedProfileImageUrl(url?: string | null) {
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${profileImageVersion}`;
}

export function subscribeProfileImageVersionChanged(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
