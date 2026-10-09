import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/shared/BrandLogo';
import { Page } from '@/components/shared/Page';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { Button } from '@/components/ui';
import { colors, radius } from '@/constants/theme';

interface AuthScaffoldProps {
  title: string;
  subtitle: string;
  footerText: string;
  footerAction: string;
  onFooterPress: () => void;
  onBrowse: () => void;
  children: ReactNode;
}

export function AuthScaffold({
  title,
  subtitle,
  footerText,
  footerAction,
  onFooterPress,
  onBrowse,
  children,
}: AuthScaffoldProps) {
  return (
    <Page compact keyboard>
      <View style={styles.brand}>
        <BrandLogo style={styles.logo} />
        <Label style={styles.eyebrow}>MULTI-STORE MARKETPLACE</Label>
      </View>
      <View style={styles.card}>
        <Heading style={styles.title}>{title}</Heading>
        <Body style={styles.subtitle}>{subtitle}</Body>
        <View style={styles.form}>{children}</View>
      </View>
      <View style={styles.footer}>
        <Body>{footerText}</Body>
        <Pressable accessibilityRole="link" onPress={onFooterPress}>
          <Label style={styles.link}>{footerAction}</Label>
        </Pressable>
      </View>
      <Button label="Browse stores" variant="ghost" onPress={onBrowse} />
    </Page>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 7, marginTop: 18 },
  logo: { width: 260, maxWidth: '92%', height: 48 },
  eyebrow: { color: colors.teal, fontSize: 9, letterSpacing: 1.2 },
  card: {
    gap: 6,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { fontSize: 25 },
  subtitle: { fontSize: 13 },
  form: { gap: 15, marginTop: 10 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  link: { color: colors.teal },
});
