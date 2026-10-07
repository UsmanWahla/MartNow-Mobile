import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { OrderCard } from '@/components/customer/OrderCard';
import { AppIcon, type IconName } from '@/components/shared/AppIcon';
import { Page } from '@/components/shared/Page';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { Button, EmptyState, ErrorState, Field, LoadingState } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { getCustomerProfile, getOrders, updateCustomerProfile } from '@/services/martnow';
import { useAuth } from '@/store/auth-context';
import { useFeedback } from '@/store/feedback-context';
import type { CustomerProfile, ShopOrder } from '@/types/api';
import { getErrorMessage } from '@/utils/error-message';

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M';
}

function AccountLink({ icon, label, detail, onPress }: { icon: IconName; label: string; detail: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
    <View style={styles.linkIcon}><AppIcon name={icon} size={21} color={colors.teal} /></View>
    <View style={styles.linkCopy}><Label style={styles.linkLabel}>{label}</Label><Body style={styles.linkDetail}>{detail}</Body></View>
    <AppIcon name="chevron-forward" size={18} color={colors.teal} />
  </Pressable>;
}

export default function CustomerAccount() {
  const { customer, isAuthenticated, isReady, signOut, updateCustomer } = useAuth();
  const { confirm, showToast } = useFeedback();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [nextProfile, orderResponse] = await Promise.all([getCustomerProfile(), getOrders({ page: 1, limit: 3 })]);
      setProfile(nextProfile); setOrders(orderResponse.rows);
    } catch (cause) { setError(getErrorMessage(cause)); }
    finally { setLoading(false); }
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => { if (isReady) void load(); }, [isReady, load]));

  const save = async () => {
    if (!profile || !customer) return;
    const name = profile.name.trim(); const phone = profile.phone.trim();
    if (!name) { setFieldError('Enter your full name.'); return; }
    if (!phone) { setFieldError('A phone number is required for delivery.'); return; }
    setSaving(true); setFieldError('');
    try {
      const response = await updateCustomerProfile({ name, phone });
      setProfile(response.profile); await updateCustomer({ ...customer, ...response.user });
      showToast('Profile updated successfully.', 'success');
    } catch (cause) { showToast(getErrorMessage(cause), 'error'); }
    finally { setSaving(false); }
  };

  const logout = async () => {
    const accepted = await confirm({ title: 'Log out?', message: 'You will need to sign in again to manage your orders.', confirmLabel: 'Log out', destructive: true });
    if (!accepted) return;
    setSigningOut(true);
    try { await signOut(); router.replace('/'); } finally { setSigningOut(false); }
  };

  if (!isReady) return <Page><LoadingState label="Loading your account…" /></Page>;
  if (!isAuthenticated || !customer) return <Page compact>
    <View style={styles.heading}><Heading style={styles.title}>Your account</Heading><Body>Keep your profile, addresses and every store order in one place.</Body></View>
    <EmptyState title="Sign in to your account" message="Use one MartNow customer account across the marketplace." action={<View style={styles.guestActions}><Button label="Log in" onPress={() => router.push({ pathname: '/auth/login', params: { next: '/(tabs)/account' } })} /><Button label="Create account" variant="secondary" onPress={() => router.push({ pathname: '/auth/signup', params: { next: '/(tabs)/account' } })} /></View>} />
  </Page>;

  const visibleProfile = profile ?? { name: customer.name, email: customer.email, phone: customer.phone ?? '' };
  return <Page refreshing={loading} onRefresh={load}>
    <View style={styles.heading}><Heading style={styles.title}>Your account</Heading><Body>Your details work across every MartNow store.</Body></View>
    <View style={styles.identity}><View style={styles.avatar}><Label style={styles.avatarText}>{initials(visibleProfile.name)}</Label></View><View style={styles.identityCopy}><Heading numberOfLines={1} style={styles.identityName}>{visibleProfile.name}</Heading><Body numberOfLines={1} style={styles.identityEmail}>{visibleProfile.email}</Body></View><AppIcon name="shield-checkmark-outline" size={25} color="#9DDED0" /></View>
    {error ? <ErrorState message={error} onRetry={() => { void load(); }} /> : null}
    {loading && !profile ? <LoadingState label="Loading profile…" /> : <View style={styles.card}>
      <View><Heading style={styles.sectionTitle}>Profile</Heading><Body style={styles.sectionHint}>Used for checkout and delivery updates.</Body></View>
      <Field label="Full name" value={visibleProfile.name} error={fieldError} autoCapitalize="words" editable={!saving} onChangeText={(name) => { setProfile({ ...visibleProfile, name }); setFieldError(''); }} />
      <Field label="Email" value={visibleProfile.email} editable={false} />
      <Field label="Phone" value={visibleProfile.phone} error={fieldError} keyboardType="phone-pad" autoComplete="tel" editable={!saving} onChangeText={(phone) => { setProfile({ ...visibleProfile, phone }); setFieldError(''); }} />
      <Button label="Save profile" loading={saving} onPress={() => { void save(); }} />
    </View>}
    <View style={styles.section}><Heading style={styles.sectionTitle}>Account tools</Heading><View style={styles.links}><AccountLink icon="location-outline" label="Delivery addresses" detail="Saved addresses and exact map pins" onPress={() => router.push('/addresses')} /><AccountLink icon="lock-closed-outline" label="Password & security" detail="Change your account password" onPress={() => router.push('/security')} /><AccountLink icon="receipt-outline" label="All orders" detail="Track purchases from every store" onPress={() => router.push('/(tabs)/orders')} /></View></View>
    <View style={styles.section}><View style={styles.sectionHead}><View><Heading style={styles.sectionTitle}>Recent orders</Heading><Body style={styles.sectionHint}>Your latest marketplace purchases.</Body></View>{orders.length ? <Pressable onPress={() => router.push('/(tabs)/orders')}><Label style={styles.viewAll}>View all</Label></Pressable> : null}</View>{orders.length ? <View style={styles.orderList}>{orders.map((order, index) => <OrderCard key={order.id} order={order} index={index} onPress={() => router.push({ pathname: '/order/[orderId]', params: { orderId: String(order.id) } })} />)}</View> : <EmptyState title="No orders yet" message="Your orders from all MartNow stores will appear here." action={<Button label="Browse stores" onPress={() => router.push('/(tabs)/market')} />} />}</View>
    <Button label="Log out" variant="secondary" loading={signingOut} onPress={() => { void logout(); }} />
  </Page>;
}

const styles = StyleSheet.create({
  heading: { gap: 3 }, title: { fontSize: 29 }, guestActions: { gap: 9 },
  identity: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderRadius: radius.lg, backgroundColor: colors.tealDark },
  avatar: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.tealSoft }, avatarText: { color: colors.teal, fontSize: 18 },
  identityCopy: { minWidth: 0, flex: 1 }, identityName: { color: '#fff', fontSize: 18 }, identityEmail: { color: '#B8DAD2', fontSize: 12, marginTop: 2 },
  card: { gap: 14, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  section: { gap: 11 }, sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, sectionTitle: { fontSize: 19 }, sectionHint: { marginTop: 2, fontSize: 12 }, viewAll: { color: colors.teal, fontSize: 12 },
  links: { gap: 8 }, link: { minHeight: 73, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, linkIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.tealSoft }, linkCopy: { minWidth: 0, flex: 1 }, linkLabel: { fontSize: 14 }, linkDetail: { marginTop: 1, fontSize: 11 }, pressed: { opacity: 0.7, transform: [{ scale: 0.994 }] }, orderList: { gap: 9 },
});
