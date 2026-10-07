import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { AddressCard } from '@/components/customer/AddressCard';
import { AppIcon } from '@/components/shared/AppIcon';
import { Page } from '@/components/shared/Page';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Body, Heading } from '@/components/shared/Typography';
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { colors } from '@/constants/theme';
import { deleteAddress, getAddresses, setDefaultAddress } from '@/services/martnow';
import { useAuth } from '@/store/auth-context';
import { useFeedback } from '@/store/feedback-context';
import type { CustomerAddress } from '@/types/api';
import { getErrorMessage } from '@/utils/error-message';

export default function CustomerAddresses() {
  const { isAuthenticated, isReady } = useAuth(); const { showToast, confirm } = useFeedback(); const [addresses, setAddresses] = useState<CustomerAddress[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { if (!isAuthenticated) { setLoading(false); return; } setLoading(true); setError(''); try { setAddresses((await getAddresses()).rows); } catch (cause) { setError(getErrorMessage(cause)); } finally { setLoading(false); } }, [isAuthenticated]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const makeDefault = async (address: CustomerAddress) => { try { await setDefaultAddress(address.id); showToast('Default address updated', 'success'); await load(); } catch (cause) { showToast(getErrorMessage(cause), 'error'); } };
  const remove = async (address: CustomerAddress) => { if (!await confirm({ title: 'Delete saved address?', message: `“${address.label}” will be removed. Existing orders keep their delivery details.`, confirmLabel: 'Delete', destructive: true })) return; try { await deleteAddress(address.id); showToast('Address deleted', 'success'); await load(); } catch (cause) { showToast(getErrorMessage(cause), 'error'); } };
  if (!isReady) return <Page><LoadingState label="Loading account…" /></Page>;
  if (!isAuthenticated) return <Page compact><ScreenHeader title="Addresses" /><EmptyState title="Sign in to manage addresses" message="Saved delivery addresses belong to your customer account." action={<Button label="Log in" onPress={() => router.push({ pathname: '/auth/login', params: { next: '/addresses' } })} />} /></Page>;
  if (loading && !addresses.length) return <Page><ScreenHeader title="Addresses" /><LoadingState label="Loading addresses…" /></Page>;
  return <Page refreshing={loading} onRefresh={load}><ScreenHeader title="Saved addresses" right={<Button label="Add" fullWidth={false} onPress={() => router.push('/addresses/form')} />} /><View style={styles.heading}><Heading style={styles.title}>Delivery address book</Heading><Body>Choose a saved address quickly at checkout.</Body></View>{error ? <ErrorState message={error} onRetry={() => { void load(); }} /> : null}{!loading && !addresses.length ? <EmptyState title="No saved address yet" message="Add an address manually, search it, or select your current location." action={<Button label="Add your first address" onPress={() => router.push('/addresses/form')} />} /> : <View style={styles.grid}>{addresses.map((address) => <View key={address.id} style={styles.item}><AddressCard address={address} onDefault={() => { void makeDefault(address); }} onEdit={() => router.push({ pathname: '/addresses/form', params: { id: String(address.id) } })} onDelete={() => { void remove(address); }} /></View>)}</View>}<View style={styles.tip}><AppIcon name="shield-checkmark-outline" size={19} color={colors.teal} /><Body style={styles.tipText}>Addresses are stored only on your MartNow customer account and used for delivery.</Body></View></Page>;
}

const styles = StyleSheet.create({ heading: { gap: 3 }, title: { fontSize: 24 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, item: { minWidth: 280, flexGrow: 1, flexBasis: '47%' }, tip: { flexDirection: 'row', alignItems: 'center', gap: 8 }, tipText: { flex: 1, fontSize: 11 } });
