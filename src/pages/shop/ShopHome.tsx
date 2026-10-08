import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, type IconName } from '@/components/shared/AppIcon';
import { Page } from '@/components/shared/Page';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ChoiceChip, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { assetUrl, getShopMeta, getShopProducts } from '@/services/martnow';
import type { Product, ShopMeta } from '@/types/api';
import { getErrorMessage } from '@/utils/error-message';
import { firstRouteParam } from '@/utils/navigation';

type Sort = 'featured' | 'newest' | 'price-low' | 'price-high';
const sorts: { value: Sort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price ↑' },
  { value: 'price-high', label: 'Price ↓' },
];

function InfoCell({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.infoIcon}>
        <AppIcon name={icon} size={18} color={colors.teal} />
      </View>
      <View style={styles.infoCopy}>
        <Body style={styles.infoLabel}>{label}</Body>
        <Label numberOfLines={2} style={styles.infoValue}>
          {value}
        </Label>
      </View>
      {onPress ? <AppIcon name="open-outline" size={15} color={colors.teal} /> : null}
    </>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.infoCell, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={styles.infoCell}>{content}</View>
  );
}

export default function ShopHome() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = firstRouteParam(params.slug);
  const [shop, setShop] = useState<ShopMeta | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<Sort>('featured');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const load = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      setError('Store link is invalid.');
      return;
    }
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const [meta, catalogue] = await Promise.all([
        getShopMeta(slug),
        getShopProducts(slug, { all: true }),
      ]);
      if (currentRequest !== requestId.current) return;
      setShop(meta);
      setProducts(catalogue.rows);
    } catch (cause) {
      if (currentRequest === requestId.current) setError(getErrorMessage(cause));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [slug]);
  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);
  const categories = useMemo(
    () =>
      [
        ...new Map(
          products
            .map((product) => product.category?.trim())
            .filter((value): value is string => Boolean(value))
            .map((value) => [value.toLowerCase(), value]),
        ).values(),
      ].sort((a, b) => a.localeCompare(b)),
    [products],
  );
  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    const rows = products.filter((product) => {
      const matchesSearch =
        !search ||
        [
          product.name,
          product.description,
          ...(product.colors?.map((item) => item.name) ?? []),
          ...(product.sizes?.map((item) => item.name) ?? []),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      const matchesCategory =
        !category || product.category?.toLowerCase() === category.toLowerCase();
      return matchesSearch && matchesCategory;
    });
    return [...rows].sort((left, right) =>
      sort === 'price-low'
        ? Number(left.price) - Number(right.price)
        : sort === 'price-high'
          ? Number(right.price) - Number(left.price)
          : sort === 'newest'
            ? right.id - left.id
            : Number(Boolean(right.featured)) - Number(Boolean(left.featured)) ||
              right.id - left.id,
    );
  }, [category, products, query, sort]);
  const featured = visible.filter((product) => Boolean(product.featured)).slice(0, 5);
  const openProduct = (product: Product) =>
    router.push({
      pathname: '/product/[slug]/[productId]',
      params: { slug: slug ?? '', productId: String(product.id) },
    });
  if (loading && !shop)
    return (
      <Page>
        <ScreenHeader title="Store" />
        <LoadingState label="Loading live catalogue…" />
      </Page>
    );
  if (error || !shop)
    return (
      <Page>
        <ScreenHeader title="Store" />
        <ErrorState
          message={error || 'Store is unavailable.'}
          onRetry={() => {
            void load();
          }}
        />
      </Page>
    );
  const logo = assetUrl(shop.logo_path);
  const directions =
    shop.latitude != null && shop.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`
      : '';
  return (
    <Page refreshing={loading} onRefresh={load}>
      <ScreenHeader
        title={shop.shop_name}
        right={
          <Pressable
            accessibilityLabel="Open cart"
            onPress={() => router.push('/(tabs)/cart')}
            style={styles.headerCart}
          >
            <AppIcon name="bag-handle-outline" size={20} color={colors.teal} />
          </Pressable>
        }
      />
      <View style={styles.hero}>
        <View style={styles.heroOrb} />
        <Body style={styles.heroEyebrow}>{shop.store_type || 'Online shop'}</Body>
        <View style={styles.heroMain}>
          <View style={styles.logo}>
            {logo ? (
              <Image source={logo} style={styles.logoImage} contentFit="contain" transition={160} />
            ) : (
              <Heading style={styles.logoLetter}>{shop.shop_name.slice(0, 1)}</Heading>
            )}
          </View>
          <View style={styles.heroCopy}>
            <Heading numberOfLines={2} style={styles.shopName}>
              {shop.shop_name}
            </Heading>
            {shop.store_description ? (
              <Body numberOfLines={3} style={styles.description}>
                {shop.store_description}
              </Body>
            ) : null}
          </View>
        </View>
        <View style={styles.heroTags}>
          {shop.address ? (
            <View style={styles.heroTag}>
              <AppIcon name="location-outline" size={13} color="#D9F4EC" />
              <Body numberOfLines={2} style={styles.heroTagText}>
                {shop.address}
              </Body>
            </View>
          ) : null}
          {shop.delivery_note ? (
            <View style={styles.heroTag}>
              <AppIcon name="information-circle-outline" size={13} color="#D9F4EC" />
              <Body style={styles.heroTagText}>{shop.delivery_note}</Body>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.infoGrid}>
        <InfoCell icon="cash-outline" label="Payment" value="Cash on delivery" />
        <InfoCell
          icon="bicycle-outline"
          label="Delivery"
          value={shop.delivery_enabled !== false ? 'Store delivery available' : 'Platform delivery'}
        />
        <InfoCell
          icon="time-outline"
          label="Business hours"
          value={shop.business_hours || 'Contact store for hours'}
        />
        <InfoCell
          icon="navigate-outline"
          label="Visit store"
          value={directions ? 'Get directions' : shop.address || 'Contact store'}
          onPress={
            directions
              ? () => {
                  void Linking.openURL(directions);
                }
              : undefined
          }
        />
      </View>
      <SearchBar value={query} onChangeText={setQuery} placeholder={`Search ${shop.shop_name}`} />
      <View style={styles.catalogHead}>
        <View>
          <Heading style={styles.catalogTitle}>
            {query.trim() ? `Results for “${query.trim()}”` : 'Products'}
          </Heading>
          <Body style={styles.catalogCount}>
            {visible.length} {visible.length === 1 ? 'item' : 'items'}
          </Body>
        </View>
      </View>
      <View style={styles.chips}>
        <ChoiceChip label="All products" selected={!category} onPress={() => setCategory('')} />
        {categories.map((value) => (
          <ChoiceChip
            key={value}
            label={value}
            selected={category.toLowerCase() === value.toLowerCase()}
            onPress={() => setCategory(value)}
          />
        ))}
      </View>
      <View style={styles.chips}>
        {sorts.map((item) => (
          <ChoiceChip
            key={item.value}
            label={item.label}
            selected={sort === item.value}
            onPress={() => setSort(item.value)}
          />
        ))}
      </View>
      {!loading && !visible.length ? (
        <EmptyState
          title={query || category ? 'No matching products' : 'No products yet'}
          message={
            query || category
              ? 'Try a different search or category.'
              : 'This shop has not listed any items.'
          }
        />
      ) : null}
      {featured.length ? (
        <View style={styles.section}>
          <View>
            <Heading style={styles.sectionTitle}>Featured picks</Heading>
            <Body style={styles.catalogCount}>Handpicked by {shop.shop_name}</Body>
          </View>
          <ProductGrid products={featured} onOpen={openProduct} />
        </View>
      ) : null}
      {visible.length ? (
        <View style={styles.section}>
          <Heading style={styles.sectionTitle}>All products</Heading>
          <ProductGrid products={visible} onOpen={openProduct} />
        </View>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  headerCart: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.tealSoft,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
    padding: 20,
    borderRadius: 26,
    backgroundColor: colors.tealDark,
  },
  heroOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -90,
    top: -110,
    backgroundColor: 'rgba(45,212,191,0.17)',
  },
  heroEyebrow: {
    color: '#91DACA',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.25,
    textTransform: 'uppercase',
  },
  heroMain: { flexDirection: 'row', gap: 13, alignItems: 'center' },
  logo: {
    width: 62,
    height: 62,
    flexShrink: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#fff',
  },
  logoImage: { width: '100%', height: '100%' },
  logoLetter: { color: colors.teal, fontSize: 26 },
  heroCopy: { minWidth: 0, flex: 1 },
  shopName: { color: '#fff', fontSize: 25, lineHeight: 29 },
  description: { marginTop: 3, color: '#C8E8E1', fontSize: 13, lineHeight: 18 },
  heroTags: { gap: 6 },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  heroTagText: { flexShrink: 1, color: '#D9F4EC', fontSize: 10, lineHeight: 14 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  infoCell: {
    minWidth: 155,
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  infoIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.tealSoft,
  },
  infoCopy: { minWidth: 0, flex: 1 },
  infoLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6 },
  infoValue: { marginTop: 2, fontSize: 12 },
  pressed: { opacity: 0.68 },
  catalogHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  catalogTitle: { fontSize: 20 },
  catalogCount: { marginTop: 2, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  section: { gap: 11 },
  sectionTitle: { fontSize: 19 },
});
