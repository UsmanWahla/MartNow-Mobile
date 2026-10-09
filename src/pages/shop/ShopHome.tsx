import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type IconName } from '@/components/shared/AppIcon';
import { Page } from '@/components/shared/Page';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { CartIconButton } from '@/components/shop/CartIconButton';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { assetUrl, getShopMeta, getShopProducts } from '@/services/martnow';
import type { Product, ShopMeta } from '@/types/api';
import { getErrorMessage } from '@/utils/error-message';
import { firstRouteParam } from '@/utils/navigation';

type Sort = 'featured' | 'newest' | 'price-low' | 'price-high';
const PRODUCT_RENDER_BATCH = 24;

const sorts: { value: Sort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
];

function StoreInfoRow({
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
        <AppIcon name={icon} size={19} color={colors.teal} />
      </View>
      <View style={styles.infoCopy}>
        <Label style={styles.infoLabel}>{label}</Label>
        <Body style={styles.infoValue}>{value}</Body>
      </View>
      {onPress ? <AppIcon name="chevron-forward" size={18} color={colors.muted} /> : null}
    </>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={styles.infoRow}>{content}</View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
    >
      <AppIcon name={icon} size={18} color={colors.tealDark} />
      <Body style={styles.quickActionText}>{label}</Body>
    </Pressable>
  );
}

function CategoryPill({
  label,
  selected,
  onPress,
  isMore = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  isMore?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryPill,
        selected && styles.categoryPillSelected,
        pressed && styles.pressed,
      ]}
    >
      <Body style={[styles.categoryPillText, selected && styles.categoryPillTextSelected]}>
        {label}
      </Body>
      {isMore ? (
        <AppIcon name="chevron-down" size={15} color={selected ? '#FFFFFF' : colors.teal} />
      ) : null}
    </Pressable>
  );
}

function OptionSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Heading style={styles.sheetTitle}>{title}</Heading>
            <Pressable
              accessibilityLabel="Close"
              hitSlop={10}
              onPress={onClose}
              style={styles.sheetClose}
            >
              <AppIcon name="close" size={20} color={colors.ink} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
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
  const [renderLimit, setRenderLimit] = useState(PRODUCT_RENDER_BATCH);
  const [storeInfoOpen, setStoreInfoOpen] = useState(false);
  const [catalogOptionsOpen, setCatalogOptionsOpen] = useState(false);
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

  const quickCategories = useMemo(() => {
    const initial = categories.slice(0, 4);
    if (category && !initial.some((value) => value.toLowerCase() === category.toLowerCase())) {
      return [...initial, category];
    }
    return initial;
  }, [categories, category]);

  useEffect(() => {
    setRenderLimit(PRODUCT_RENDER_BATCH);
  }, [category, query, sort]);

  const renderedProducts = visible.slice(0, renderLimit);

  const activeSortLabel = sorts.find((item) => item.value === sort)?.label ?? 'Featured';
  const hasCatalogFilter = Boolean(category) || sort !== 'featured';
  const openProduct = (product: Product) =>
    router.push({
      pathname: '/product/[slug]/[productId]',
      params: { slug: slug ?? '', productId: String(product.id) },
    });

  if (loading && !shop)
    return (
      <Page>
        <ScreenHeader title="Store" />
        <LoadingState label="Loading live catalogue..." />
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
  const deliveryLabel =
    shop.delivery_enabled !== false ? 'Store delivery available' : 'Platform delivery available';
  const locationLabel = directions ? 'Directions' : 'View address';
  const catalogTitle = query.trim() ? 'Search results' : category ? category : 'All products';

  const openDirections = () => {
    if (directions) {
      void Linking.openURL(directions);
      return;
    }
    setStoreInfoOpen(true);
  };

  return (
    <Page refreshing={loading} onRefresh={load}>
      <ScreenHeader
        title="Store"
        right={<CartIconButton onPress={() => router.push('/(tabs)/cart')} />}
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
              <Body numberOfLines={2} style={styles.description}>
                {shop.store_description}
              </Body>
            ) : null}
          </View>
        </View>

        {shop.address ? (
          <View style={styles.heroAddress}>
            <AppIcon name="location-outline" size={14} color="#D9F4EC" />
            <Body numberOfLines={1} style={styles.heroAddressText}>
              {shop.address}
            </Body>
          </View>
        ) : null}

        <View style={styles.storeStatus}>
          <View style={styles.statusItem}>
            <AppIcon name="bicycle-outline" size={15} color="#A7E9D8" />
            <Body style={styles.statusText}>{deliveryLabel}</Body>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <AppIcon name="cash-outline" size={15} color="#A7E9D8" />
            <Body style={styles.statusText}>Cash on delivery</Body>
          </View>
        </View>

        <View style={styles.quickActions}>
          <QuickAction icon="navigate-outline" label={locationLabel} onPress={openDirections} />
          <QuickAction
            icon="information-circle-outline"
            label="Store info"
            onPress={() => setStoreInfoOpen(true)}
          />
        </View>
      </View>

      <SearchBar value={query} onChangeText={setQuery} placeholder={`Search ${shop.shop_name}`} />

      <View style={styles.catalogToolbar}>
        <View style={styles.catalogCopy}>
          <Heading numberOfLines={1} style={styles.catalogTitle}>
            {catalogTitle}
          </Heading>
          <Body style={styles.catalogCount}>
            {visible.length} {visible.length === 1 ? 'item' : 'items'}
          </Body>
        </View>
        <Pressable
          accessibilityLabel="Open product filters"
          accessibilityRole="button"
          onPress={() => setCatalogOptionsOpen(true)}
          style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
        >
          <AppIcon name="options-outline" size={18} color={colors.teal} />
          <Body numberOfLines={1} style={styles.filterLabel}>
            {activeSortLabel}
          </Body>
          {hasCatalogFilter ? <View style={styles.filterIndicator} /> : null}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroller}
      >
        <CategoryPill label="All" selected={!category} onPress={() => setCategory('')} />
        {quickCategories.map((value) => (
          <CategoryPill
            key={value}
            label={value}
            selected={category.toLowerCase() === value.toLowerCase()}
            onPress={() => setCategory(value)}
          />
        ))}
        {categories.length > quickCategories.length ? (
          <CategoryPill
            label="More"
            isMore
            selected={Boolean(category) && !quickCategories.includes(category)}
            onPress={() => setCatalogOptionsOpen(true)}
          />
        ) : null}
      </ScrollView>

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

      {visible.length ? (
        <View style={styles.productsSection}>
          <ProductGrid products={renderedProducts} onOpen={openProduct} />
          {renderedProducts.length < visible.length ? (
            <View style={styles.loadMore}>
              <Body style={styles.loadMoreCount}>
                Showing {renderedProducts.length} of {visible.length} products
              </Body>
              <Button
                label={`Show next ${Math.min(PRODUCT_RENDER_BATCH, visible.length - renderedProducts.length)}`}
                variant="secondary"
                onPress={() => setRenderLimit((current) => current + PRODUCT_RENDER_BATCH)}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <OptionSheet
        visible={storeInfoOpen}
        title="Store information"
        onClose={() => setStoreInfoOpen(false)}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.storeInfoList}
          showsVerticalScrollIndicator={false}
          style={styles.storeInfoScroll}
        >
          <StoreInfoRow icon="cash-outline" label="Payment" value="Cash on delivery" />
          <StoreInfoRow icon="bicycle-outline" label="Delivery" value={deliveryLabel} />
          <StoreInfoRow
            icon="time-outline"
            label="Business hours"
            value={shop.business_hours || 'Contact the store for opening hours'}
          />
          <StoreInfoRow
            icon="location-outline"
            label="Store address"
            value={shop.address || 'Address is not available'}
            onPress={directions ? openDirections : undefined}
          />
          {shop.delivery_note ? (
            <StoreInfoRow
              icon="information-circle-outline"
              label="Delivery note"
              value={shop.delivery_note}
            />
          ) : null}
        </ScrollView>
      </OptionSheet>

      <OptionSheet
        visible={catalogOptionsOpen}
        title="Filter products"
        onClose={() => setCatalogOptionsOpen(false)}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.catalogSheetContent}
          showsVerticalScrollIndicator={false}
        >
          <Label style={styles.sheetSectionLabel}>SORT BY</Label>
          <View style={styles.optionGroup} accessibilityRole="radiogroup">
            {sorts.map((item) => {
              const selected = item.value === sort;
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setSort(item.value)}
                  style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
                >
                  <Body style={styles.optionText}>{item.label}</Body>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {categories.length ? (
            <>
              <Label style={styles.sheetSectionLabel}>CATEGORY</Label>
              <View style={styles.optionGroup} accessibilityRole="radiogroup">
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !category }}
                  onPress={() => setCategory('')}
                  style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
                >
                  <Body style={styles.optionText}>All products</Body>
                  <View style={[styles.radio, !category && styles.radioSelected]}>
                    {!category ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
                {categories.map((value) => {
                  const selected = category.toLowerCase() === value.toLowerCase();
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setCategory(value)}
                      style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
                    >
                      <Body style={styles.optionText}>{value}</Body>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </ScrollView>
        <View style={styles.sheetFooter}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCategory('');
              setSort('featured');
            }}
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
          >
            <Body style={styles.clearButtonText}>Clear</Body>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setCatalogOptionsOpen(false)}
            style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}
          >
            <Body style={styles.applyButtonText}>Show {visible.length} products</Body>
          </Pressable>
        </View>
      </OptionSheet>
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: 'relative',
    overflow: 'hidden',
    gap: 11,
    padding: 19,
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
    width: 60,
    height: 60,
    flexShrink: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  logoImage: { width: '100%', height: '100%' },
  logoLetter: { color: colors.teal, fontSize: 26 },
  heroCopy: { minWidth: 0, flex: 1 },
  shopName: { color: '#FFFFFF', fontSize: 24, lineHeight: 28 },
  description: { marginTop: 3, color: '#C8E8E1', fontSize: 13, lineHeight: 18 },
  heroAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  heroAddressText: { flex: 1, color: '#D9F4EC', fontSize: 11 },
  storeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusText: { color: '#D9F4EC', fontFamily: 'Outfit_600SemiBold', fontSize: 11 },
  statusDivider: { width: 1, height: 13, backgroundColor: 'rgba(217,244,236,0.35)' },
  quickActions: { flexDirection: 'row', gap: 9, marginTop: 2 },
  quickAction: {
    minHeight: 43,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  quickActionPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  quickActionText: { color: colors.tealDark, fontFamily: 'Outfit_700Bold', fontSize: 13 },
  catalogToolbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catalogCopy: { minWidth: 0, flex: 1 },
  catalogTitle: { fontSize: 20 },
  catalogCount: { marginTop: 2, fontSize: 12 },
  filterButton: {
    minWidth: 112,
    minHeight: 42,
    maxWidth: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 11,
  },
  filterLabel: {
    minWidth: 0,
    flex: 1,
    color: colors.teal,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  filterIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.teal,
  },
  categoryScroller: { gap: 8, paddingRight: 6 },
  categoryPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
  },
  categoryPillSelected: { borderColor: colors.teal, backgroundColor: colors.teal },
  categoryPillText: { color: colors.teal, fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  categoryPillTextSelected: { color: '#FFFFFF' },
  productsSection: { gap: 10 },
  loadMore: { alignItems: 'center', gap: 8, paddingTop: 4 },
  loadMoreCount: { fontSize: 11 },
  pressed: { opacity: 0.68 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(7, 27, 23, 0.5)',
  },
  sheet: {
    maxHeight: '82%',
    overflow: 'hidden',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.page,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  sheetHeader: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sheetTitle: { fontSize: 20 },
  sheetClose: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.tealSoft,
  },
  storeInfoScroll: { flexShrink: 1 },
  storeInfoList: { gap: 7, paddingHorizontal: 20, paddingBottom: 4 },
  infoRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  infoIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.tealSoft,
  },
  infoCopy: { minWidth: 0, flex: 1 },
  infoLabel: {
    color: colors.muted,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.65,
    textTransform: 'uppercase',
  },
  infoValue: { marginTop: 2, color: colors.ink, fontSize: 13, lineHeight: 18 },
  catalogSheetContent: { paddingHorizontal: 20, paddingBottom: 14, gap: 13 },
  sheetSectionLabel: {
    marginTop: 4,
    color: colors.muted,
    fontFamily: 'Outfit_700Bold',
    fontSize: 11,
    letterSpacing: 0.9,
  },
  optionGroup: {
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionRow: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 14,
  },
  optionText: { flex: 1, color: colors.ink, fontFamily: 'Outfit_500Medium', fontSize: 14 },
  radio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  radioSelected: { borderColor: colors.teal },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.teal },
  sheetFooter: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 13,
  },
  clearButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
  },
  clearButtonText: { color: colors.teal, fontFamily: 'Outfit_700Bold' },
  applyButton: {
    minHeight: 48,
    minWidth: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.teal,
    paddingHorizontal: 14,
  },
  applyButtonText: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 14 },
});
