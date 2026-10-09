import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { addToCart, getCart, removeCartItem } from '@/services/martnow';
import { useAuth } from '@/store/auth-context';
import { useFeedback } from '@/store/feedback-context';
import { useCartShop } from '@/store/shop-context';
import { cartItemCount, needsCartReplacement, otherStoreCartMessage } from '@/utils/cart';
import { getErrorMessage } from '@/utils/error-message';

export interface AddToCartInput {
  slug: string;
  shopName: string;
  productId: number;
  productName: string;
  quantity: number;
  color?: string;
  size?: string;
  loginNext: string;
  announce?: boolean;
}

let cartAddLock = false;

export function useAddToCart() {
  const { isAuthenticated } = useAuth();
  const { showToast, confirm } = useFeedback();
  const { cartShop, setCartShop, setCartCount } = useCartShop();
  const [isAdding, setIsAdding] = useState(false);

  const addToShopCart = useCallback(
    async (input: AddToCartInput) => {
      if (!input.slug || cartAddLock) return 'stopped' as const;
      if (!isAuthenticated) {
        router.push({ pathname: '/auth/login', params: { next: input.loginNext } });
        return 'stopped' as const;
      }

      cartAddLock = true;
      setIsAdding(true);
      try {
        if (cartShop && cartShop.slug !== input.slug) {
          const activeCart = await getCart(cartShop.slug);
          const activeCount = cartItemCount(activeCart.items);
          setCartCount(activeCount);

          if (needsCartReplacement(cartShop.slug, input.slug, activeCount)) {
            const storeName = activeCart.shop_name?.trim() || cartShop.name;
            const replace = await confirm({
              title: 'Add this product instead?',
              message: otherStoreCartMessage(storeName),
              highlight: storeName,
              confirmLabel: 'Yes',
              cancelLabel: 'No',
            });
            if (!replace) {
              router.push('/(tabs)/cart');
              return 'stopped' as const;
            }

            for (const item of activeCart.items) {
              await removeCartItem(cartShop.slug, item.id);
            }
            setCartCount(0);
          }
        }

        const cart = await addToCart(input.slug, {
          product_id: input.productId,
          quantity: input.quantity,
          color: input.color || '',
          size: input.size || '',
        });
        await setCartShop({ slug: input.slug, name: input.shopName });
        setCartCount(cartItemCount(cart.items));
        if (input.announce !== false) showToast(`${input.productName} added to cart.`, 'success');
        return 'added' as const;
      } catch (cause) {
        showToast(getErrorMessage(cause), 'error');
        return 'stopped' as const;
      } finally {
        cartAddLock = false;
        setIsAdding(false);
      }
    },
    [cartShop, confirm, isAuthenticated, setCartCount, setCartShop, showToast],
  );

  return { addToShopCart, isAdding };
}
