import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

const logo = require('../../../assets/images/martnow-logo.png');

export function BrandLogo({ style }: { style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      accessibilityLabel="MartNow"
      accessibilityRole="image"
      contentFit="contain"
      source={logo}
      style={style}
    />
  );
}
