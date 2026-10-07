import type { Product } from '@/types/api';

export function roundQuantity(value: number) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

export function formatQuantity(value: number | string | null | undefined) {
  const quantity = roundQuantity(Number(value));
  return quantity.toLocaleString('en-PK', { maximumFractionDigits: 3 });
}

export function unitLabel(unit?: string | null, quantity = 2) {
  const name = unit || 'piece';
  if (Math.abs(Number(quantity)) === 1 || ['kg', 'gram', 'liter', 'ml', 'meter', 'dozen'].includes(name)) return name;
  return `${name}s`;
}

export function saleStock(product: Pick<Product, 'stock' | 'units_per_sale_unit'>, baseStock?: number) {
  const conversion = Number(product.units_per_sale_unit || 1);
  return roundQuantity(Number(baseStock ?? product.stock) / conversion);
}

export function productStep(product?: Pick<Product, 'quantity_step'> | null) {
  return Number(product?.quantity_step || 1);
}
