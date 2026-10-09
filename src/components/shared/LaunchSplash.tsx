import { Image } from 'expo-image';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

import { Body, Heading } from './Typography';

const mark = require('../../../assets/images/martnow-mark.png');

export function LaunchSplash() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const markSize = Math.min(188, Math.round(width * 0.44));

  return (
    <View
      accessibilityLabel="MartNow"
      accessibilityRole="image"
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <Image
        accessibilityLabel="MartNow logo"
        contentFit="contain"
        source={mark}
        style={{ width: markSize, height: markSize }}
      />
      <Heading style={styles.title}>MartNow</Heading>
      <Body style={styles.tagline}>All stores, one marketplace</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.mint,
  },
  title: {
    marginTop: 6,
    color: colors.tealDark,
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 34,
    lineHeight: 40,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 21,
  },
});
