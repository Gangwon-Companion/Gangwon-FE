import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    initialRouteName: 'Main',
    screens: {
      Onboarding: '',
      Login: 'login',
      EmailLogin: 'login/email',
      SignUp: 'signup',
      Main: {
        screens: {
          홈: 'home',
          내여행: 'my-trips',
          AI추천: 'recommend',
          커뮤니티: { path: 'community', parse: { postId: Number } },
          마이: 'mypage',
        },
      },
      ThemeTab: 'themes',
      ThemeDestinations: { path: 'themes/:themeId', parse: { themeId: Number } },
      DestinationDetail: {
        path: 'destinations/:destinationId',
        parse: { destinationId: Number, pet: (value) => value === 'true', accessibility: (value) => value === 'true' },
      },
      HotelsTab: 'hotels',
      HotelDetail: { path: 'hotels/:lodgingId', parse: { lodgingId: Number, rating: Number } },
      RestaurantsTab: 'restaurants',
      RestaurantDetail: { path: 'restaurants/:restaurantId', parse: { restaurantId: Number, rating: Number } },
      HotelNavigation: 'hotel-navigation',
      NotFound: '*',
    },
  },
};
