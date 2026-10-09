import type { CustomerUser } from '@/types/api';

import { deleteStoredValue, getStoredValue, setStoredValue } from './storage';

const CUSTOMER_KEY = 'martnow.customer.user';

export async function getStoredCustomer(): Promise<CustomerUser | null> {
  const serialized = await getStoredValue(CUSTOMER_KEY);
  if (!serialized) return null;

  try {
    return JSON.parse(serialized) as CustomerUser;
  } catch {
    await deleteStoredValue(CUSTOMER_KEY);
    return null;
  }
}

export function storeCustomer(customer: CustomerUser): Promise<void> {
  if (!customer || typeof customer !== 'object') {
    throw new Error('Login did not return a customer profile.');
  }
  return setStoredValue(CUSTOMER_KEY, JSON.stringify(customer));
}

export function clearStoredCustomer(): Promise<void> {
  return deleteStoredValue(CUSTOMER_KEY);
}
