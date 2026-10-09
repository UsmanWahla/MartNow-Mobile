import type { ShopCartItem } from '@/types/api';

export function cartItemCount(items: readonly Pick<ShopCartItem, 'quantity'>[]): number {
  return items.reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
  }, 0);
}

export function needsCartReplacement(
  currentSlug: string | null | undefined,
  nextSlug: string,
  itemCount: number,
) {
  return Boolean(currentSlug && currentSlug !== nextSlug && itemCount > 0);
}

export function otherStoreCartMessage(storeName: string) {
  const name = storeName.trim() || 'another store';
  return `You already added products from ${name}. Yes removes those items and adds this product. No opens your current cart.`;
}
