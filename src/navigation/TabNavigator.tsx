import React from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/home/HomeScreen';
import MyTravelCoursesScreen from '../screens/travel/MyTravelCoursesScreen';
import AIRecommendScreen from '../screens/travel/AIRecommendScreen';
import MapTestScreen from '../screens/map/MapTestScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';

export type TabParamList = {
  홈: undefined;
  내여행: undefined;
  AI추천: undefined;
  지도테스트: undefined;
  커뮤니티: undefined;
  마이: undefined;
};

const COLORS = {
  primary: '#008A9A',
  inactive: '#9CA3AF',
  white: '#FFFFFF',
  border: '#E5E7EB',
};

type TabConfig = {
  name: keyof TabParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  component: React.ComponentType<any>;
};

const TAB_CONFIG: TabConfig[] = [
  {
    name: '홈',
    label: '홈',
    icon: 'home-outline',
    iconFocused: 'home',
    component: HomeScreen,
  },
  {
    name: '내여행',
    label: '내 여행',
    icon: 'map-outline',
    iconFocused: 'map',
    component: MyTravelCoursesScreen,
  },
  {
    name: 'AI추천',
    label: 'AI 추천',
    icon: 'sparkles-outline',
    iconFocused: 'sparkles',
    component: AIRecommendScreen,
  },
  {
    name: '지도테스트',
    label: '지도테스트',
    icon: 'navigate-outline',
    iconFocused: 'navigate',
    component: MapTestScreen,
  },
  {
    name: '커뮤니티',
    label: '커뮤니티',
    icon: 'people-outline',
    iconFocused: 'people',
    component: CommunityScreen,
  },
  {
    name: '마이',
    label: '마이',
    icon: 'person-outline',
    iconFocused: 'person',
    component: MyPageScreen,
  },
];

type TabIconProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
};

function TabIcon({ iconName, label, focused }: TabIconProps) {
  const color = focused ? COLORS.primary : COLORS.inactive;
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={iconName} size={24} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                iconName={focused ? tab.iconFocused : tab.icon}
                label={tab.label}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingHorizontal: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
