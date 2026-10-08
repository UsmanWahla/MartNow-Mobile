export interface PublicStore {
  id: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  logo_path: string | null;
  store_description?: string;
  business_hours?: string;
  delivery_note?: string;
  delivery_enabled: boolean;
  store_type_id: number;
  store_type: string;
  shop_slug: string;
}

export interface PublicStoresResponse {
  rows: PublicStore[];
}

export interface ShopMeta {
  shop_name: string;
  shop_slug: string;
  address?: string;
  logo_path?: string | null;
  store_type_id?: number | null;
  store_type?: string;
  store_description?: string;
  business_hours?: string;
  delivery_note?: string;
  delivery_enabled?: boolean;
  platform_delivery_fee?: number | string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ProductImage {
  id: number;
  path: string;
}

export interface ProductColor {
  id?: number;
  product_id?: number;
  name: string;
  hex: string;
}

export interface ProductSize {
  id?: number;
  product_id?: number;
  name: string;
}

export interface ProductVariant {
  color: string;
  size: string;
  stock: number | string;
}

export interface Product {
  id: number;
  name: string;
  sku?: string | null;
  price: number | string;
  stock: number | string;
  image_path?: string | null;
  description?: string | null;
  category?: string | null;
  featured?: boolean | number;
  images?: ProductImage[];
  colors?: ProductColor[];
  sizes?: ProductSize[];
  variants?: ProductVariant[];
  inventory_type?: 'unit' | 'weight' | 'volume' | 'length' | 'pack';
  base_unit?: string;
  sale_unit?: string;
  quantity_step?: number | string;
  units_per_sale_unit?: number | string;
}

export interface ShopProductsResponse {
  shop_name: string;
  shop_slug: string;
  rows: Product[];
  total: number;
}

export interface ShopProductResponse {
  shop_name: string;
  shop_slug: string;
  product: Product;
}

export interface CustomerUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  avatar_path?: string | null;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: CustomerUser;
}

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
}

export interface ProfileUpdateResponse {
  message: string;
  profile: CustomerProfile;
  user: CustomerUser;
}

export interface CustomerAddress {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerAddressInput {
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_default?: boolean;
}

export interface CustomerAddressesResponse {
  rows: CustomerAddress[];
}

export interface StoreLocationResult {
  address: string;
  latitude: number;
  longitude: number;
}

export interface ShopCartItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number | string;
  stock: number;
  base_stock?: number;
  inventory_type?: Product['inventory_type'];
  base_unit?: string;
  sale_unit?: string;
  quantity_step?: number;
  units_per_sale_unit?: number;
  image_path?: string | null;
  color?: string;
  size?: string;
  line_total: number | string;
}

export interface ShopCart {
  items: ShopCartItem[];
  total: number | string;
  shop_name?: string;
}

export interface CustomerCheckoutProfile extends CustomerProfile {
  address: string;
  city: string;
  address_id: number | null;
  latitude: number | null;
  longitude: number | null;
  addresses: CustomerAddress[];
}

export type DeliveryStatus = 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';

export interface ShopOrderItem {
  product_id: number;
  product: string;
  quantity: number;
  sale_unit?: string;
  unit_price: number | string;
  total_amount: number | string;
  color?: string;
  size?: string;
}

export interface ShopOrder {
  id: number;
  sale_id?: number | null;
  shop_name?: string;
  shop_slug?: string;
  logo_path?: string | null;
  customer_address_id?: number | null;
  email: string;
  phone?: string | null;
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  customer?: string;
  payment_method: string;
  payment_status: string;
  delivery_status: DeliveryStatus | string;
  delivery_by?: 'store' | 'platform' | string;
  delivery_fee?: number | string;
  total_amount: number | string;
  payable_amount?: number | string;
  paid_amount?: number | string;
  due_amount?: number | string;
  created_at: string;
  items?: ShopOrderItem[];
}

export interface CustomerOrdersResponse {
  rows: ShopOrder[];
  total: number;
}
