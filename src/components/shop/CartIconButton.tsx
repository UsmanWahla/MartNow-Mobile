import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/shared/AppIcon';
import { Label } from '@/components/shared/Typography';
import { colors, radius } from '@/constants/theme';
import { useCartShop } from '@/store/shop-context';

export function CartIconButton({ onPress }: { onPress: () => void }) {
  const { cartCount } = useCartShop();
  const hasItems = cartCount > 0;
  const itemLabel = cartCount === 1 ? 'item' : 'items';

  return (
    <Pressable
      accessibilityLabel={hasItems ? `Open cart, ${cartCount} ${itemLabel}` : 'Open cart'}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <AppIcon name="cart-outline" size={22} color={colors.teal} />
      {hasItems ? (
        <View style={styles.badge}>
          <Label style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Label>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.tealSoft,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.page,
    backgroundColor: colors.amber,
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontFamily: 'IBMPlexSans_600SemiBold', fontSize: 9 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});
