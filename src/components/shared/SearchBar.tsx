import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { colors, radius } from '@/constants/theme';

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  autoFocus = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.root}>
      <AppIcon name="search-outline" size={20} color={colors.teal} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71817B"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={styles.input}
      />
      {value ? (
        <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => onChangeText('')}>
          <AppIcon name="close-circle" size={20} color={colors.disabled} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#C5D5D0',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  input: {
    minWidth: 0,
    flex: 1,
    color: colors.ink,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    paddingVertical: 12,
  },
});
