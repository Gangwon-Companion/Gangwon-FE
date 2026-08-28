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
  RestaurantsTab: undefined;
  HotelNavigation: {
    name: string;
    location: string;
  };
};
