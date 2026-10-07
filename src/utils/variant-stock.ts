import type { Product } from '@/types/api';

export function variantLabel(color?: string | null, size?: string | null) {
  return [color, size].filter(Boolean).join(' / ');
}

export function findVariantStock(product: Product, color?: string, size?: string) {
  if (!product.variants?.length) return Number(product.stock) || 0;
  const row = product.variants.find(
    (item) => (item.color || '') === (color || '') && (item.size || '') === (size || ''),
  );
  return row ? Number(row.stock) || 0 : 0;
}

export function hasVariantOptions(product?: Product | null) {
  return Boolean(product?.colors?.length || product?.sizes?.length);
}
