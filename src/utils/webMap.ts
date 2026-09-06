export function openWebMap(name: string, address?: string | null) {
  // Open synchronously from the click so browser popup blockers don't suppress it.
  const query = [address, name].filter(Boolean).join(' ');
  window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
}
