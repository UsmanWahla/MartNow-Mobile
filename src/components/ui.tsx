import { type ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, shadow } from '@/constants/theme';
import { AppIcon } from '@/components/shared/AppIcon';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  fullWidth = true,
}: ButtonProps) {
  const isInactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isInactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.buttonFull,
        styles[`button_${variant}`],
        isInactive && styles.buttonDisabled,
        pressed && !isInactive && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.teal} />
      ) : (
        <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#8B9B95"
        style={[
          styles.field,
          props.multiline && styles.fieldMultiline,
          Boolean(error) && styles.fieldError,
        ]}
        {...props}
      />
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

export function PasswordField({
  label,
  error,
  value,
  onChangeText,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.passwordWrap, Boolean(error) && styles.fieldError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholderTextColor="#8B9B95"
          style={styles.passwordInput}
          {...props}
        />
        <Pressable
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          onPress={() => setVisible((current) => !current)}
          hitSlop={8}
        >
          <AppIcon
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.muted}
          />
        </Pressable>
      </View>
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.teal} size="large" />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>Couldn’t load this yet</Text>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Button label="Try again" onPress={onRetry} variant="secondary" fullWidth={false} />
      ) : null}
    </View>
  );
}

export function ChoiceChip({
  label,
  selected,
  onPress,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
        pressed && !disabled && styles.chipPressed,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          disabled && styles.chipTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonFull: { alignSelf: 'stretch' },
  button_primary: { backgroundColor: colors.teal, ...shadow },
  button_secondary: {
    backgroundColor: colors.tealSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button_danger: { backgroundColor: colors.danger },
  button_ghost: { backgroundColor: 'transparent' },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
    shadowOpacity: 0,
  },
  buttonPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  buttonText: { fontSize: 15, fontFamily: 'Outfit_700Bold' },
  buttonText_primary: { color: '#fff' },
  buttonText_secondary: { color: colors.teal },
  buttonText_danger: { color: '#fff' },
  buttonText_ghost: { color: colors.teal },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontFamily: 'Outfit_600SemiBold' },
  field: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.ink,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    backgroundColor: colors.surface,
  },
  passwordWrap: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  passwordInput: {
    minHeight: 46,
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },
  fieldMultiline: { minHeight: 100, paddingTop: 13, textAlignVertical: 'top' },
  fieldError: { borderColor: colors.danger },
  fieldErrorText: { color: colors.danger, fontSize: 12, fontFamily: 'Outfit_500Medium' },
  state: { minHeight: 220, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 28 },
  stateText: { color: colors.muted, fontSize: 15 },
  empty: {
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, color: colors.ink, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 21 },
  emptyAction: { width: '100%', marginTop: 10 },
  error: { borderRadius: radius.lg, padding: 22, backgroundColor: colors.dangerSoft, gap: 8 },
  errorTitle: { color: colors.danger, fontSize: 17, fontWeight: '800' },
  errorText: { color: '#7A271A', lineHeight: 20, marginBottom: 5 },
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipDisabled: { opacity: 0.45 },
  chipPressed: { opacity: 0.75 },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  chipTextSelected: { color: '#fff' },
  chipTextDisabled: { color: colors.disabled },
});
