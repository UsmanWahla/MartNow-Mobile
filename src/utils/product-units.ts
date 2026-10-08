import type { Product } from '@/types/api';

export function roundQuantity(value: number) {
  const quantity = Number(value);
  return Number.isFinite(quantity) ? Math.round(quantity * 1000) / 1000 : 0;
}

export function formatQuantity(value: number | string | null | undefined) {
  const quantity = roundQuantity(Number(value));
  return quantity.toLocaleString('en-PK', { maximumFractionDigits: 3 });
}

export function unitLabel(unit?: string | null, quantity = 2) {
  const name = unit || 'piece';
  if (
    Math.abs(Number(quantity)) === 1 ||
    ['kg', 'gram', 'liter', 'ml', 'meter', 'dozen'].includes(name)
  )
    return name;
  return `${name}s`;
}

export function saleStock(
  product: Pick<Product, 'stock' | 'units_per_sale_unit'>,
  baseStock?: number,
) {
  const conversion = Number(product.units_per_sale_unit || 1);
  return roundQuantity(Number(baseStock ?? product.stock) / (conversion > 0 ? conversion : 1));
}

export function productStep(product?: Pick<Product, 'quantity_step'> | null) {
  const step = Number(product?.quantity_step || 1);
  return Number.isFinite(step) && step > 0 ? step : 1;
}
