import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OrderCard } from '@/components/customer/OrderCard';
import { AppIcon } from '@/components/shared/AppIcon';
import { Page } from '@/components/shared/Page';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { Button, ChoiceChip, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { getOrders } from '@/services/martnow';
import { useAuth } from '@/store/auth-context';
import type { ShopOrder } from '@/types/api';
import { getErrorMessage } from '@/utils/error-message';
import { ORDER_FILTERS } from '@/utils/orders';

const PAGE_SIZE = 8;

export default function CustomerOrders() {
  const { isAuthenticated, isReady } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<(typeof ORDER_FILTERS)[number]>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await getOrders({
        page,
        limit: PAGE_SIZE,
        status: status === 'all' ? undefined : status,
      });
      if (currentRequest !== requestId.current) return;
      setOrders(result.rows);
      setTotal(result.total);
    } catch (cause) {
      if (currentRequest === requestId.current) setError(getErrorMessage(cause));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [isAuthenticated, page, status]);
  useFocusEffect(
    useCallback(() => {
      if (isReady) void load();
      return () => {
        requestId.current += 1;
      };
    }, [isReady, load]),
  );
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (!isReady)
    return (
      <Page>
        <LoadingState label="Loading orders…" />
      </Page>
    );
  if (!isAuthenticated)
    return (
      <Page compact>
        <View style={styles.heading}>
          <Heading style={styles.title}>My orders</Heading>
          <Body>Orders from every store, together in one place.</Body>
        </View>
        <EmptyState
          title="Sign in to see orders"
          message="Track all MartNow purchases from your account."
          action={
            <Button
              label="Log in"
              onPress={() =>
                router.push({ pathname: '/auth/login', params: { next: '/(tabs)/orders' } })
              }
            />
          }
        />
      </Page>
    );
  return (
    <Page refreshing={loading} onRefresh={load}>
      <View style={styles.heading}>
        <Heading style={styles.title}>My orders</Heading>
        <Body>Orders from every store, together in one place.</Body>
      </View>
      <View style={styles.filters}>
        {ORDER_FILTERS.map((value) => (
          <ChoiceChip
            key={value}
            label={value[0].toUpperCase() + value.slice(1)}
            selected={status === value}
            onPress={() => {
              setStatus(value);
              setPage(1);
            }}
          />
        ))}
      </View>
      {error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            void load();
          }}
        />
      ) : null}
      {loading && !orders.length ? <LoadingState label="Loading order history…" /> : null}
      {!loading && !orders.length ? (
        <EmptyState
          title="No orders found"
          message="Orders you place at any store will appear here."
          action={<Button label="Browse stores" onPress={() => router.push('/(tabs)/market')} />}
        />
      ) : (
        <View style={styles.list}>
          {orders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              index={index}
              onPress={() =>
                router.push({ pathname: '/order/[orderId]', params: { orderId: String(order.id) } })
              }
            />
          ))}
        </View>
      )}
      {pages > 1 ? (
        <View style={styles.pagination}>
          <Pressable
            disabled={page <= 1 || loading}
            onPress={() => setPage((value) => Math.max(1, value - 1))}
            style={({ pressed }) => [
              styles.pageButton,
              (page <= 1 || loading) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name="chevron-back" size={17} color={colors.teal} />
            <Label style={styles.pageButtonText}>Previous</Label>
          </Pressable>
          <Label style={styles.pageText}>
            Page {page} of {pages}
          </Label>
          <Pressable
            disabled={page >= pages || loading}
            onPress={() => setPage((value) => Math.min(pages, value + 1))}
            style={({ pressed }) => [
              styles.pageButton,
              (page >= pages || loading) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Label style={styles.pageButtonText}>Next</Label>
            <AppIcon name="chevron-forward" size={17} color={colors.teal} />
          </Pressable>
        </View>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 3 },
  title: { fontSize: 29 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  list: { gap: 10 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pageButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.md,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: 11,
  },
  pageButtonText: { color: colors.teal, fontSize: 11 },
  pageText: { color: colors.muted, fontSize: 11 },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.65 },
});
