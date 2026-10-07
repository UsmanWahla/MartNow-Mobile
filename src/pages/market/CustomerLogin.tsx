import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppIcon } from '@/components/shared/AppIcon';
import { Page } from '@/components/shared/Page';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { Button, Field, LoadingState, PasswordField } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { useAuth } from '@/store/auth-context';
import { getErrorMessage } from '@/utils/error-message';

function destination(value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value;
  return next?.startsWith('/') ? next : '/';
}

export default function CustomerLogin() {
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const next = destination(params.next);
  const { isAuthenticated, isReady, signIn } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({}); const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (isReady && isAuthenticated) router.replace(next as never); }, [isAuthenticated, isReady, next]);

  const submit = async () => {
    const validation: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) validation.email = 'Enter a valid email address.';
    if (!password) validation.password = 'Enter your password.';
    setErrors(validation); if (Object.keys(validation).length) return;
    setSubmitting(true);
    try { await signIn(email.trim().toLowerCase(), password); router.replace(next as never); }
    catch (cause) { setErrors({ password: getErrorMessage(cause) }); }
    finally { setSubmitting(false); }
  };

  if (!isReady || isAuthenticated) return <Page><LoadingState label="Preparing your account…" /></Page>;
  return <Page compact keyboard>
    <View style={styles.brand}><View style={styles.mark}><AppIcon name="bag-handle" size={27} color="#fff" /></View><Heading style={styles.brandName}>MartNow</Heading><Label style={styles.eyebrow}>MULTI-STORE MARKETPLACE</Label></View>
    <View style={styles.card}><Heading style={styles.title}>Welcome back</Heading><Body style={styles.subtitle}>One account for every MartNow store.</Body><View style={styles.form}><Field label="Email" value={email} error={errors.email} placeholder="Enter your email" autoCapitalize="none" autoComplete="email" autoCorrect={false} keyboardType="email-address" editable={!submitting} onChangeText={(value) => { setEmail(value); setErrors({}); }} /><PasswordField label="Password" value={password} error={errors.password} placeholder="Enter your password" autoComplete="current-password" editable={!submitting} onChangeText={(value) => { setPassword(value); setErrors({}); }} onSubmitEditing={() => { void submit(); }} returnKeyType="go" /><Button label="Log in" loading={submitting} onPress={() => { void submit(); }} /></View></View>
    <View style={styles.footer}><Body>New to MartNow?</Body><Pressable accessibilityRole="link" onPress={() => router.replace({ pathname: '/auth/signup', params: { next } })}><Label style={styles.link}>Create account</Label></Pressable></View>
    <Button label="Browse stores" variant="ghost" onPress={() => router.replace('/(tabs)/market')} />
  </Page>;
}

const styles = StyleSheet.create({ brand: { alignItems: 'center', gap: 4, marginTop: 18 }, mark: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.tealDark }, brandName: { fontSize: 26 }, eyebrow: { color: colors.teal, fontSize: 9, letterSpacing: 1.2 }, card: { gap: 6, padding: 20, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, title: { fontSize: 25 }, subtitle: { fontSize: 13 }, form: { gap: 15, marginTop: 10 }, footer: { flexDirection: 'row', justifyContent: 'center', gap: 5 }, link: { color: colors.teal } });
