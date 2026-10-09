import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthScaffold } from '@/components/market/AuthScaffold';
import { Page } from '@/components/shared/Page';
import { Button, Field, LoadingState, PasswordField } from '@/components/ui';
import { useAuth } from '@/store/auth-context';
import { getErrorMessage } from '@/utils/error-message';
import { safeDestination } from '@/utils/navigation';

export default function CustomerRegister() {
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const next = safeDestination(params.next);
  const { isAuthenticated, isReady, signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) router.replace(next as never);
  }, [isAuthenticated, isReady, next]);

  const submit = async () => {
    const validation: Record<string, string> = {};
    if (!name.trim()) validation.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      validation.email = 'Enter a valid email address.';
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
      validation.password = 'Use 8+ characters with a letter and a number.';
    if (confirmPassword !== password) validation.confirm = 'Passwords do not match.';
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setSubmitting(true);
    try {
      await signUp({ name: name.trim(), email: email.trim().toLowerCase(), password });
      router.replace(next as never);
    } catch (cause) {
      setErrors({ email: getErrorMessage(cause) });
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
      title="Create account"
      subtitle="Shop every store with one secure login."
      footerText="Already have an account?"
      footerAction="Log in"
      onFooterPress={() => router.replace({ pathname: '/auth/login', params: { next } })}
      onBrowse={() => router.replace('/(tabs)/market')}
    >
      <Field
        label="Full name"
        value={name}
        error={errors.name}
        placeholder="Enter your name"
        autoComplete="name"
        autoCapitalize="words"
        editable={!submitting}
        onChangeText={(value) => {
          setName(value);
          setErrors({});
        }}
      />
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
        placeholder="8+ characters, letter and number"
        autoComplete="new-password"
        editable={!submitting}
        onChangeText={(value) => {
          setPassword(value);
          setErrors({});
        }}
      />
      <PasswordField
        label="Confirm password"
        value={confirmPassword}
        error={errors.confirm}
        placeholder="Re-enter your password"
        autoComplete="new-password"
        editable={!submitting}
        onChangeText={(value) => {
          setConfirmPassword(value);
          setErrors({});
        }}
        onSubmitEditing={() => {
          void submit();
        }}
        returnKeyType="go"
      />
      <Button
        label="Create account"
        loading={submitting}
        onPress={() => {
          void submit();
        }}
      />
    </AuthScaffold>
  );
}
