import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Page } from '@/components/shared/Page';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Body, Heading, Label, Money } from '@/components/shared/Typography';
import { CartIconButton } from '@/components/shop/CartIconButton';
import { ProductImageGallery } from '@/components/shop/ProductImageGallery';
import { QuantityStepper } from '@/components/shop/QuantityStepper';
import { Button, ErrorState, LoadingState } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useAddToCart } from '@/hooks/use-add-to-cart';
import { getShopProduct } from '@/services/martnow';
import { useFeedback } from '@/store/feedback-context';
import type { Product } from '@/types/api';
import { getErrorMessage } from '@/utils/error-message';
import { asNumber, formatPrice } from '@/utils/format';
import { firstRouteParam } from '@/utils/navigation';
import { formatQuantity, productStep, saleStock, unitLabel } from '@/utils/product-units';
import { findVariantStock, hasVariantOptions, variantLabel } from '@/utils/variant-stock';

export default function ShopProduct() {
  const params = useLocalSearchParams<{ slug: string; productId: string }>();
  const slug = firstRouteParam(params.slug);
  const productId = firstRouteParam(params.productId);
  const { tablet } = useResponsive();
  const { showToast, confirm } = useFeedback();
  const { addToShopCart, isAdding } = useAddToCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [shopName, setShopName] = useState('Store');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [optionError, setOptionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const load = useCallback(async () => {
    if (!slug || !productId) {
      setLoading(false);
      setError('Product link is invalid.');
      return;
    }
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await getShopProduct(slug, productId);
      if (currentRequest !== requestId.current) return;
      setProduct(result.product);
      setShopName(result.shop_name);
      setColor('');
      setSize('');
      setQuantity(productStep(result.product));
      setOptionError('');
    } catch (cause) {
      if (currentRequest === requestId.current) setError(getErrorMessage(cause));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [productId, slug]);
  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);
  const needsColor = Boolean(product?.colors?.length);
  const needsSize = Boolean(product?.sizes?.length);
  const optionReady = (!needsColor || Boolean(color)) && (!needsSize || Boolean(size));
  const availableBase = product
    ? optionReady
      ? findVariantStock(product, color, size)
      : Number(product.stock)
    : 0;
  const available = product ? saleStock(product, availableBase) : 0;
  const step = productStep(product);
  useEffect(() => {
    if (!product) return;
    setQuantity((current) => Math.max(step, Math.min(current, Math.max(step, available))));
  }, [available, product, step]);
  const outOfStock = product
    ? hasVariantOptions(product)
      ? optionReady
        ? available <= 0
        : Number(product.stock) <= 0
      : available <= 0
    : true;
  const sizeRows = useMemo(
    () =>
      product?.sizes?.map((item) => ({
        ...item,
        soldOut: Boolean(color || !needsColor) && findVariantStock(product, color, item.name) <= 0,
      })) ?? [],
    [color, needsColor, product],
  );
  const add = useCallback(async () => {
    if (!product || !slug || isAdding) return;
    if ((needsColor && !color) || (needsSize && !size)) {
      const message =
        needsColor && !color && needsSize && !size
          ? 'Choose a color and size'
          : needsColor && !color
            ? 'Choose a color'
            : 'Choose a size';
      setOptionError(message);
      showToast(message, 'error');
      return;
    }
    const outcome = await addToShopCart({
      slug,
      shopName,
      productId: product.id,
      productName: product.name,
      quantity,
      color,
      size,
      loginNext: `/product/${slug}/${product.id}`,
      announce: false,
    });
    if (outcome !== 'added') return;

    const viewCart = await confirm({
      title: 'Added to cart',
      message: `${product.name} is now in your cart. What would you like to do next?`,
      cancelLabel: 'Explore shop',
      confirmLabel: 'View cart',
      success: true,
    });
    if (viewCart) {
      router.push('/(tabs)/cart');
      return;
    }
    router.replace({ pathname: '/shop/[slug]', params: { slug } });
  }, [
    addToShopCart,
    color,
    confirm,
    isAdding,
    needsColor,
    needsSize,
    product,
    quantity,
    shopName,
    showToast,
    size,
    slug,
  ]);
  if (loading)
    return (
      <Page>
        <ScreenHeader title="Product" />
        <LoadingState label="Loading product…" />
      </Page>
    );
  if (error || !product)
    return (
      <Page>
        <ScreenHeader title="Product" />
        <ErrorState
          message={error || 'Product not found.'}
          onRetry={() => {
            void load();
          }}
        />
      </Page>
    );
  return (
    <Page>
      <ScreenHeader
        title={shopName}
        right={<CartIconButton onPress={() => router.push('/(tabs)/cart')} />}
      />
      <View style={[styles.layout, tablet && styles.layoutTablet]}>
        <View style={styles.galleryColumn}>
          <ProductImageGallery
            productName={product.name}
            primaryImage={product.image_path}
            images={product.images}
            category={product.category}
          />
        </View>
        <View style={styles.detailCard}>
          <View style={styles.titleBand}>
            <Heading style={styles.name}>{product.name}</Heading>
          </View>
          <View style={styles.detailBody}>
            <View style={styles.stats}>
              <View style={styles.priceBox}>
                <Body style={styles.statLabel}>Price</Body>
                <View style={styles.priceRow}>
                  <Money style={styles.price}>{formatPrice(product.price)}</Money>
                  <Body style={styles.priceUnit}>/ {product.sale_unit || 'piece'}</Body>
                </View>
              </View>
              <View style={[styles.stockBox, available <= 0 && styles.stockOut]}>
                <Body style={styles.statLabel}>Stock</Body>
                <Label style={styles.stockValue}>
                  {hasVariantOptions(product) && !optionReady
                    ? `Choose ${needsColor && needsSize ? 'color & size' : needsColor ? 'a color' : 'a size'}`
                    : available <= 0
                      ? 'Out of stock'
                      : `${formatQuantity(available)} ${unitLabel(product.sale_unit, available)} in stock`}
                </Label>
                {variantLabel(color, size) ? (
                  <Body style={styles.variant}>{variantLabel(color, size)}</Body>
                ) : null}
              </View>
            </View>
            {product.description ? (
              <View style={styles.descriptionBox}>
                <Body style={styles.statLabel}>Description</Body>
                <Body style={styles.description}>{product.description}</Body>
              </View>
            ) : null}
            {needsColor ? (
              <View style={[styles.optionBox, optionError && !color && styles.optionError]}>
                <Label style={styles.optionTitle}>Color{color ? ` · ${color}` : ''}</Label>
                <View style={styles.options}>
                  {product.colors?.map((item) => (
                    <Pressable
                      key={item.name}
                      onPress={() => {
                        setColor(item.name);
                        setOptionError('');
                      }}
                      style={({ pressed }) => [
                        styles.colorChip,
                        color === item.name && styles.optionSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={[styles.swatch, { backgroundColor: item.hex || '#D7E5E0' }]} />
                      <Label
                        style={[
                          styles.optionText,
                          color === item.name && styles.optionTextSelected,
                        ]}
                      >
                        {item.name}
                      </Label>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            {needsSize ? (
              <View
                style={[
                  styles.optionBox,
                  styles.sizeBox,
                  optionError && !size && styles.optionError,
                ]}
              >
                <Label style={styles.optionTitle}>Size{size ? ` · ${size}` : ''}</Label>
                <View style={styles.options}>
                  {sizeRows.map((item) => (
                    <Pressable
                      key={item.name}
                      disabled={item.soldOut}
                      onPress={() => {
                        setSize(item.name);
                        setOptionError('');
                      }}
                      style={({ pressed }) => [
                        styles.sizeChip,
                        size === item.name && styles.optionSelected,
                        item.soldOut && styles.disabled,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Label
                        style={[styles.optionText, size === item.name && styles.optionTextSelected]}
                      >
                        {item.name}
                      </Label>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            <View style={styles.purchase}>
              <QuantityStepper
                value={quantity}
                min={step}
                max={Math.max(step, available)}
                step={step}
                disabled={outOfStock || !optionReady}
                onChange={setQuantity}
              />
              <Button
                label={
                  isAdding
                    ? 'Adding…'
                    : !optionReady
                      ? 'Choose option'
                      : outOfStock
                        ? 'Out of stock'
                        : 'Add to cart'
                }
                onPress={() => {
                  void add();
                }}
                loading={isAdding}
                disabled={outOfStock}
                fullWidth={false}
              />
            </View>
            {!outOfStock && optionReady ? (
              <View style={styles.totalRow}>
                <Body>Total</Body>
                <Money style={styles.total}>
                  {formatPrice(asNumber(product.price) * quantity)}
                </Money>
              </View>
            ) : null}
            {optionError ? <Body style={styles.errorText}>{optionError}</Body> : null}
          </View>
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  layout: { gap: 15 },
  layoutTablet: { flexDirection: 'row', alignItems: 'flex-start' },
  galleryColumn: { minWidth: 0, flex: 1 },
  detailCard: {
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  titleBand: { paddingHorizontal: 16, paddingVertical: 13, backgroundColor: colors.tealDark },
  name: { color: '#fff', fontSize: 22, lineHeight: 27 },
  detailBody: { gap: 12, padding: 14 },
  stats: { flexDirection: 'row', gap: 8 },
  priceBox: {
    flex: 1,
    minHeight: 78,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: '#D7EFE9',
  },
  stockBox: {
    flex: 1,
    minHeight: 78,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: '#E7F4E4',
  },
  stockOut: { backgroundColor: colors.amberSoft },
  statLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.65,
  },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', marginTop: 4 },
  price: { color: colors.tealDark, fontSize: 20 },
  priceUnit: { marginLeft: 3, color: colors.teal, fontSize: 10 },
  stockValue: { marginTop: 5, fontSize: 12, lineHeight: 16 },
  variant: { marginTop: 2, color: colors.teal, fontSize: 10 },
  descriptionBox: { padding: 13, borderRadius: radius.md, backgroundColor: '#EEF6E4' },
  description: { marginTop: 5, fontSize: 13, lineHeight: 20 },
  optionBox: { padding: 11, borderRadius: radius.md, backgroundColor: colors.tealSoft },
  sizeBox: { backgroundColor: '#DCEFE9' },
  optionError: { borderWidth: 1, borderColor: colors.danger },
  optionTitle: { fontSize: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  colorChip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  sizeChip: {
    minWidth: 38,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 9,
  },
  optionSelected: { borderColor: colors.teal, backgroundColor: '#fff' },
  optionText: { color: colors.muted, fontSize: 11 },
  optionTextSelected: { color: colors.teal },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.65 },
  purchase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  total: { color: colors.teal, fontSize: 16 },
  errorText: { color: colors.danger, fontFamily: 'Outfit_500Medium', fontSize: 12 },
});
