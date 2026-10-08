import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  Map,
  TransformRequestManager,
  ViewAnnotation,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';

import { colors } from '@/constants/theme';

const MAP_ZOOM = 16;
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'MartNow OpenStreetMap',
  sources: {
    openstreetmap: {
      type: 'raster',
      tiles: [OSM_TILE_URL],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'openstreetmap', type: 'raster', source: 'openstreetmap' }],
};

export interface OpenStreetMapProps {
  latitude: number;
  longitude: number;
  onMapError: () => void;
  onPick: (coordinate: { latitude: number; longitude: number }) => void;
}

export default function OpenStreetMap({
  latitude,
  longitude,
  onMapError,
  onPick,
}: OpenStreetMapProps) {
  useEffect(() => {
    TransformRequestManager.addHeader({
      id: 'martnow-osm-user-agent',
      match: 'https://tile\\.openstreetmap\\.org/',
      name: 'User-Agent',
      value: 'MartNowMobile/1.0 (MartNow Marketplace)',
    });
    return () => {
      TransformRequestManager.removeHeader('martnow-osm-user-agent');
    };
  }, []);

  return (
    <>
      <Map
        attribution
        compass
        mapStyle={OSM_MAP_STYLE}
        onDidFailLoadingMap={onMapError}
        onPress={(event) => {
          const [nextLongitude, nextLatitude] = event.nativeEvent.lngLat;
          onPick({ latitude: nextLatitude, longitude: nextLongitude });
        }}
        style={styles.map}
      >
        <Camera
          center={[longitude, latitude]}
          duration={250}
          initialViewState={{ center: [longitude, latitude], zoom: MAP_ZOOM }}
          zoom={MAP_ZOOM}
        />
        <ViewAnnotation
          anchor="bottom"
          draggable
          id="delivery-pin"
          lngLat={[longitude, latitude]}
          onDragEnd={(event) => {
            const [nextLongitude, nextLatitude] = event.nativeEvent.lngLat;
            onPick({ latitude: nextLatitude, longitude: nextLongitude });
          }}
        >
          <View style={styles.mapPin}>
            <View style={styles.pinCenter} />
          </View>
        </ViewAnnotation>
      </Map>
      <View pointerEvents="none" style={styles.attribution}>
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
  mapPin: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: colors.danger,
  },
  pinCenter: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  attribution: {
    position: 'absolute',
    right: 7,
    bottom: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  attributionText: { color: '#33413D', fontSize: 8 },
});
