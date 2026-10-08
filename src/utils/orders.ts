import type { ShopOrder } from '@/types/api';

export function formatOrderNumber(value?: number | string | null) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? String(parsed).padStart(3, '0') : '—';
}

export function orderStatusLabel(order: Pick<ShopOrder, 'delivery_status' | 'payment_status'>) {
  const delivery = String(order.delivery_status || '').toLowerCase();
  const payment = String(order.payment_status || '').toLowerCase();
  if (delivery === 'cancelled') return 'Cancelled';
  if (delivery === 'delivered' || payment === 'collected') return 'Paid';
  if (delivery === 'processing') return 'Processing';
  if (delivery === 'dispatched') return 'Dispatched';
  return 'Pending';
}

export const ORDER_FILTERS = [
  'all',
  'pending',
  'processing',
  'dispatched',
  'delivered',
  'cancelled',
] as const;
