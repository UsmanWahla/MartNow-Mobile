import { cartItemCount } from '@/utils/cart';
import { asNumber, asOptionalNonNegativeNumber, firstName, formatPrice } from '@/utils/format';
import { firstRouteParam, safeDestination } from '@/utils/navigation';
import {
  clampLatitude,
  projectPoint,
  unprojectPoint,
  visibleOsmTiles,
  wrapLongitude,
} from '@/utils/osm-projection';
import { formatOrderNumber, orderStatusLabel } from '@/utils/orders';
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
    expect(asOptionalNonNegativeNumber(undefined)).toBeNull();
    expect(asOptionalNonNegativeNumber('')).toBeNull();
    expect(asOptionalNonNegativeNumber(-1)).toBeNull();
    expect(asOptionalNonNegativeNumber('125.5')).toBe(125.5);
    expect(asOptionalNonNegativeNumber(0)).toBe(0);
    expect(formatPrice(1500)).toContain('1,500');
    expect(firstName('  Ayesha Khan ')).toBe('Ayesha');
  });
});

describe('order helpers', () => {
  test('formats safe order numbers', () => {
    expect(formatOrderNumber(7)).toBe('007');
    expect(formatOrderNumber('invalid')).toBe('—');
  });

  test('prioritizes terminal order states', () => {
    expect(orderStatusLabel({ delivery_status: 'cancelled', payment_status: 'collected' })).toBe(
      'Cancelled',
    );
    expect(orderStatusLabel({ delivery_status: 'delivered', payment_status: 'pending' })).toBe(
      'Paid',
    );
    expect(orderStatusLabel({ delivery_status: 'dispatched', payment_status: 'pending' })).toBe(
      'Dispatched',
    );
  });
});

describe('OpenStreetMap projection helpers', () => {
  test('clamps latitude and wraps longitude', () => {
    expect(clampLatitude(90)).toBeLessThan(90);
    expect(clampLatitude(-90)).toBeGreaterThan(-90);
    expect(wrapLongitude(190)).toBe(-170);
    expect(wrapLongitude(-190)).toBe(170);
  });

  test('round-trips a projected point', () => {
    const projected = projectPoint(31.52, 74.35, 31.5, 74.3, 16, 360, 640);
    const location = unprojectPoint(projected.x, projected.y, 31.5, 74.3, 16, 360, 640);
    expect(location.latitude).toBeCloseTo(31.52, 6);
    expect(location.longitude).toBeCloseTo(74.35, 6);
  });

  test('returns no tiles for an empty viewport and valid unique tiles otherwise', () => {
    expect(visibleOsmTiles(31.52, 74.35, 16, 0, 640)).toEqual([]);
    const tiles = visibleOsmTiles(31.52, 74.35, 16, 360, 640);
    expect(tiles.length).toBeGreaterThan(0);
    expect(new Set(tiles.map((tile) => tile.key)).size).toBe(tiles.length);
    expect(tiles.every((tile) => tile.url.startsWith('https://tile.openstreetmap.org/16/'))).toBe(
      true,
    );
  });
});
