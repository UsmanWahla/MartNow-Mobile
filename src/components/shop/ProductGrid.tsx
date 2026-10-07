import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { ProductCard } from './ProductCard';
import type { Product } from '@/types/api';

export function ProductGrid({ products, onOpen }: { products: Product[]; onOpen: (product: Product) => void }) {
  const { width } = useWindowDimensions();
  const available = Math.min(width, 1180) - (width < 380 ? 24 : width < 768 ? 36 : 56);
  const columns = width >= 1280 ? 5 : width >= 980 ? 4 : width >= 650 ? 3 : 2;
  const gap = width < 380 ? 8 : 12;
  const cardWidth = Math.floor((available - gap * (columns - 1)) / columns);
  return <View style={[styles.grid, { gap }]}>{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} width={cardWidth} onPress={() => onOpen(product)} />)}</View>;
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap' } });
