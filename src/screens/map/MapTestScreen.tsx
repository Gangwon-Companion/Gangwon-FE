import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const NAVER_CLIENT_ID = '3qp69wrk19';

// ngrok 실행 후 발급된 URL로 교체 (재시작마다 바뀜)
// 예: npx ngrok http 8080  →  https://xxxx.ngrok-free.app
const BACKEND_URL = 'https://여기에-ngrok-url-입력.ngrok-free.app';

// 테스트용 목적지 (춘천 닭갈비골목)
const TEST_GOAL = { lat: 37.8813, lng: 127.7298, name: '춘천 닭갈비골목' };

type TravelMode = 'DRIVE' | 'WALK' | 'TRANSIT';

const MODES: { key: TravelMode; label: string }[] = [
  { key: 'DRIVE', label: '자동차' },
  { key: 'WALK', label: '도보' },
  { key: 'TRANSIT', label: '대중교통' },
];

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

    var polyline = null;
    var markers = [];

    function clearMap() {
      if (polyline) { polyline.setMap(null); polyline = null; }
      markers.forEach(function(m) { m.setMap(null); });
      markers = [];
    }

    function drawRoute(data) {
      clearMap();

      // data.path: [[lng, lat], ...]  (네이버 응답 형식)
      var coords = data.path.map(function(p) {
        return new naver.maps.LatLng(p[1], p[0]);
      });

      polyline = new naver.maps.Polyline({
        path: coords,
        strokeColor: '#008A9A',
        strokeWeight: 5,
        strokeOpacity: 0.9,
        map: map
      });

      var startMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(data.startLat, data.startLng),
        map: map,
        title: '출발'
      });
      var goalMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(data.goalLat, data.goalLng),
        map: map,
        title: '도착'
      });
      markers.push(startMarker, goalMarker);

      var bounds = new naver.maps.LatLngBounds(coords[0], coords[0]);
      coords.forEach(function(c) { bounds.extend(c); });
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 60, left: 40 });
    }

    function handleMessage(raw) {
      try {
        var msg = JSON.parse(raw);
        if (msg.type === 'drawRoute') drawRoute(msg);
      } catch(e) {}
    }

    // Android: document.addEventListener, iOS: window.addEventListener
    document.addEventListener('message', function(e) { handleMessage(e.data); });
    window.addEventListener('message', function(e) { handleMessage(e.data); });
  </script>
</body>
</html>
`;

export default function MapTestScreen() {
  const webViewRef = useRef<WebView>(null);
  const [mode, setMode] = useState<TravelMode>('DRIVE');
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      const url =
        `${BACKEND_URL}/api/v1/navigation/directions` +
        `?startLat=${location.lat}&startLng=${location.lng}` +
        `&goalLat=${TEST_GOAL.lat}&goalLng=${TEST_GOAL.lng}` +
        `&mode=${mode}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
      const data = await res.json();

      // 백엔드 응답: { route: { traoptimal|trafast: [{ path: [[lng, lat], ...] }] } }
      // DRIVE → traoptimal, WALK → trafast 등 모드마다 키가 다름
      const routeKey = Object.keys(data.route)[0];
      const path: [number, number][] = data.route[routeKey][0].path;

      const msg = JSON.stringify({
        type: 'drawRoute',
        path,
        startLat: location.lat,
        startLng: location.lng,
        goalLat: TEST_GOAL.lat,
        goalLng: TEST_GOAL.lng,
      });

      webViewRef.current?.injectJavaScript(
        `handleMessage(${JSON.stringify(msg)}); true;`
      );
    } catch (e: any) {
      Alert.alert('오류', e.message ?? '경로를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
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

      <View style={styles.modeRow}>
        {MODES.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
            onPress={() => setMode(key)}
          >
            <Text style={[styles.modeBtnText, mode === key && styles.modeBtnTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.routeBtn, (!location || loading) && styles.routeBtnDisabled]}
          onPress={handleFindRoute}
          disabled={!location || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.routeBtnText}>길찾기</Text>
          )}
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
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  modeBtnTextActive: { color: '#fff' },
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
