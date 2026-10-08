import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { StoreCard } from './StoreCard';
import type { PublicStore } from '@/types/api';

export function StoreGrid({
  stores,
  onOpen,
}: {
  stores: PublicStore[];
  onOpen: (store: PublicStore) => void;
}) {
  const { width } = useWindowDimensions();
  const columns = width >= 1200 ? 3 : width >= 700 ? 2 : 1;
  return (
    <View style={styles.grid}>
      {stores.map((store, index) => (
        <View key={store.id} style={[styles.item, { flexBasis: `${100 / columns - 1.3}%` }]}>
          <StoreCard store={store} index={index} onPress={() => onOpen(store)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  item: { flexGrow: 1, minWidth: 250, maxWidth: 520 },
});
