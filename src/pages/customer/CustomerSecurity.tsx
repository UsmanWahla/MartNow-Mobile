import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Page } from '@/components/shared/Page';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Body, Heading } from '@/components/shared/Typography';
import { Button, EmptyState, LoadingState, PasswordField } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { updateCustomerPassword } from '@/services/martnow';
import { useAuth } from '@/store/auth-context';
import { useFeedback } from '@/store/feedback-context';
import { getErrorMessage } from '@/utils/error-message';

export default function CustomerSecurity() {
  const { isAuthenticated, isReady } = useAuth();
  const { showToast } = useFeedback();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!currentPassword) next.current = 'Enter your current password.';
    if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) next.new = 'Use 8+ characters with uppercase, lowercase and a number.';
    if (confirmPassword !== newPassword) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const response = await updateCustomerPassword({ currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      showToast(response.message || 'Password changed successfully.', 'success');
    } catch (cause) { showToast(getErrorMessage(cause), 'error'); }
    finally { setSaving(false); }
  };

  if (!isReady) return <Page><LoadingState label="Preparing security…" /></Page>;
  if (!isAuthenticated) return <Page compact><ScreenHeader title="Security" /><EmptyState title="Sign in required" message="Sign in before changing your password." action={<Button label="Log in" onPress={() => router.replace({ pathname: '/auth/login', params: { next: '/security' } })} />} /></Page>;

  return <Page compact keyboard><ScreenHeader title="Password & security" /><View style={styles.card}><Heading style={styles.title}>Change password</Heading><Body style={styles.hint}>Use a strong password you do not reuse elsewhere.</Body><PasswordField label="Current password" value={currentPassword} error={errors.current} autoComplete="current-password" onChangeText={(value) => { setCurrentPassword(value); setErrors({}); }} /><PasswordField label="New password" value={newPassword} error={errors.new} autoComplete="new-password" onChangeText={(value) => { setNewPassword(value); setErrors({}); }} /><PasswordField label="Confirm new password" value={confirmPassword} error={errors.confirm} autoComplete="new-password" onChangeText={(value) => { setConfirmPassword(value); setErrors({}); }} onSubmitEditing={() => { void submit(); }} returnKeyType="done" /><Button label="Update password" loading={saving} onPress={() => { void submit(); }} /></View></Page>;
}

const styles = StyleSheet.create({ card: { gap: 15, padding: 18, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, title: { fontSize: 21 }, hint: { marginTop: -8, marginBottom: 3, fontSize: 13, lineHeight: 19 } });
