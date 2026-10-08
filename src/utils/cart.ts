import type { ShopCartItem } from '@/types/api';

export function cartItemCount(items: readonly Pick<ShopCartItem, 'quantity'>[]): number {
  return items.reduce((total, item) => {
    const quantity = Number(item.quantity);
    return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
  }, 0);
}
