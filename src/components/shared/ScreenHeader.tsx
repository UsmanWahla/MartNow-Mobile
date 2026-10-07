import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppIcon } from './AppIcon';
import { Body, Heading } from './Typography';
import { colors, radius } from '@/constants/theme';

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <AppIcon name="chevron-back" size={22} color={colors.teal} />
      </Pressable>
      <View style={styles.copy}>
        <Heading numberOfLines={1} style={styles.title}>{title}</Heading>
        {subtitle ? <Body numberOfLines={1} style={styles.subtitle}>{subtitle}</Body> : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11 },
  back: { width: 42, height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  copy: { flex: 1 },
  title: { fontSize: 19 },
  subtitle: { marginTop: 1, fontSize: 12 },
  right: { minWidth: 42, alignItems: 'flex-end' },
  pressed: { opacity: 0.65, transform: [{ scale: 0.96 }] },
});
