import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular';
import { IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans/500Medium';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold';
import { IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans/700Bold';
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { LaunchSplash } from '@/components/shared/LaunchSplash';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/store/auth-context';
import { FeedbackProvider } from '@/store/feedback-context';
import { ShopProvider } from '@/store/shop-context';

void SplashScreen.preventAutoHideAsync();

const LAUNCH_SPLASH_MS = 1400;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });
  const [introDone, setIntroDone] = useState(false);
  const fontsReady = Boolean(fontsLoaded || fontError);

  useEffect(() => {
    if (!fontsReady) return;
    void SplashScreen.hideAsync();
    const timer = setTimeout(() => setIntroDone(true), LAUNCH_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics} style={styles.safeAreaProvider}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.mint} hidden={false} />
        <FeedbackProvider>
          <AuthProvider>
            <ShopProvider>
              {introDone ? (
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: styles.screen,
                  }}
                />
              ) : (
                <LaunchSplash />
              )}
            </ShopProvider>
          </AuthProvider>
        </FeedbackProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mint },
  safeAreaProvider: { backgroundColor: colors.mint },
  screen: { backgroundColor: colors.page },
});
