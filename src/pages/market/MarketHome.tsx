import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { StoreGrid } from '@/components/market/StoreGrid';
import { AppIcon } from '@/components/shared/AppIcon';
import { Page } from '@/components/shared/Page';
import { SearchBar } from '@/components/shared/SearchBar';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { getPublicStores } from '@/services/martnow';
import { useAuth } from '@/store/auth-context';
import type { PublicStore } from '@/types/api';
import { getErrorMessage } from '@/utils/error-message';
import { firstName } from '@/utils/format';

export default function MarketHome() {
  const { customer } = useAuth();
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setStores((await getPublicStores()).rows); } catch (cause) { setError(getErrorMessage(cause)); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const visible = stores;
  const openStore = (store: PublicStore) => router.push({ pathname: '/shop/[slug]', params: { slug: store.shop_slug } });

  return <Page refreshing={loading} onRefresh={load}>
    <View style={styles.hero}>
      <View style={styles.orbOne} /><View style={styles.orbTwo} />
      <View style={styles.heroTop}><View style={styles.mark}><AppIcon name="storefront" size={20} color="#fff" /></View><Label style={styles.brand}>MARTNOW MARKETPLACE</Label></View>
      <Heading style={styles.heroTitle}>{customer ? `Welcome, ${firstName(customer.name)}` : 'All stores, one marketplace'}</Heading>
      <Body style={styles.heroBody}>Pick a local store and shop its live catalogue with cash on delivery.</Body>
      <Pressable onPress={() => router.push('/(tabs)/market')} style={({ pressed }) => [styles.heroSearch, pressed && styles.pressed]}><AppIcon name="search" size={19} color={colors.teal} /><Label style={styles.heroSearchText}>Search marketplace stores</Label><AppIcon name="arrow-forward" size={18} color={colors.teal} /></Pressable>
    </View>

    <View style={styles.sectionHead}><View><Heading style={styles.sectionTitle}>Explore stores</Heading><Body style={styles.sectionBody}>{loading ? 'Loading marketplace…' : `${visible.length} active ${visible.length === 1 ? 'store' : 'stores'}`}</Body></View><Pressable onPress={() => router.push('/(tabs)/market')}><Label style={styles.seeAll}>Search all</Label></Pressable></View>
    {error ? <ErrorState message={error} onRetry={() => { void load(); }} /> : null}
    {loading && !stores.length ? <LoadingState label="Opening the marketplace…" /> : null}
    {!loading && !visible.length ? <EmptyState title="No stores yet" message="Active stores will appear here." /> : null}
    {visible.length ? <Animated.View entering={FadeIn.duration(280).reduceMotion(ReduceMotion.System)}><StoreGrid stores={visible} onOpen={openStore} /></Animated.View> : null}
  </Page>;
}

export function MarketSearch() {
  const [stores, setStores] = useState<PublicStore[]>([]); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setStores((await getPublicStores()).rows); } catch (cause) { setError(getErrorMessage(cause)); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => { const value = query.trim().toLowerCase(); return value ? stores.filter((store) => [store.name, store.store_type, store.address, store.shop_slug].some((field) => field.toLowerCase().includes(value))) : stores; }, [query, stores]);
  return <Page refreshing={loading} onRefresh={load}><View style={styles.searchHeading}><Heading style={styles.searchTitle}>Find your store</Heading><Body style={styles.searchBody}>Search by store name, type, address, or shop link.</Body></View><SearchBar value={query} onChangeText={setQuery} placeholder="Search marketplace stores" autoFocus={false} />{error ? <ErrorState message={error} onRetry={() => { void load(); }} /> : null}{loading && !stores.length ? <LoadingState label="Loading stores…" /> : null}{!loading && !visible.length ? <EmptyState title="No matching stores" message="Try another name, area, or store type." /> : null}{visible.length ? <StoreGrid stores={visible} onOpen={(store) => router.push({ pathname: '/shop/[slug]', params: { slug: store.shop_slug } })} /> : null}</Page>;
}

const styles = StyleSheet.create({ hero: { position: 'relative', overflow: 'hidden', minHeight: 238, justifyContent: 'flex-end', gap: 9, padding: 22, borderRadius: 26, backgroundColor: colors.tealDark }, orbOne: { position: 'absolute', width: 220, height: 220, right: -70, top: -110, borderRadius: 110, backgroundColor: 'rgba(45,212,191,0.18)' }, orbTwo: { position: 'absolute', width: 150, height: 150, left: -70, bottom: -85, borderRadius: 75, backgroundColor: 'rgba(15,118,110,0.38)' }, heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }, mark: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.teal }, brand: { color: '#9DE2D3', fontSize: 10, letterSpacing: 1.25 }, heroTitle: { maxWidth: 560, color: '#fff', fontFamily: 'Outfit_800ExtraBold', fontSize: 29, lineHeight: 34 }, heroBody: { maxWidth: 530, color: '#C4E3DC', fontSize: 14, lineHeight: 20 }, heroSearch: { minHeight: 50, maxWidth: 520, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 5, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: '#fff' }, heroSearchText: { flex: 1, color: colors.teal, fontSize: 13 }, pressed: { opacity: 0.75 }, sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }, sectionTitle: { fontSize: 21 }, sectionBody: { fontSize: 13, marginTop: 2 }, seeAll: { color: colors.teal, fontSize: 13 }, searchHeading: { gap: 4 }, searchTitle: { fontSize: 29 }, searchBody: { fontSize: 14, lineHeight: 20 } });
