export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  EmailLogin: undefined;
  SignUp: undefined;
  Main: undefined;
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
};
