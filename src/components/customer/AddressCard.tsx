import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/shared/AppIcon';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { colors, radius } from '@/constants/theme';
import type { CustomerAddress } from '@/types/api';

export function AddressCard({
  address,
  selected,
  onPress,
  onEdit,
  onDelete,
  onDefault,
}: {
  address: CustomerAddress;
  selected?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDefault?: () => void;
}) {
  const content = (
    <>
      <View style={styles.top}>
        <View style={styles.icon}>
          <AppIcon name="location-outline" size={20} color={colors.teal} />
        </View>
        <View style={styles.titleCopy}>
          <Heading numberOfLines={1} style={styles.title}>
            {address.label}
          </Heading>
          <Body numberOfLines={1} style={styles.person}>
            {address.recipient_name} · {address.phone}
          </Body>
        </View>
        {address.is_default ? (
          <View style={styles.defaultPill}>
            <Label style={styles.defaultText}>Default</Label>
          </View>
        ) : null}
        {selected ? <AppIcon name="checkmark-circle" size={22} color={colors.teal} /> : null}
      </View>
      <Body style={styles.address}>{address.address}</Body>
      <Body style={styles.city}>{address.city}</Body>
      {onDefault || onEdit || onDelete ? (
        <View style={styles.actions}>
          {!address.is_default && onDefault ? (
            <Pressable onPress={onDefault} hitSlop={7}>
              <Label style={styles.defaultAction}>Set as default</Label>
            </Pressable>
          ) : (
            <View />
          )}
          <View style={styles.actionButtons}>
            {onEdit ? (
              <Pressable
                accessibilityLabel={`Edit ${address.label}`}
                onPress={onEdit}
                style={styles.action}
              >
                <AppIcon name="pencil-outline" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                accessibilityLabel={`Delete ${address.label}`}
                onPress={onDelete}
                style={[styles.action, styles.delete]}
              >
                <AppIcon name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={[styles.card, selected && styles.selected]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 5,
    padding: 15,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.teal, backgroundColor: '#F4FFFC' },
  pressed: { opacity: 0.72 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  icon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  titleCopy: { minWidth: 0, flex: 1 },
  title: { fontSize: 15 },
  person: { fontSize: 11, marginTop: 1 },
  defaultPill: {
    borderRadius: radius.pill,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultText: { color: colors.teal, fontSize: 9, textTransform: 'uppercase' },
  address: { marginTop: 6, fontSize: 13, lineHeight: 19 },
  city: { fontSize: 12 },
  actions: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defaultAction: { color: colors.teal, fontSize: 11 },
  actionButtons: { flexDirection: 'row', gap: 5 },
  action: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#F4F6F5',
  },
  delete: { backgroundColor: colors.dangerSoft },
});
