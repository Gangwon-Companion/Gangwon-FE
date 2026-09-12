import { Platform, useWindowDimensions } from 'react-native';

export const WEB_DESKTOP_BREAKPOINT = 900;

export function useDesktopLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WEB_DESKTOP_BREAKPOINT;
}

export function useContentWidth() {
  const { width } = useWindowDimensions();
  return width;
}
