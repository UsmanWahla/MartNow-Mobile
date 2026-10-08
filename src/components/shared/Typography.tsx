import type { ComponentProps } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';

type TextProps = ComponentProps<typeof Text>;

export function Heading({ style, ...props }: TextProps) {
  return <Text style={[styles.heading, style]} {...props} />;
}

export function Body({ style, ...props }: TextProps) {
  return <Text style={[styles.body, style]} {...props} />;
}

export function Label({ style, ...props }: TextProps) {
  return <Text style={[styles.label, style]} {...props} />;
}

export function Money({ style, children, ...props }: TextProps) {
  return (
    <Text style={[styles.money, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.ink, fontFamily: 'Outfit_700Bold' },
  body: { color: colors.muted, fontFamily: 'Outfit_400Regular' },
  label: { color: colors.ink, fontFamily: 'Outfit_600SemiBold' },
  money: {
    color: colors.ink,
    fontFamily: 'IBMPlexSans_600SemiBold',
    fontVariant: ['tabular-nums'],
  },
});
