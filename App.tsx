import React, { useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { Platform, StyleSheet, View } from 'react-native';
import { linking } from './src/navigation/linking';
import { AlertHost } from './src/utils/alert';
import { useDesktopLayout } from './src/hooks/useContentWidth';
import WebHeader from './src/components/WebHeader';
import type { RootStackParamList } from './src/navigation/types';

export default function App() {
  const desktop = useDesktopLayout();
  const navigation = useNavigationContainerRef<RootStackParamList>();
  const [activeRoute, setActiveRoute] = useState<string>();
  const updateRoute = () => setActiveRoute(navigation.getCurrentRoute()?.name);
  return (
    <View style={styles.page}>
      <SafeAreaProvider style={styles.app}>
        <NavigationContainer ref={navigation} onReady={updateRoute} onStateChange={updateRoute} linking={Platform.OS === 'web' ? linking : undefined} documentTitle={{ formatter: () => '강원동행 | 강원도 여행' }}>
          {desktop && <WebHeader activeRoute={activeRoute} onNavigate={(screen) => navigation.navigate('Main', { screen })} />}
          <View style={styles.content}>
            <RootNavigator />
          </View>
        </NavigationContainer>
        <AlertHost />
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EEF3F5', alignItems: 'center' },
  app: { flex: 1, width: '100%', minHeight: 0, backgroundColor: '#F7F8FA' },
  content: { flex: 1, minHeight: 0, width: '100%' },
});
