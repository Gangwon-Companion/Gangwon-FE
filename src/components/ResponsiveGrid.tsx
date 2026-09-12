import React from 'react';
import { View } from 'react-native';

export default function ResponsiveGrid({ children }: { children: React.ReactNode; minWidth?: number }) {
  return <View>{children}</View>;
}
