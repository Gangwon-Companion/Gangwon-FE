import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/home/HomeScreen';
import MyTravelCoursesScreen from '../screens/travel/MyTravelCoursesScreen';
import AIRecommendScreen from '../screens/travel/AIRecommendScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import MyPageScreen from '../screens/mypage/MyPageScreen';

export type TabParamList = {
  홈: undefined;
  내여행: undefined;
  AI추천: undefined;
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

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = (Platform.OS === 'ios' ? 56 : 64) + insets.bottom;

  return (
    <View
      style={[
        styles.tabBar,
        {
          height: tabBarHeight,
          paddingBottom: 8 + insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const config = TAB_CONFIG[index];
        const color = focused ? COLORS.primary : COLORS.inactive;

        return (
          <Pressable
            key={route.key}
            style={styles.tabItem}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          >
            <Ionicons
              name={focused ? config.iconFocused : config.icon}
              size={24}
              color={color}
            />
            <Text style={[styles.label, { color }]}>{config.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {TAB_CONFIG.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
