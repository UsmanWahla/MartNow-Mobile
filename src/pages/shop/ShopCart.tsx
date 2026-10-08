import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Page } from '@/components/shared/Page';
import { Body, Heading, Money } from '@/components/shared/Typography';
import { CartLine } from '@/components/shop/CartLine';
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { getCart, removeCartItem, updateCartItem } from '@/services/martnow';
import { useAuth } from '@/store/auth-context';
import { useFeedback } from '@/store/feedback-context';
import { useCartShop } from '@/store/shop-context';
import type { ShopCart } from '@/types/api';
import { cartItemCount } from '@/utils/cart';
import { getErrorMessage } from '@/utils/error-message';
import { formatPrice } from '@/utils/format';

const emptyCart: ShopCart = { items: [], total: 0 };

export default function ShopCartPage() {
  const { isAuthenticated, isReady: authReady } = useAuth();
  const { cartShop, setCartCount, isReady: shopReady } = useCartShop();
  const { showToast, confirm } = useFeedback();
  const [cart, setCart] = useState<ShopCart>(emptyCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const requestId = useRef(0);
  const mutationInFlight = useRef(false);
  const load = useCallback(async () => {
    if (!isAuthenticated || !cartShop) {
      setCart(emptyCart);
      return;
    }
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await getCart(cartShop.slug);
      if (currentRequest !== requestId.current) return;
      setCart(result);
      setCartCount(cartItemCount(result.items));
    } catch (cause) {
      if (currentRequest === requestId.current) setError(getErrorMessage(cause));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [cartShop, isAuthenticated, setCartCount]);
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        requestId.current += 1;
        mutationInFlight.current = false;
        setBusyId(null);
      };
    }, [load]),
  );
  const update = async (itemId: number, quantity: number) => {
    if (!cartShop || mutationInFlight.current) return;
    mutationInFlight.current = true;
    const currentRequest = ++requestId.current;
    setBusyId(itemId);
    try {
      const result = await updateCartItem(cartShop.slug, itemId, quantity);
      if (currentRequest !== requestId.current) return;
      setCart(result);
      setCartCount(cartItemCount(result.items));
    } catch (cause) {
      if (currentRequest === requestId.current) showToast(getErrorMessage(cause), 'error');
    } finally {
      if (currentRequest === requestId.current) setBusyId(null);
      mutationInFlight.current = false;
    }
  };
  const remove = async (itemId: number, name: string) => {
    if (
      !cartShop ||
      mutationInFlight.current ||
      !(await confirm({
        title: 'Remove item?',
        message: `${name} will be removed from your cart.`,
        confirmLabel: 'Remove',
        destructive: true,
      }))
    )
      return;
    mutationInFlight.current = true;
    const currentRequest = ++requestId.current;
    setBusyId(itemId);
    try {
      const result = await removeCartItem(cartShop.slug, itemId);
      if (currentRequest !== requestId.current) return;
      setCart(result);
      setCartCount(cartItemCount(result.items));
      showToast('Item removed', 'success');
    } catch (cause) {
      if (currentRequest === requestId.current) showToast(getErrorMessage(cause), 'error');
    } finally {
      if (currentRequest === requestId.current) setBusyId(null);
      mutationInFlight.current = false;
    }
  };
  if (!authReady || !shopReady)
    return (
      <Page>
        <LoadingState label="Preparing cart…" />
      </Page>
    );
  if (!isAuthenticated)
    return (
      <Page compact>
        <View style={styles.heading}>
          <Heading style={styles.title}>Your cart</Heading>
          <Body>Sign in to keep your store cart and continue to checkout.</Body>
        </View>
        <EmptyState
          title="Sign in to shop"
          message="One MartNow customer account works across every store."
          action={
            <Button
              label="Log in"
              onPress={() =>
                router.push({ pathname: '/auth/login', params: { next: '/(tabs)/cart' } })
              }
            />
          }
        />
      </Page>
    );
  if (!cartShop)
    return (
      <Page compact>
        <View style={styles.heading}>
          <Heading style={styles.title}>Your cart</Heading>
          <Body>MartNow uses one active-store cart at a time.</Body>
        </View>
        <EmptyState
          title="Choose a store first"
          message="Open a store and add a product to begin."
          action={<Button label="Browse stores" onPress={() => router.push('/(tabs)/market')} />}
        />
      </Page>
    );
  if (loading && !cart.items.length)
    return (
      <Page>
        <LoadingState label="Loading cart…" />
      </Page>
    );
  return (
    <Page refreshing={loading} onRefresh={load} compact>
      <View style={styles.heading}>
        <Heading style={styles.title}>Your cart</Heading>
        <Body>{cart.shop_name || cartShop.name}</Body>
      </View>
      {error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            void load();
          }}
        />
      ) : null}
      {!loading && !cart.items.length ? (
        <EmptyState
          title="Your cart is empty"
          message="Browse this store’s live catalogue to add an item."
          action={
            <Button
              label="Back to store"
              onPress={() =>
                router.push({ pathname: '/shop/[slug]', params: { slug: cartShop.slug } })
              }
            />
          }
        />
      ) : null}
      {cart.items.length ? (
        <>
          <View style={styles.lines}>
            {cart.items.map((item) => (
              <CartLine
                key={item.id}
                item={item}
                busy={busyId !== null}
                onQuantity={(quantity) => {
                  void update(item.id, quantity);
                }}
                onRemove={() => {
                  void remove(item.id, item.name);
                }}
              />
            ))}
          </View>
          <View style={styles.summary}>
            <View>
              <Body style={styles.totalLabel}>Cart total</Body>
              <Money style={styles.total}>{formatPrice(cart.total)}</Money>
            </View>
            <Body style={styles.summaryNote}>Delivery is calculated at checkout.</Body>
          </View>
          <Button
            label="Continue to checkout"
            loading={busyId !== null}
            onPress={() =>
              router.push({ pathname: '/checkout/[slug]', params: { slug: cartShop.slug } })
            }
          />
        </>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 3 },
  title: { fontSize: 29 },
  lines: { gap: 10 },
  summary: { gap: 5, padding: 18, borderRadius: radius.lg, backgroundColor: colors.tealDark },
  totalLabel: { color: '#B8DAD2', fontSize: 11 },
  total: { color: '#fff', fontSize: 27 },
  summaryNote: { color: '#B8DAD2', fontSize: 11 },
});
