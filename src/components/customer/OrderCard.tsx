import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp, ReduceMotion } from 'react-native-reanimated';

import { AppIcon } from '@/components/shared/AppIcon';
import { Body, Heading, Label, Money } from '@/components/shared/Typography';
import { colors, radius } from '@/constants/theme';
import { assetUrl } from '@/services/martnow';
import type { ShopOrder } from '@/types/api';
import { formatDate, formatPrice } from '@/utils/format';
import { formatOrderNumber, orderStatusLabel } from '@/utils/orders';

export function OrderStatus({
  order,
}: {
  order: Pick<ShopOrder, 'delivery_status' | 'payment_status'>;
}) {
  const label = orderStatusLabel(order);
  const tone =
    label === 'Paid'
      ? styles.statusPaid
      : label === 'Cancelled'
        ? styles.statusCancelled
        : label === 'Processing'
          ? styles.statusProcessing
          : label === 'Dispatched'
            ? styles.statusDispatched
            : styles.statusPending;
  const text =
    label === 'Paid'
      ? styles.statusPaidText
      : label === 'Cancelled'
        ? styles.statusCancelledText
        : label === 'Processing'
          ? styles.statusProcessingText
          : label === 'Dispatched'
            ? styles.statusDispatchedText
            : styles.statusPendingText;
  return (
    <View style={[styles.status, tone]}>
      <Label style={[styles.statusText, text]}>{label}</Label>
    </View>
  );
}

export function OrderCard({
  order,
  index = 0,
  onPress,
}: {
  order: ShopOrder;
  index?: number;
  onPress: () => void;
}) {
  const logo = assetUrl(order.logo_path);
  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 8) * 40)
        .duration(300)
        .reduceMotion(ReduceMotion.System)}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.logo}>
          {logo ? (
            <Image source={logo} style={styles.logoImage} contentFit="cover" />
          ) : (
            <AppIcon name="storefront-outline" size={23} color={colors.teal} />
          )}
        </View>
        <View style={styles.copy}>
          <View style={styles.top}>
            <View style={styles.titleWrap}>
              <Heading numberOfLines={1} style={styles.shop}>
                {order.shop_name || 'Store'}
              </Heading>
              <Body style={styles.meta}>
                Order #{formatOrderNumber(order.id)} · {formatDate(order.created_at)}
              </Body>
            </View>
            <OrderStatus order={order} />
          </View>
          <View style={styles.bottom}>
            <View>
              <Body style={styles.totalLabel}>Total</Body>
              <Money style={styles.total}>
                {formatPrice(order.payable_amount ?? order.total_amount)}
              </Money>
            </View>
            <View style={styles.details}>
              <Label style={styles.detailsText}>View details</Label>
              <AppIcon name="chevron-forward" size={15} color={colors.teal} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.992 }] },
  logo: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  logoImage: { width: '100%', height: '100%' },
  copy: { flex: 1, gap: 12 },
  top: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', alignItems: 'flex-start' },
  titleWrap: { minWidth: 0, flex: 1 },
  shop: { fontSize: 15 },
  meta: { marginTop: 2, fontSize: 11 },
  bottom: {
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F0',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 10 },
  total: { marginTop: 1, fontSize: 15 },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 9,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  detailsText: { color: colors.teal, fontSize: 11 },
  status: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 10 },
  statusPaid: { backgroundColor: colors.successSoft },
  statusPaidText: { color: colors.success },
  statusCancelled: { backgroundColor: colors.dangerSoft },
  statusCancelledText: { color: colors.danger },
  statusProcessing: { backgroundColor: colors.skySoft },
  statusProcessingText: { color: colors.sky },
  statusDispatched: { backgroundColor: colors.amberSoft },
  statusDispatchedText: { color: colors.amber },
  statusPending: { backgroundColor: '#EEF2F1' },
  statusPendingText: { color: colors.muted },
});
