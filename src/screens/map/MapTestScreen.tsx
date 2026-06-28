import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const NAVER_CLIENT_ID = '3qp69wrk19';

// 테스트용 목적지 (춘천 닭갈비골목)
const TEST_GOAL = { lat: 37.8813, lng: 127.7298, name: '춘천 닭갈비골목' };
const APP_IDENTIFIER = 'com.gangwon.gangwonfe';

const NAVER_MAP_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/kr/app/id311867728',
  android: 'market://details?id=com.nhn.android.nmap',
  default: 'https://map.naver.com',
});

const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = new naver.maps.Map('map', {
      center: new naver.maps.LatLng(${TEST_GOAL.lat}, ${TEST_GOAL.lng}),
      zoom: 13
    });
    new naver.maps.Marker({
        position: new naver.maps.LatLng(${TEST_GOAL.lat}, ${TEST_GOAL.lng}),
        map: map,
        title: ${JSON.stringify(TEST_GOAL.name)}
    });
  </script>
</body>
</html>
`;

export default function MapTestScreen() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한 필요', '길찾기를 위해 위치 권한을 허용해 주세요.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
  }, []);

  const handleFindRoute = async () => {
    if (!location) {
      Alert.alert('위치 확인 중', '현재 위치를 아직 가져오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    const params = [
      ['slat', location.lat.toString()],
      ['slng', location.lng.toString()],
      ['sname', '현재 위치'],
      ['dlat', TEST_GOAL.lat.toString()],
      ['dlng', TEST_GOAL.lng.toString()],
      ['dname', TEST_GOAL.name],
      ['appname', APP_IDENTIFIER],
    ]
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    const routeUrl = `nmap://route/car?${params}`;

    try {
      await Linking.openURL(routeUrl);
    } catch {
      Alert.alert('네이버 지도 앱 필요', '길찾기를 이용하려면 네이버 지도 앱을 설치해 주세요.', [
        { text: '취소', style: 'cancel' },
        {
          text: '설치하기',
          onPress: () => {
            void Linking.openURL(NAVER_MAP_STORE_URL);
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>지도 길찾기 테스트</Text>
        <Text style={styles.subtitle}>
          목적지: {TEST_GOAL.name}
          {location ? '' : '  (위치 가져오는 중…)'}
        </Text>
      </View>

      <WebView
        source={{ html: mapHTML, baseUrl: 'https://map.naver.com' }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.routeBtn, !location && styles.routeBtnDisabled]}
          onPress={handleFindRoute}
          disabled={!location}
        >
          <Text style={styles.routeBtnText}>네이버 지도에서 길찾기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const PRIMARY = '#008A9A';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2933' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  map: { flex: 1 },
  bottomBar: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  routeBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  routeBtnDisabled: { backgroundColor: '#9CA3AF' },
  routeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
