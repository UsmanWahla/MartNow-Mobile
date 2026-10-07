import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp, ReduceMotion } from 'react-native-reanimated';

import { AppIcon } from '@/components/shared/AppIcon';
import { Body, Heading, Label, Money } from '@/components/shared/Typography';
import { colors, radius, shadow } from '@/constants/theme';
import { assetUrl } from '@/services/martnow';
import type { Product } from '@/types/api';
import { formatPrice } from '@/utils/format';
import { saleStock, unitLabel } from '@/utils/product-units';

export function ProductCard({ product, index = 0, width, onPress }: { product: Product; index?: number; width: number; onPress: () => void }) {
  const uri = assetUrl(product.image_path || product.images?.[0]?.path);
  const available = saleStock(product);
  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 10) * 35).duration(300).reduceMotion(ReduceMotion.System)} style={{ width }}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.media}>
          {uri ? <Image source={uri} style={styles.image} contentFit="cover" transition={160} recyclingKey={String(product.id)} /> : <View style={styles.fallback}><AppIcon name="image-outline" size={36} color="#6BA99C" /></View>}
          <View style={styles.badges}>
            {Boolean(product.featured) ? <View style={styles.featured}><Label style={styles.featuredText}>Featured</Label></View> : null}
            <View style={[styles.stock, available <= 0 && styles.sold]}><Label style={[styles.stockText, available <= 0 && styles.soldText]}>{available <= 0 ? 'Sold out' : 'In stock'}</Label></View>
          </View>
          {(product.images?.length ?? 0) > 1 ? <View style={styles.imageCount}><AppIcon name="images-outline" size={13} color="#fff" /><Label style={styles.imageCountText}>{product.images?.length}</Label></View> : null}
        </View>
        <View style={styles.content}>
          {product.category ? <Body numberOfLines={1} style={styles.category}>{product.category}</Body> : null}
          <Heading numberOfLines={2} style={styles.name}>{product.name}</Heading>
          <View style={styles.bottom}>
            <View style={styles.priceWrap}><Money style={styles.price}>{formatPrice(product.price)}</Money><Body style={styles.unit}>/ {product.sale_unit || 'piece'}</Body></View>
            <View style={styles.viewButton}><Label style={styles.viewText}>View</Label><AppIcon name="arrow-forward" size={15} color={colors.teal} /></View>
          </View>
          {available > 0 ? <Body style={styles.available}>{available} {unitLabel(product.sale_unit, available)} available</Body> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow },
  pressed: { opacity: 0.9, transform: [{ translateY: -3 }, { scale: 0.992 }] },
  media: { aspectRatio: 4 / 3, backgroundColor: '#DCEFE9' },
  image: { width: '100%', height: '100%' }, fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badges: { position: 'absolute', left: 9, top: 9, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  featured: { borderRadius: radius.pill, backgroundColor: colors.amberSoft, paddingHorizontal: 8, paddingVertical: 4 }, featuredText: { color: colors.amber, fontSize: 10 },
  stock: { borderRadius: radius.pill, backgroundColor: colors.successSoft, paddingHorizontal: 8, paddingVertical: 4 }, stockText: { color: colors.success, fontSize: 10 }, sold: { backgroundColor: colors.dangerSoft }, soldText: { color: colors.danger },
  imageCount: { position: 'absolute', right: 9, bottom: 9, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, backgroundColor: 'rgba(11,31,28,0.72)', paddingHorizontal: 7, paddingVertical: 4 }, imageCountText: { color: '#fff', fontSize: 10 },
  content: { gap: 4, padding: 12 }, category: { color: colors.teal, fontSize: 11 }, name: { minHeight: 42, fontSize: 15, lineHeight: 20 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }, priceWrap: { minWidth: 0, flexDirection: 'row', alignItems: 'baseline', flexShrink: 1 }, price: { color: colors.teal, fontSize: 15 }, unit: { color: colors.muted, fontSize: 10, marginLeft: 3 },
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 9, backgroundColor: colors.tealSoft, paddingHorizontal: 9, paddingVertical: 6 }, viewText: { color: colors.teal, fontSize: 11 }, available: { fontSize: 10 },
});
