import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/shared/AppIcon';
import { Money } from '@/components/shared/Typography';
import { colors, radius } from '@/constants/theme';
import { formatQuantity, roundQuantity } from '@/utils/product-units';

export function QuantityStepper({
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const decreaseDisabled = disabled || value <= min;
  const increaseDisabled = disabled || value + step > max + 0.0001;
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={decreaseDisabled}
        onPress={() => onChange(roundQuantity(Math.max(min, value - step)))}
        style={({ pressed }) => [
          styles.button,
          decreaseDisabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <AppIcon name="remove" size={18} color={colors.teal} />
      </Pressable>
      <Money style={styles.value}>{formatQuantity(value)}</Money>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={increaseDisabled}
        onPress={() => onChange(roundQuantity(Math.min(max, value + step)))}
        style={({ pressed }) => [
          styles.button,
          increaseDisabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <AppIcon name="add" size={18} color={colors.teal} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 4,
  },
  button: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.tealSoft,
  },
  value: { minWidth: 42, textAlign: 'center', fontSize: 14 },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.94 }] },
});
