import React from 'react';
import { useDesktopLayout } from '../hooks/useContentWidth';

export default function ResponsiveGrid({ children, minWidth = 300 }: { children: React.ReactNode; minWidth?: number }) {
  const desktop = useDesktopLayout();
  return <div style={{ display: 'grid', gridTemplateColumns: desktop ? `repeat(auto-fit, minmax(min(100%, ${minWidth}px), 1fr))` : 'minmax(0, 1fr)', gap: desktop ? 20 : 0, alignItems: 'start', minWidth: 0 }}>{children}</div>;
}
