import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { CustomerUser } from '@/types/api';

import { clearAccessToken, getAccessToken, saveAccessToken } from '@/services/auth-token';
import { setUnauthorizedHandler } from '@/services/api';
import { customerLogin, customerLogout, customerSignup } from '@/services/martnow';
import { clearStoredCustomer, getStoredCustomer, storeCustomer } from '@/services/session';

interface AuthContextValue {
  customer: CustomerUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  updateCustomer: (customer: CustomerUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getAccessToken(), getStoredCustomer()])
      .then(([token, storedCustomer]) => {
        if (mounted && token && storedCustomer) setCustomer(storedCustomer);
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearStoredCustomer();
      setCustomer(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const persistSession = useCallback(async (token: string, user: CustomerUser) => {
    await saveAccessToken(token);
    await storeCustomer(user);
    setCustomer(user);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await customerLogin({ email, password });
    await persistSession(response.token, response.user);
  }, [persistSession]);

  const signUp = useCallback(async (payload: { name: string; email: string; password: string; phone?: string }) => {
    const response = await customerSignup(payload);
    await persistSession(response.token, response.user);
  }, [persistSession]);

  const updateCustomer = useCallback(async (nextCustomer: CustomerUser) => {
    await storeCustomer(nextCustomer);
    setCustomer(nextCustomer);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await customerLogout();
    } catch {
      // Local sign-out still protects the device if the access token has already expired.
    }
    await Promise.all([clearAccessToken(), clearStoredCustomer()]);
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({
      customer,
      isReady,
      isAuthenticated: Boolean(customer),
      signIn,
      signUp,
      updateCustomer,
      signOut,
    }),
    [customer, isReady, signIn, signOut, signUp, updateCustomer],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
