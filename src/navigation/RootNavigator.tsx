import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import EmailLoginScreen from '../screens/auth/EmailLoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import TabNavigator from './TabNavigator';
import ThemeTabScreen from '../screens/home/ThemeTabScreen';
import HotelsTabScreen from '../screens/home/HotelsTabScreen';
import RestaurantsTabScreen from '../screens/home/RestaurantsTabScreen';
import HotelNavigationScreen from '../screens/travel/HotelNavigationScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="ThemeTab" component={ThemeTabScreen} />
      <Stack.Screen name="HotelsTab" component={HotelsTabScreen} />
      <Stack.Screen name="RestaurantsTab" component={RestaurantsTabScreen} />
      <Stack.Screen name="HotelNavigation" component={HotelNavigationScreen} />
    </Stack.Navigator>
  );
}
