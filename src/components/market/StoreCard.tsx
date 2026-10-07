import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp, ReduceMotion } from 'react-native-reanimated';

import { AppIcon } from '@/components/shared/AppIcon';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { colors, radius, shadow } from '@/constants/theme';
import { assetUrl } from '@/services/martnow';
import type { PublicStore } from '@/types/api';

const WELLS = ['#CDEAE3', '#B7DCD3', '#D7E5C8', '#9FCFC4'];

export function StoreCard({ store, index = 0, onPress }: { store: PublicStore; index?: number; onPress: () => void }) {
  const uri = assetUrl(store.logo_path);
  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 8) * 45).duration(320).reduceMotion(ReduceMotion.System)} style={styles.animated}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${store.name}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={[styles.media, { backgroundColor: WELLS[index % WELLS.length] }]}>
          {uri ? <Image source={uri} style={styles.logo} contentFit="contain" transition={180} /> : <View style={styles.fallback}><Heading style={styles.letter}>{store.name.slice(0, 1).toUpperCase()}</Heading></View>}
        </View>
        <View style={styles.content}>
          <Heading numberOfLines={1} style={styles.name}>{store.name}</Heading>
          <View style={styles.typePill}><Label numberOfLines={1} style={styles.type}>{store.store_type}</Label></View>
          <Body numberOfLines={2} style={styles.address}>{store.address || 'Local store'}</Body>
          <View style={styles.deliveryRow}>
            <AppIcon name={store.delivery_enabled ? 'bicycle-outline' : 'car-outline'} size={15} color={colors.teal} />
            <Label style={styles.delivery}>{store.delivery_enabled ? 'Store or platform delivery' : 'Platform delivery'}</Label>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animated: { flex: 1 },
  card: { flex: 1, minHeight: 280, overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, ...shadow },
  pressed: { opacity: 0.9, transform: [{ translateY: -3 }, { scale: 0.992 }] },
  media: { minHeight: 158, flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  logo: { width: '88%', height: '88%' },
  fallback: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.82)' },
  letter: { color: colors.teal, fontSize: 38 },
  content: { gap: 6, padding: 15 },
  name: { fontSize: 17 },
  typePill: { alignSelf: 'flex-start', maxWidth: '100%', borderRadius: radius.pill, backgroundColor: colors.skySoft, paddingHorizontal: 9, paddingVertical: 4 },
  type: { color: colors.sky, fontSize: 11 },
  address: { minHeight: 38, fontSize: 13, lineHeight: 19 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  delivery: { color: colors.teal, fontSize: 11 },
});
