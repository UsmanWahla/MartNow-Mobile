import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { OpenStreetMapProps } from './map-types';
import { usePageScrollLock } from '@/components/shared/page-scroll-lock';
import { colors } from '@/constants/theme';
import { loadOsmTile } from '@/utils/osm-tile-cache';
import {
  OSM_DEFAULT_ZOOM,
  OSM_MAX_ZOOM,
  OSM_MIN_ZOOM,
  panByPixels,
  projectPoint,
  unprojectPoint,
  visibleOsmTiles,
} from '@/utils/osm-projection';

const MAP_HEIGHT = 230;

function OsmTile({
  url,
  left,
  top,
  onLoad,
  onError,
}: {
  url: string;
  left: number;
  top: number;
  onLoad: () => void;
  onError: () => void;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  }, [onError, onLoad]);

  useEffect(() => {
    let active = true;
    void loadOsmTile(url).then((next) => {
      if (!active) return;
      if (!next) {
        onErrorRef.current();
        return;
      }
      setUri(next);
      onLoadRef.current();
    });
    return () => {
      active = false;
    };
  }, [url]);

  if (!uri) return null;
  return <Image resizeMode="stretch" source={{ uri }} style={[styles.tile, { left, top }]} />;
}

export default function OpenStreetMapTiles({
  latitude,
  longitude,
  onMapError,
  onPick,
}: OpenStreetMapProps) {
  const scrollLock = usePageScrollLock();
  const [zoom, setZoom] = useState(OSM_DEFAULT_ZOOM);
  const [center, setCenter] = useState({ latitude, longitude });
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 320, height: MAP_HEIGHT });
  const [loadedTiles, setLoadedTiles] = useState(0);
  const [failedTiles, setFailedTiles] = useState(0);
  const reportedError = useRef(false);
  const onMapErrorRef = useRef(onMapError);
  const gestureStart = useRef({ x: 0, y: 0, moved: false });

  useEffect(() => {
    onMapErrorRef.current = onMapError;
  }, [onMapError]);

  useEffect(() => {
    setCenter({ latitude, longitude });
    setDrag({ x: 0, y: 0 });
  }, [latitude, longitude]);

  useEffect(() => {
    setLoadedTiles(0);
    setFailedTiles(0);
    reportedError.current = false;
  }, [latitude, longitude, zoom]);

  const tiles = useMemo(
    () =>
      visibleOsmTiles(
        center.latitude,
        center.longitude,
        zoom,
        size.width,
        size.height,
        drag.x,
        drag.y,
      ),
    [center.latitude, center.longitude, drag.x, drag.y, size.height, size.width, zoom],
  );

  useEffect(() => {
    if (reportedError.current || tiles.length === 0 || loadedTiles > 0) return;
    if (failedTiles < tiles.length) return;
    reportedError.current = true;
    onMapErrorRef.current();
  }, [failedTiles, loadedTiles, tiles.length]);

  const pin = projectPoint(
    latitude,
    longitude,
    center.latitude,
    center.longitude,
    zoom,
    size.width,
    size.height,
    drag.x,
    drag.y,
  );

  const finishPan = (deltaX: number, deltaY: number) => {
    setCenter((current) => panByPixels(current.latitude, current.longitude, zoom, deltaX, deltaY));
    setDrag({ x: 0, y: 0 });
  };

  const pickAt = (x: number, y: number) => {
    onPick(
      unprojectPoint(
        x,
        y,
        center.latitude,
        center.longitude,
        zoom,
        size.width,
        size.height,
        drag.x,
        drag.y,
      ),
    );
  };

  const failed = tiles.length > 0 && loadedTiles === 0 && failedTiles >= tiles.length;

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width <= 0 || height <= 0) return;
        setSize((current) =>
          current.width === width && current.height === height ? current : { width, height },
        );
      }}
      onTouchStart={scrollLock.lock}
      onTouchEnd={scrollLock.unlock}
      onTouchCancel={scrollLock.unlock}
    >
      <View
        style={styles.stage}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(event) => {
          gestureStart.current = {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
            moved: false,
          };
        }}
        onResponderMove={(event) => {
          const deltaX = event.nativeEvent.pageX - gestureStart.current.x;
          const deltaY = event.nativeEvent.pageY - gestureStart.current.y;
          if (Math.hypot(deltaX, deltaY) > 6) gestureStart.current.moved = true;
          setDrag({ x: deltaX, y: deltaY });
        }}
        onResponderRelease={(event) => {
          const deltaX = event.nativeEvent.pageX - gestureStart.current.x;
          const deltaY = event.nativeEvent.pageY - gestureStart.current.y;
          if (!gestureStart.current.moved) {
            pickAt(event.nativeEvent.locationX, event.nativeEvent.locationY);
            return;
          }
          finishPan(deltaX, deltaY);
        }}
      >
        <View pointerEvents="none" style={styles.tiles}>
          {tiles.map((tile) => (
            <OsmTile
              key={tile.key}
              url={tile.url}
              left={tile.left}
              top={tile.top}
              onLoad={() => setLoadedTiles((count) => count + 1)}
              onError={() => setFailedTiles((count) => count + 1)}
            />
          ))}
        </View>
        <View pointerEvents="none" style={[styles.pin, { left: pin.x - 18, top: pin.y - 36 }]}>
          <View style={styles.pinCenter} />
        </View>
      </View>

      {failed ? (
        <View pointerEvents="none" style={styles.errorBanner}>
          <Text style={styles.errorText}>Map tiles are unavailable right now.</Text>
        </View>
      ) : null}
      <View style={styles.zoom}>
        <Pressable
          accessibilityLabel="Zoom in"
          onPress={() => setZoom((current) => Math.min(OSM_MAX_ZOOM, current + 1))}
          style={styles.zoomButton}
        >
          <Text style={styles.zoomText}>+</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Zoom out"
          onPress={() => setZoom((current) => Math.max(OSM_MIN_ZOOM, current - 1))}
          style={styles.zoomButton}
        >
          <Text style={styles.zoomText}>−</Text>
        </Pressable>
      </View>
      <View pointerEvents="none" style={styles.attribution}>
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#C5D5CE',
  },
  stage: { flex: 1 },
  tiles: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  tile: { position: 'absolute', width: 256, height: 256 },
  pin: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: colors.danger,
    zIndex: 2,
  },
  pinCenter: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  zoom: { position: 'absolute', top: 10, left: 10, zIndex: 3, gap: 6 },
  zoomButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  zoomText: { color: colors.teal, fontSize: 20, fontFamily: 'Outfit_700Bold', lineHeight: 24 },
  errorBanner: {
    position: 'absolute',
    top: 10,
    right: 10,
    left: 56,
    zIndex: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(254,228,226,0.95)',
  },
  errorText: {
    color: colors.danger,
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
  attribution: {
    position: 'absolute',
    right: 7,
    bottom: 7,
    zIndex: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  attributionText: { color: '#33413D', fontSize: 8 },
});
