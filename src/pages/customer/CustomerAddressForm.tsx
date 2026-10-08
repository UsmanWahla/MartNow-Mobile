import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import LocationPicker from '@/components/customer/LocationPicker';
import { AppIcon } from '@/components/shared/AppIcon';
import { Page } from '@/components/shared/Page';
import { ScreenHeader } from '@/components/shared/ScreenHeader';
import { Body, Heading, Label } from '@/components/shared/Typography';
import { Button, EmptyState, Field, LoadingState } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { createAddress, getAddresses, getCustomerProfile, updateAddress } from '@/services/martnow';
import { useAuth } from '@/store/auth-context';
import { useFeedback } from '@/store/feedback-context';
import type { CustomerAddressInput } from '@/types/api';
import { getErrorMessage } from '@/utils/error-message';
import { firstRouteParam } from '@/utils/navigation';

interface FormState extends Omit<CustomerAddressInput, 'latitude' | 'longitude'> {
  latitude: string;
  longitude: string;
}
const empty: FormState = {
  label: 'Home',
  recipient_name: '',
  phone: '',
  address: '',
  city: '',
  latitude: '',
  longitude: '',
  is_default: false,
};

export default function CustomerAddressForm() {
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = firstRouteParam(params.id);
  const parsedAddressId = rawId ? Number(rawId) : null;
  const addressId =
    parsedAddressId != null && Number.isInteger(parsedAddressId) && parsedAddressId > 0
      ? parsedAddressId
      : null;
  const invalidAddressId = rawId != null && addressId == null;
  const { isAuthenticated, isReady } = useAuth();
  const { showToast } = useFeedback();
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(Boolean(rawId));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const requestId = useRef(0);
  const savingRef = useRef(false);
  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    if (invalidAddressId) {
      setLoadError('This address link is invalid.');
      setLoading(false);
      return;
    }
    const currentRequest = ++requestId.current;
    setLoading(true);
    setLoadError('');
    try {
      const [profile, addressResult] = await Promise.all([
        getCustomerProfile(),
        addressId ? getAddresses() : Promise.resolve({ rows: [] }),
      ]);
      if (currentRequest !== requestId.current) return;
      const address = addressResult.rows.find((item) => item.id === addressId);
      if (addressId && !address) {
        setLoadError('This saved address no longer exists.');
        return;
      }
      setForm(
        address
          ? {
              label: address.label,
              recipient_name: address.recipient_name,
              phone: address.phone,
              address: address.address,
              city: address.city,
              latitude: address.latitude == null ? '' : String(address.latitude),
              longitude: address.longitude == null ? '' : String(address.longitude),
              is_default: address.is_default,
            }
          : { ...empty, recipient_name: profile.name, phone: profile.phone, is_default: false },
      );
    } catch (cause) {
      const message = getErrorMessage(cause);
      if (currentRequest === requestId.current) {
        setLoadError(message);
        showToast(message, 'error');
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [addressId, invalidAddressId, isAuthenticated, showToast]);
  useEffect(() => {
    if (isReady) void load();
    return () => {
      requestId.current += 1;
    };
  }, [isReady, load]);
  const patch = (value: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...value }));
    setErrors({});
  };
  const save = async () => {
    if (savingRef.current || loadError) return;
    const next: Record<string, string> = {};
    if (!form.label.trim()) next.label = 'Enter an address label.';
    if (!form.recipient_name.trim()) next.recipient_name = 'Enter the receiver name.';
    if (!form.phone.trim()) next.phone = 'Enter the receiver phone.';
    if (!form.address.trim()) next.address = 'Enter the complete address.';
    if (!form.city.trim()) next.city = 'Enter the city.';
    if ((form.latitude && !form.longitude) || (!form.latitude && form.longitude))
      next.address = 'Select both latitude and longitude.';
    setErrors(next);
    if (Object.keys(next).length) {
      showToast(Object.values(next)[0], 'error');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const payload: CustomerAddressInput = {
        ...form,
        label: form.label.trim(),
        recipient_name: form.recipient_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        latitude: form.latitude || null,
        longitude: form.longitude || null,
      };
      const result = addressId
        ? await updateAddress(addressId, payload)
        : await createAddress(payload);
      showToast(result.message, 'success');
      if (router.canGoBack()) router.back();
      else router.replace('/addresses');
    } catch (cause) {
      showToast(getErrorMessage(cause), 'error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  if (!isReady || loading)
    return (
      <Page>
        <ScreenHeader title={addressId ? 'Edit address' : 'Add address'} />
        <LoadingState label="Preparing address…" />
      </Page>
    );
  if (!isAuthenticated)
    return (
      <Page compact>
        <ScreenHeader title="Address" />
        <EmptyState
          title="Sign in required"
          message="Log in before saving a delivery address."
          action={
            <Button
              label="Log in"
              onPress={() =>
                router.replace({
                  pathname: '/auth/login',
                  params: {
                    next: addressId ? `/addresses/form?id=${addressId}` : '/addresses/form',
                  },
                })
              }
            />
          }
        />
      </Page>
    );
  if (loadError)
    return (
      <Page compact>
        <ScreenHeader title="Address" fallbackHref="/addresses" />
        <EmptyState
          title="Address unavailable"
          message={loadError}
          action={<Button label="Back to addresses" onPress={() => router.replace('/addresses')} />}
        />
      </Page>
    );
  return (
    <Page keyboard compact>
      <ScreenHeader title={addressId ? 'Edit address' : 'Add address'} />
      <View style={styles.heading}>
        <Heading style={styles.title}>
          {addressId ? 'Update delivery address' : 'New delivery address'}
        </Heading>
        <Body>Search an address, use your current location, or enter it manually.</Body>
      </View>
      <View style={styles.form}>
        <Field
          label="Address label"
          value={form.label}
          error={errors.label}
          placeholder="Home, Office, Parents"
          onChangeText={(label) => patch({ label })}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <Field
              label="Receiver name"
              value={form.recipient_name}
              error={errors.recipient_name}
              onChangeText={(recipient_name) => patch({ recipient_name })}
            />
          </View>
          <View style={styles.half}>
            <Field
              label="Receiver phone"
              value={form.phone}
              error={errors.phone}
              keyboardType="phone-pad"
              onChangeText={(phone) => patch({ phone })}
            />
          </View>
        </View>
        <Field
          label="City"
          value={form.city}
          error={errors.city}
          onChangeText={(city) => patch({ city })}
        />
        <LocationPicker
          value={{ address: form.address, latitude: form.latitude, longitude: form.longitude }}
          error={errors.address}
          onChange={(location) => patch(location)}
        />
        <Pressable
          disabled={Boolean(addressId && form.is_default)}
          onPress={() => patch({ is_default: !form.is_default })}
          style={styles.checkRow}
        >
          <View style={[styles.checkbox, form.is_default && styles.checked]}>
            {form.is_default ? <AppIcon name="checkmark" size={16} color="#fff" /> : null}
          </View>
          <Label style={styles.checkText}>Use as my default delivery address</Label>
        </Pressable>
        <Button
          label={addressId ? 'Save changes' : 'Save address'}
          onPress={() => {
            void save();
          }}
          loading={saving}
        />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 3 },
  title: { fontSize: 24 },
  form: {
    gap: 15,
    padding: 17,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  half: { minWidth: 220, flex: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  checked: { borderColor: colors.teal, backgroundColor: colors.teal },
  checkText: { flex: 1, fontSize: 12 },
});
