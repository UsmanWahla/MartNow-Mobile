import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useSegments } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

const PAGE_MAX_WIDTH = 1180;

export function Page({
  children,
  refreshing,
  onRefresh,
  keyboard = false,
  compact = false,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboard?: boolean;
  compact?: boolean;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const isTabScreen = (segments as readonly string[]).includes('(tabs)');
  const horizontal = width < 380 ? 12 : width < 768 ? 18 : 28;
  const bottomSpace = isTabScreen ? 96 : Math.max(42, insets.bottom + 28);
  const content = (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.teal}
          />
        ) : undefined
      }
    >
      <Animated.View
        entering={FadeInDown.duration(360).reduceMotion(ReduceMotion.System)}
        style={[
          styles.inner,
          {
            paddingHorizontal: horizontal,
            paddingBottom: bottomSpace,
            maxWidth: compact ? 760 : PAGE_MAX_WIDTH,
          },
        ]}
      >
        {children}
      </Animated.View>
    </ScrollView>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  fill: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { width: '100%', alignSelf: 'center', gap: 18 },
});
