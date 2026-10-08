import type { ComponentType } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import Constants, { AppOwnership } from 'expo-constants';

import type { LocationPickerProps } from './LocationPicker.types';
import type { OpenStreetMapProps } from './OpenStreetMap';
import { AppIcon } from '@/components/shared/AppIcon';
import { Body, Label } from '@/components/shared/Typography';
import { colors, radius } from '@/constants/theme';
import { reverseLocation, searchLocations } from '@/services/martnow';
import type { StoreLocationResult } from '@/types/api';
import { getErrorMessage } from '@/utils/error-message';

const isExpoGo = Constants.appOwnership === AppOwnership.Expo;
const formatCoordinate = (value: number) => String(Math.round(value * 10_000_000) / 10_000_000);

function parseCoordinate(value: string, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function DeliveryMap({ latitude, longitude, onMapError, onPick }: OpenStreetMapProps) {
  if (isExpoGo) {
    return (
      <View style={styles.mapUnavailable}>
        <AppIcon name="phone-portrait-outline" size={28} color={colors.teal} />
        <Label style={styles.mapUnavailableTitle}>Map needs the MartNow Dev Build</Label>
        <Body style={styles.mapUnavailableText}>
          OpenStreetMap is available after installing the custom development build. You can still
          search or use your current location here.
        </Body>
      </View>
    );
  }

  // MapLibre is imported only in a custom native build. Expo Go has no MapLibre
  // native module and must never evaluate this import.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NativeOpenStreetMap = require('./OpenStreetMap')
    .default as ComponentType<OpenStreetMapProps>;
  return (
    <NativeOpenStreetMap
      latitude={latitude}
      longitude={longitude}
      onMapError={onMapError}
      onPick={onPick}
    />
  );
}

export default function LocationPicker({
  value,
  onChange,
  error,
  label = 'Complete delivery address',
}: LocationPickerProps) {
  const [query, setQuery] = useState(value.address);
  const [results, setResults] = useState<StoreLocationResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const requestId = useRef(0);
  const latitude = parseCoordinate(value.latitude, -90, 90);
  const longitude = parseCoordinate(value.longitude, -180, 180);
  const hasPlaceholderCoordinates = latitude === 0 && longitude === 0;
  const region =
    latitude != null && longitude != null && !hasPlaceholderCoordinates
      ? { latitude, longitude }
      : null;

  useEffect(() => {
    setQuery(value.address);
  }, [value.address]);

  useEffect(() => {
    let active = true;
    void Location.getForegroundPermissionsAsync()
      .then((permission) => {
        if (!active) return;
        setLocationGranted(permission.granted);
        setCanAskAgain(permission.canAskAgain);
      })
      .catch(() => {
        if (active) setLocationGranted(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  const select = (location: StoreLocationResult) => {
    setQuery(location.address);
    setResults([]);
    setMessage('Location selected.');
    onChange({
      address: location.address,
      latitude: formatCoordinate(location.latitude),
      longitude: formatCoordinate(location.longitude),
    });
  };

  const savePin = (coordinate: { latitude: number; longitude: number }) => {
    onChange({
      ...value,
      latitude: formatCoordinate(coordinate.latitude),
      longitude: formatCoordinate(coordinate.longitude),
    });
  };

  const resolvePin = async (coordinate: { latitude: number; longitude: number }) => {
    const currentRequest = ++requestId.current;
    savePin(coordinate);
    setResults([]);
    setBusy(true);
    setMessage('Pin saved. Finding the address...');

    try {
      const location = await reverseLocation(coordinate.latitude, coordinate.longitude);
      if (currentRequest === requestId.current) select(location);
    } catch {
      if (currentRequest === requestId.current) {
        setMessage('Pin saved. Type the complete address manually if it was not found.');
      }
    } finally {
      if (currentRequest === requestId.current) setBusy(false);
    }
  };

  const search = async () => {
    if (query.trim().length < 3) {
      setMessage('Enter at least 3 characters.');
      return;
    }

    const currentRequest = ++requestId.current;
    setBusy(true);
    setMessage('');
    try {
      const rows = await searchLocations(query.trim());
      if (currentRequest === requestId.current) {
        setResults(rows);
        setMessage(rows.length ? 'Select the correct result.' : 'No matching location found.');
      }
    } catch (cause) {
      if (currentRequest === requestId.current) setMessage(getErrorMessage(cause));
    } finally {
      if (currentRequest === requestId.current) setBusy(false);
    }
  };

  const locateCurrentPosition = async () => {
    const currentRequest = ++requestId.current;
    setBusy(true);
    setMessage('');

    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        if (currentRequest === requestId.current) {
          setMessage('Location services are off. Enable them in device settings and try again.');
        }
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (currentRequest !== requestId.current) return;
      setLocationGranted(permission.granted);
      setCanAskAgain(permission.canAskAgain);

      if (!permission.granted) {
        setMessage(
          permission.canAskAgain
            ? 'Location permission was denied. You can still search for an address or place the pin manually.'
            : 'Location permission is disabled. Enable it in device settings, or search for an address.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (currentRequest !== requestId.current) return;
      const coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Save the device coordinates before reverse geocoding so a backend lookup
      // failure never discards the user's real location.
      savePin(coordinate);
      setMessage('Current location found. Finding the address...');

      try {
        const location = await reverseLocation(coordinate.latitude, coordinate.longitude);
        if (currentRequest === requestId.current) select(location);
      } catch {
        if (currentRequest === requestId.current) {
          setMessage(
            'Current location saved. Type the complete address manually if it was not found.',
          );
        }
      }
    } catch (cause) {
      if (currentRequest === requestId.current) setMessage(getErrorMessage(cause));
    } finally {
      if (currentRequest === requestId.current) setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Label style={styles.label}>{label}</Label>
      <View style={[styles.search, error && styles.errorBorder]}>
        <AppIcon name="search-outline" size={18} color={colors.teal} />
        <TextInput
          value={query}
          onChangeText={(text) => {
            requestId.current += 1;
            setBusy(false);
            setQuery(text);
            onChange({ ...value, address: text });
            setResults([]);
          }}
          placeholder="Search area, road, city or landmark"
          placeholderTextColor="#71817B"
          returnKeyType="search"
          style={styles.input}
          onSubmitEditing={() => {
            void search();
          }}
        />
        <Pressable
          disabled={busy}
          onPress={() => {
            void search();
          }}
          style={styles.searchButton}
        >
          <Label style={styles.searchButtonText}>{busy ? '...' : 'Search'}</Label>
        </Pressable>
      </View>
      {error ? <Body style={styles.error}>{error}</Body> : null}

      {results.length ? (
        <View style={styles.results}>
          {results.map((item) => (
            <Pressable
              key={`${item.latitude}-${item.longitude}`}
              onPress={() => {
                requestId.current += 1;
                setBusy(false);
                select(item);
              }}
              style={({ pressed }) => [styles.result, pressed && styles.pressed]}
            >
              <AppIcon name="location-outline" size={17} color={colors.teal} />
              <Body style={styles.resultText}>{item.address}</Body>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            void locateCurrentPosition();
          }}
          style={({ pressed }) => [
            styles.locationButton,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}
        >
          <AppIcon name="locate-outline" size={17} color={colors.teal} />
          <Label style={styles.locationText}>Use current location</Label>
        </Pressable>
        {!canAskAgain && !locationGranted ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void Linking.openSettings();
            }}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          >
            <Label style={styles.settingsText}>Open settings</Label>
          </Pressable>
        ) : null}
        <Body style={styles.hint}>
          {region
            ? isExpoGo
              ? 'Install the MartNow Dev Build to move the pin on the map.'
              : 'Tap the map to move the pin.'
            : 'Search or use GPS to show the map.'}
        </Body>
      </View>

      {region ? (
        <View style={styles.mapFrame}>
          <DeliveryMap
            latitude={region.latitude}
            longitude={region.longitude}
            onMapError={() => {
              setMessage('The map could not load. Check your internet connection and try again.');
            }}
            onPick={(coordinate) => {
              void resolvePin(coordinate);
            }}
          />
        </View>
      ) : (
        <View style={styles.mapEmpty}>
          <AppIcon name="map-outline" size={32} color={colors.teal} />
          <Body style={styles.mapEmptyText}>
            Use your current location or search for an address to place the delivery pin.
          </Body>
        </View>
      )}

      <View style={styles.coords}>
        <Body style={styles.coord}>Lat: {region?.latitude ?? 'Not set'}</Body>
        <Body style={styles.coord}>Lng: {region?.longitude ?? 'Not set'}</Body>
      </View>
      {message ? <Body style={styles.message}>{message}</Body> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  label: { fontSize: 13 },
  search: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  input: {
    minWidth: 0,
    flex: 1,
    minHeight: 48,
    color: colors.ink,
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
  },
  searchButton: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: colors.teal,
  },
  searchButtonText: { color: '#fff', fontSize: 11 },
  results: {
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  result: {
    flexDirection: 'row',
    gap: 8,
    padding: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F0',
  },
  resultText: { flex: 1, fontSize: 12, lineHeight: 17 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  locationButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor: colors.tealSoft,
  },
  locationText: { color: colors.teal, fontSize: 11 },
  settingsButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  settingsText: { color: colors.teal, fontSize: 11 },
  hint: { flexShrink: 1, fontSize: 10 },
  mapFrame: {
    position: 'relative',
    height: 230,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: '#EAF3EF',
  },
  mapUnavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: 24,
    backgroundColor: colors.tealSoft,
  },
  mapUnavailableTitle: { color: colors.teal, fontSize: 13 },
  mapUnavailableText: { maxWidth: 300, textAlign: 'center', fontSize: 11, lineHeight: 16 },
  mapEmpty: {
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: 24,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: '#F6FAF8',
  },
  mapEmptyText: { maxWidth: 320, textAlign: 'center', fontSize: 12, lineHeight: 18 },
  coords: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  coord: { flex: 1, fontSize: 10 },
  message: { fontSize: 11, lineHeight: 16 },
  error: { color: colors.danger, fontSize: 11 },
  errorBorder: { borderColor: colors.danger },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.45 },
});
