import React from 'react';
import { WebView } from 'react-native-webview';

export default function MapCanvas({ html }: { html: string }) {
  return <WebView source={{ html, baseUrl: 'https://map.naver.com' }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled originWhitelist={['*']} />;
}
