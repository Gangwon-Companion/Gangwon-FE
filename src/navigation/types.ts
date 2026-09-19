import type { NavigatorScreenParams } from '@react-navigation/native';
export type TabParamList = {
  홈: undefined;
  내여행: undefined;
  AI추천: undefined;
  커뮤니티: { postId?: number } | undefined;
  마이: undefined;
};

export type RootStackParamList = {
  NotFound: undefined;
  Onboarding: undefined;
  Login: undefined;
  EmailLogin: undefined;
  SignUp: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  ThemeTab: undefined;
  ThemeDestinations: {
    themeId: number;
    themeName: string;
  };
  DestinationDetail: {
    destinationId: number;
    title: string;
    firstImage?: string | null;
    pet: boolean;
    accessibility: boolean;
  };
  HotelsTab: undefined;
  HotelDetail: {
    lodgingId: number;
    name: string;
    imageUrl?: string | null;
    rating?: number | null;
    region?: string | null;
  };
  RestaurantsTab: undefined;
  RestaurantDetail: {
    restaurantId: number;
    name: string;
    imageUrl?: string | null;
    menuType?: string | null;
    rating?: number | null;
    region?: string | null;
  };
  HotelNavigation: {
    name: string;
    location: string;
  };
  TravelProfile: undefined;
};
