import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const allowDevelopmentHttp = process.env.MARTNOW_ALLOW_HTTP === 'true';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';
  const buildPlatform = process.env.EAS_BUILD_PLATFORM;
  const plugins: NonNullable<ExpoConfig['plugins']> = [...(config.plugins ?? [])];

  if (isProductionBuild && (!apiUrl || !/^https:\/\//i.test(apiUrl))) {
    throw new Error('Production builds require an HTTPS EXPO_PUBLIC_API_URL.');
  }

  if (isProductionBuild && allowDevelopmentHttp) {
    throw new Error('MARTNOW_ALLOW_HTTP must be false or unset for production builds.');
  }

  if (isProductionBuild && buildPlatform === 'android' && !androidGoogleMapsApiKey) {
    throw new Error('Android production builds require GOOGLE_MAPS_ANDROID_API_KEY.');
  }

  if (androidGoogleMapsApiKey) {
    plugins.push(['react-native-maps', { androidGoogleMapsApiKey }]);
  }

  if (allowDevelopmentHttp) {
    plugins.push(['expo-build-properties', { android: { usesCleartextTraffic: true } }]);
  }

  return {
    ...config,
    name: config.name ?? 'MartNow Mobile',
    slug: config.slug ?? 'martnow-mobile',
    platforms: ['ios', 'android'],
    ios: {
      ...config.ios,
      supportsTablet: true,
      infoPlist: {
        ...config.ios?.infoPlist,
        ...(allowDevelopmentHttp
          ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } }
          : {}),
      },
    },
    plugins,
  };
};
