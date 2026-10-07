import { StyleSheet, View } from 'react-native';

import { AppIcon, type IconName } from '@/components/shared/AppIcon';
import { Body, Label } from '@/components/shared/Typography';
import { colors } from '@/constants/theme';
import type { ShopOrder } from '@/types/api';

const steps: { value: string; label: string; icon: IconName }[] = [
  { value: 'pending', label: 'Order placed', icon: 'receipt-outline' },
  { value: 'processing', label: 'Processing', icon: 'cube-outline' },
  { value: 'dispatched', label: 'On the way', icon: 'bicycle-outline' },
  { value: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline' },
];

export function OrderTimeline({ order }: { order: ShopOrder }) {
  if (order.delivery_status === 'cancelled') return <View style={styles.cancelled}><AppIcon name="close-circle-outline" size={22} color={colors.danger} /><View><Label style={styles.cancelTitle}>Order cancelled</Label><Body style={styles.cancelBody}>This order will not continue through delivery.</Body></View></View>;
  const current = Math.max(0, steps.findIndex((step) => step.value === order.delivery_status));
  return <View style={styles.root}>{steps.map((step, index) => { const complete = index <= current; return <View key={step.value} style={styles.step}><View style={styles.rail}>{index > 0 ? <View style={[styles.line, complete && styles.lineComplete]} /> : null}<View style={[styles.dot, complete && styles.dotComplete]}><AppIcon name={step.icon} size={16} color={complete ? '#fff' : colors.disabled} /></View></View><View style={styles.copy}><Label style={[styles.label, complete && styles.labelComplete]}>{step.label}</Label><Body style={styles.caption}>{complete ? 'Complete' : 'Waiting'}</Body></View></View>; })}</View>;
}

const styles = StyleSheet.create({ root: { flexDirection: 'row', justifyContent: 'space-between' }, step: { flex: 1, alignItems: 'center' }, rail: { width: '100%', alignItems: 'center' }, line: { position: 'absolute', left: '-50%', top: 17, width: '100%', height: 2, backgroundColor: colors.border }, lineComplete: { backgroundColor: colors.teal }, dot: { zIndex: 1, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF2F0', borderWidth: 2, borderColor: colors.border }, dotComplete: { backgroundColor: colors.teal, borderColor: colors.teal }, copy: { alignItems: 'center', marginTop: 6 }, label: { color: colors.muted, fontSize: 10, textAlign: 'center' }, labelComplete: { color: colors.ink }, caption: { fontSize: 9, marginTop: 1 }, cancelled: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: colors.dangerSoft, borderRadius: 14 }, cancelTitle: { color: colors.danger, fontSize: 14 }, cancelBody: { fontSize: 11, marginTop: 2 } });
