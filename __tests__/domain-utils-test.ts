import { cartItemCount } from '@/utils/cart';
import { asNumber, firstName, formatPrice } from '@/utils/format';
import { firstRouteParam, safeDestination } from '@/utils/navigation';
import {
  formatQuantity,
  productStep,
  roundQuantity,
  saleStock,
  unitLabel,
} from '@/utils/product-units';
import { findVariantStock, hasVariantOptions, variantLabel } from '@/utils/variant-stock';

describe('navigation helpers', () => {
  test('normalizes route params and blocks external-style destinations', () => {
    expect(firstRouteParam(['first', 'second'])).toBe('first');
    expect(safeDestination('/(tabs)/cart')).toBe('/(tabs)/cart');
    expect(safeDestination('//example.com', '/')).toBe('/');
    expect(safeDestination('https://example.com', '/')).toBe('/');
  });
});

describe('cart and quantity helpers', () => {
  test('counts only finite positive quantities', () => {
    expect(
      cartItemCount([
        { quantity: 2 },
        { quantity: 0.5 },
        { quantity: Number.NaN },
        { quantity: -1 },
      ]),
    ).toBe(2.5);
  });

  test('normalizes malformed quantity metadata safely', () => {
    expect(roundQuantity(Number.POSITIVE_INFINITY)).toBe(0);
    expect(productStep({ quantity_step: 0 })).toBe(1);
    expect(productStep({ quantity_step: '0.25' })).toBe(0.25);
    expect(saleStock({ stock: 12, units_per_sale_unit: 0 })).toBe(12);
    expect(formatQuantity(1.23456)).toBe('1.235');
    expect(unitLabel('piece', 2)).toBe('pieces');
  });
});

describe('product variants and formatting', () => {
  const product = {
    id: 1,
    name: 'T-shirt',
    price: 1500,
    stock: 7,
    colors: [{ name: 'Blue', hex: '#00f' }],
    sizes: [{ name: 'M' }],
    variants: [{ color: 'Blue', size: 'M', stock: 3 }],
  };

  test('finds exact variant stock', () => {
    expect(hasVariantOptions(product)).toBe(true);
    expect(findVariantStock(product, 'Blue', 'M')).toBe(3);
    expect(findVariantStock(product, 'Blue', 'L')).toBe(0);
    expect(variantLabel('Blue', 'M')).toBe('Blue / M');
  });

  test('formats marketplace values', () => {
    expect(asNumber('invalid')).toBe(0);
    expect(formatPrice(1500)).toContain('1,500');
    expect(firstName('  Ayesha Khan ')).toBe('Ayesha');
  });
});
