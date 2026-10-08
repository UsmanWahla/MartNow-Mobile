import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getCart } from '@/services/martnow';
import { deleteStoredValue, getStoredValue, setStoredValue } from '@/services/storage';
import { useAuth } from '@/store/auth-context';
import { cartItemCount } from '@/utils/cart';

export interface CartShop {
  slug: string;
  name: string;
}

interface ShopContextValue {
  cartShop: CartShop | null;
  cartCount: number;
  isReady: boolean;
  setCartShop: (shop: CartShop) => Promise<void>;
  setCartCount: (count: number) => void;
  refreshCart: () => Promise<void>;
  clearCart: () => Promise<void>;
}

const SHOP_KEY = 'martnow.cart.shop';
const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady: authReady } = useAuth();
  const [cartShop, setCartShopState] = useState<CartShop | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getStoredValue(SHOP_KEY)
      .then((value) => {
        if (!value) return;
        try {
          setCartShopState(JSON.parse(value) as CartShop);
        } catch {
          void deleteStoredValue(SHOP_KEY);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const setCartShop = useCallback(async (shop: CartShop) => {
    await setStoredValue(SHOP_KEY, JSON.stringify(shop));
    setCartShopState(shop);
  }, []);

  const clearCart = useCallback(async () => {
    await deleteStoredValue(SHOP_KEY);
    setCartShopState(null);
    setCartCount(0);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !cartShop) {
      setCartCount(0);
      return;
    }
    try {
      const cart = await getCart(cartShop.slug);
      setCartCount(cartItemCount(cart.items));
    } catch {
      // Keep the last known badge during a temporary network failure. Authentication
      // changes and an explicit cart clear still reset it to zero.
    }
  }, [cartShop, isAuthenticated]);

  useEffect(() => {
    if (!isReady || !authReady) return;
    if (!isAuthenticated) {
      void clearCart();
      return;
    }
    void refreshCart();
  }, [authReady, clearCart, isAuthenticated, isReady, refreshCart]);

  const value = useMemo(
    () => ({ cartShop, cartCount, isReady, setCartShop, setCartCount, refreshCart, clearCart }),
    [cartCount, cartShop, clearCart, isReady, refreshCart, setCartShop],
  );
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useCartShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useCartShop must be used inside ShopProvider.');
  return context;
}
