import { apiConfig } from '@/constants/config';
import type {
  AuthResponse,
  BackendHealth,
  CustomerAddressesResponse,
  CustomerAddressInput,
  CustomerCheckoutProfile,
  CustomerOrdersResponse,
  CustomerProfile,
  ProfileUpdateResponse,
  PublicStoresResponse,
  ShopCart,
  ShopMeta,
  ShopOrder,
  ShopProductResponse,
  ShopProductsResponse,
  StoreLocationResult,
} from '@/types/api';

import { api } from './api';

export const BACKEND_HEALTH_ENDPOINT = '/';
export const PUBLIC_STORES_ENDPOINT = '/api/stores/public';

function encoded(value: string | number) {
  return encodeURIComponent(String(value));
}

function query(values: Record<string, string | number | boolean | undefined>) {
  const params = Object.entries(values).filter(([, value]) => value !== undefined && value !== '');
  return params.length
    ? `?${new URLSearchParams(params.map(([key, value]) => [key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value)])).toString()}`
    : '';
}

export function assetUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function checkBackendConnection() {
  return api.get<BackendHealth>(BACKEND_HEALTH_ENDPOINT, { requiresAuth: false });
}

export function getPublicStores() {
  return api.get<PublicStoresResponse>(PUBLIC_STORES_ENDPOINT, { requiresAuth: false });
}

export function getShopMeta(slug: string) {
  return api.get<ShopMeta>(`/api/shop/${encoded(slug)}`, { requiresAuth: false });
}

export function getShopProducts(slug: string, options: { all?: boolean; q?: string; page?: number; limit?: number } = {}) {
  return api.get<ShopProductsResponse>(
    `/api/shop/${encoded(slug)}/products${query({ all: options.all, q: options.q, page: options.page, limit: options.limit })}`,
    { requiresAuth: false },
  );
}

export function getShopProduct(slug: string, productId: string | number) {
  return api.get<ShopProductResponse>(`/api/shop/${encoded(slug)}/products/${encoded(productId)}`, {
    requiresAuth: false,
  });
}

export function customerLogin(payload: { email: string; password: string }) {
  return api.post<AuthResponse>('/api/customer/login', payload, { requiresAuth: false });
}

export function customerSignup(payload: { name: string; email: string; password: string; phone?: string }) {
  return api.post<AuthResponse>('/api/customer/signup', payload, { requiresAuth: false });
}

export function customerLogout() {
  return api.post<{ message?: string }>('/api/logout');
}

export function getCustomerProfile() {
  return api.get<CustomerProfile>('/api/customer/profile');
}

export function updateCustomerProfile(payload: { name: string; phone: string }) {
  return api.put<ProfileUpdateResponse>('/api/customer/profile', payload);
}

export function updateCustomerPassword(payload: { currentPassword: string; newPassword: string }) {
  return api.put<{ message: string }>('/api/customer/profile/password', payload);
}

export function getAddresses() {
  return api.get<CustomerAddressesResponse>('/api/customer/addresses');
}

export function createAddress(payload: CustomerAddressInput) {
  return api.post<{ message: string; address: CustomerAddressesResponse['rows'][number] }>('/api/customer/addresses', payload);
}

export function updateAddress(addressId: number, payload: CustomerAddressInput) {
  return api.put<{ message: string; address: CustomerAddressesResponse['rows'][number] }>(`/api/customer/addresses/${encoded(addressId)}`, payload);
}

export function deleteAddress(addressId: number) {
  return api.delete<{ message: string }>(`/api/customer/addresses/${encoded(addressId)}`);
}

export function setDefaultAddress(addressId: number) {
  return api.put<{ message: string; address: CustomerAddressesResponse['rows'][number] }>(`/api/customer/addresses/${encoded(addressId)}/default`, {});
}

export async function searchLocations(value: string) {
  const response = await api.get<{ rows: StoreLocationResult[] }>(
    `/api/locations/search${query({ q: value })}`,
  );
  return response.rows;
}

export async function reverseLocation(latitude: number, longitude: number) {
  const response = await api.get<{ location: StoreLocationResult }>(
    `/api/locations/reverse${query({ latitude, longitude })}`,
  );
  return response.location;
}

export function getCart(slug: string) {
  return api.get<ShopCart>(`/api/shop/${encoded(slug)}/cart`);
}

export function addToCart(slug: string, payload: { product_id: number; quantity: number; color?: string; size?: string }) {
  return api.post<ShopCart>(`/api/shop/${encoded(slug)}/cart`, payload);
}

export function updateCartItem(slug: string, itemId: number, quantity: number) {
  return api.put<ShopCart>(`/api/shop/${encoded(slug)}/cart/${encoded(itemId)}`, { quantity });
}

export function removeCartItem(slug: string, itemId: number) {
  return api.delete<ShopCart>(`/api/shop/${encoded(slug)}/cart/${encoded(itemId)}`);
}

export function getCheckoutProfile(slug: string) {
  return api.get<CustomerCheckoutProfile>(`/api/shop/${encoded(slug)}/checkout/profile`);
}

export interface CheckoutInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  payment_method: 'cod';
  delivery_by: 'store' | 'platform';
  address_id?: number | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  save_address?: boolean;
  address_label?: string;
}

export function checkout(slug: string, payload: CheckoutInput) {
  return api.post<ShopOrder>(`/api/shop/${encoded(slug)}/checkout`, payload);
}

export function getOrders(options: { status?: string; page?: number; limit?: number } = {}) {
  return api.get<CustomerOrdersResponse>(`/api/customer/orders${query(options)}`);
}

export function getOrder(orderId: string | number) {
  return api.get<ShopOrder>(`/api/customer/orders/${encoded(orderId)}`);
}
