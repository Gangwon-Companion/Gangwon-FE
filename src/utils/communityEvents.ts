type Listener = () => void;

const listeners = new Set<Listener>();

export function notifyCommunityChanged() {
  listeners.forEach((listener) => listener());
}

export function subscribeCommunityChanged(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
