import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/shared/AppIcon';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { colors, radius, shadow } from '@/constants/theme';

type ToastTone = 'success' | 'error' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
}

interface FeedbackContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, tone });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    setConfirmState({ ...options, resolve });
  }), []);

  const settle = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  const value = useMemo(() => ({ showToast, confirm }), [confirm, showToast]);
  const toastColor = toast?.tone === 'error' ? colors.danger : toast?.tone === 'success' ? colors.success : colors.teal;
  const toastIcon = toast?.tone === 'error' ? 'alert-circle' : toast?.tone === 'success' ? 'checkmark-circle' : 'information-circle';

  return <FeedbackContext.Provider value={value}>
    {children}
    {toast ? <Animated.View entering={FadeInDown.duration(220).reduceMotion(ReduceMotion.System)} exiting={FadeOutDown.duration(180).reduceMotion(ReduceMotion.System)} style={[styles.toast, { bottom: Math.max(18, insets.bottom + 12), borderLeftColor: toastColor }]}><AppIcon name={toastIcon} size={21} color={toastColor} /><Label style={styles.toastText}>{toast.message}</Label><Pressable accessibilityLabel="Dismiss message" hitSlop={8} onPress={() => setToast(null)}><AppIcon name="close" size={19} color={colors.muted} /></Pressable></Animated.View> : null}
    <Modal transparent visible={Boolean(confirmState)} animationType="fade" onRequestClose={() => settle(false)}>
      <View style={styles.backdrop}><View style={styles.dialog}><View style={[styles.dialogIcon, confirmState?.destructive && styles.dialogIconDanger]}><AppIcon name={confirmState?.destructive ? 'trash-outline' : 'help-circle-outline'} size={26} color={confirmState?.destructive ? colors.danger : colors.teal} /></View><Heading style={styles.dialogTitle}>{confirmState?.title}</Heading><Body style={styles.dialogMessage}>{confirmState?.message}</Body><View style={styles.dialogActions}><Pressable onPress={() => settle(false)} style={({ pressed }) => [styles.dialogButton, styles.cancelButton, pressed && styles.pressed]}><Label style={styles.cancelText}>Cancel</Label></Pressable><Pressable onPress={() => settle(true)} style={({ pressed }) => [styles.dialogButton, confirmState?.destructive ? styles.dangerButton : styles.confirmButton, pressed && styles.pressed]}><Label style={styles.confirmText}>{confirmState?.confirmLabel || 'Confirm'}</Label></Pressable></View></View></View>
    </Modal>
  </FeedbackContext.Provider>;
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used inside FeedbackProvider.');
  return context;
}

const styles = StyleSheet.create({ toast: { position: 'absolute', zIndex: 100, left: 16, right: 16, maxWidth: 560, alignSelf: 'center', minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radius.md, borderLeftWidth: 4, backgroundColor: colors.surface, ...shadow }, toastText: { flex: 1, fontSize: 13 }, backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, backgroundColor: 'rgba(6, 20, 18, 0.58)' }, dialog: { width: '100%', maxWidth: 420, alignItems: 'center', borderRadius: radius.lg, backgroundColor: colors.surface, padding: 22, ...shadow }, dialogIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tealSoft }, dialogIconDanger: { backgroundColor: colors.dangerSoft }, dialogTitle: { marginTop: 13, fontSize: 20, textAlign: 'center' }, dialogMessage: { marginTop: 7, fontSize: 14, lineHeight: 20, textAlign: 'center' }, dialogActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 20 }, dialogButton: { minHeight: 46, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md }, cancelButton: { backgroundColor: '#EDF2F0' }, confirmButton: { backgroundColor: colors.teal }, dangerButton: { backgroundColor: colors.danger }, cancelText: { color: colors.ink }, confirmText: { color: '#fff' }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] } });
