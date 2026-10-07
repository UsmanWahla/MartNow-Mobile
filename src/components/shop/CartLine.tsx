import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { QuantityStepper } from './QuantityStepper';
import { AppIcon } from '@/components/shared/AppIcon';
import { Body, Heading, Money } from '@/components/shared/Typography';
import { colors, radius } from '@/constants/theme';
import { assetUrl } from '@/services/martnow';
import type { ShopCartItem } from '@/types/api';
import { formatPrice } from '@/utils/format';
import { productStep, unitLabel } from '@/utils/product-units';

export function CartLine({ item, busy, onQuantity, onRemove }: { item: ShopCartItem; busy?: boolean; onQuantity: (quantity: number) => void; onRemove: () => void }) {
  const uri = assetUrl(item.image_path); const step = productStep(item); const quantity = Number(item.quantity); const max = Number(item.stock);
  return <View style={styles.card}><View style={styles.imageWrap}>{uri ? <Image source={uri} style={styles.image} contentFit="cover" transition={120} /> : <AppIcon name="image-outline" size={26} color={colors.disabled} />}</View><View style={styles.copy}><View style={styles.nameRow}><Heading numberOfLines={2} style={styles.name}>{item.name}</Heading><Pressable accessibilityLabel={`Remove ${item.name}`} disabled={busy} onPress={onRemove} style={({ pressed }) => [styles.remove, pressed && styles.pressed, busy && styles.disabled]}><AppIcon name="trash-outline" size={18} color={colors.danger} /></Pressable></View>{item.color || item.size ? <Body style={styles.variant}>{[item.color, item.size].filter(Boolean).join(' / ')}</Body> : null}<View style={styles.priceRow}><Money style={styles.price}>{formatPrice(item.price)}</Money><Body style={styles.unit}>/ {item.sale_unit || 'piece'}</Body></View><View style={styles.bottom}><QuantityStepper value={quantity} min={step} max={max} step={step} disabled={busy} onChange={onQuantity} /><View style={styles.lineTotal}><Body style={styles.lineLabel}>Line total</Body><Money style={styles.total}>{formatPrice(item.line_total)}</Money></View></View><Body style={styles.stock}>{max} {unitLabel(item.sale_unit, max)} available</Body></View></View>;
}

const styles = StyleSheet.create({ card: { flexDirection: 'row', gap: 11, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, imageWrap: { width: 82, height: 92, flexShrink: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.tealSoft }, image: { width: '100%', height: '100%' }, copy: { minWidth: 0, flex: 1, gap: 3 }, nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, name: { flex: 1, fontSize: 14, lineHeight: 18 }, remove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.dangerSoft }, variant: { color: colors.teal, fontSize: 11 }, priceRow: { flexDirection: 'row', alignItems: 'baseline' }, price: { color: colors.teal, fontSize: 13 }, unit: { marginLeft: 3, fontSize: 10 }, bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }, lineTotal: { alignItems: 'flex-end' }, lineLabel: { fontSize: 9 }, total: { fontSize: 13 }, stock: { marginTop: 2, fontSize: 9 }, pressed: { opacity: 0.65 }, disabled: { opacity: 0.4 } });
