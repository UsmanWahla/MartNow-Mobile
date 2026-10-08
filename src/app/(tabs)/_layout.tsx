import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type IconName } from '@/components/shared/AppIcon';
import { colors } from '@/constants/theme';
import { useCartShop } from '@/store/shop-context';

const icons: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  market: { active: 'search', inactive: 'search-outline' },
  cart: { active: 'cart', inactive: 'cart-outline' },
  orders: { active: 'receipt', inactive: 'receipt-outline' },
  account: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export default function TabsLayout() {
  const { cartCount } = useCartShop();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: colors.page },
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: '#75857F',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 64 + bottomPadding,
          paddingTop: 7,
          paddingBottom: bottomPadding,
          borderTopColor: colors.border,
          backgroundColor: '#FFFFFF',
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: { fontFamily: 'Outfit_600SemiBold', fontSize: 10, lineHeight: 13 },
        tabBarIcon: ({ color, focused, size }) => (
          <AppIcon
            name={
              (focused ? icons[route.name]?.active : icons[route.name]?.inactive) ??
              'ellipse-outline'
            }
            size={Math.min(size, 23)}
            color={String(color)}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="market" options={{ title: 'Search' }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.amber,
            fontFamily: 'IBMPlexSans_600SemiBold',
            fontSize: 9,
          },
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
