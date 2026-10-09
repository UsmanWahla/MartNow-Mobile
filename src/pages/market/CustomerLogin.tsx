import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthScaffold } from '@/components/market/AuthScaffold';
import { Page } from '@/components/shared/Page';
import { Button, Field, LoadingState, PasswordField } from '@/components/ui';
import { useAuth } from '@/store/auth-context';
import { getErrorMessage } from '@/utils/error-message';
import { safeDestination } from '@/utils/navigation';

export default function CustomerLogin() {
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const next = safeDestination(params.next);
  const { isAuthenticated, isReady, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) router.replace(next as never);
  }, [isAuthenticated, isReady, next]);

  const submit = async () => {
    const validation: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      validation.email = 'Enter a valid email address.';
    if (!password) validation.password = 'Enter your password.';
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setSubmitting(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace(next as never);
    } catch (cause) {
      setErrors({ password: getErrorMessage(cause) });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isReady || isAuthenticated)
    return (
      <Page>
        <LoadingState label="Preparing your account…" />
      </Page>
    );
  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="One account for every MartNow store."
      footerText="New to MartNow?"
      footerAction="Create account"
      onFooterPress={() => router.replace({ pathname: '/auth/signup', params: { next } })}
      onBrowse={() => router.replace('/(tabs)/market')}
    >
      <Field
        label="Email"
        value={email}
        error={errors.email}
        placeholder="Enter your email"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        editable={!submitting}
        onChangeText={(value) => {
          setEmail(value);
          setErrors({});
        }}
      />
      <PasswordField
        label="Password"
        value={password}
        error={errors.password}
        placeholder="Enter your password"
        autoComplete="current-password"
        editable={!submitting}
        onChangeText={(value) => {
          setPassword(value);
          setErrors({});
        }}
        onSubmitEditing={() => {
          void submit();
        }}
        returnKeyType="go"
      />
      <Button
        label="Log in"
        loading={submitting}
        onPress={() => {
          void submit();
        }}
      />
    </AuthScaffold>
  );
}
