export interface OpenStreetMapProps {
  latitude: number;
  longitude: number;
  onMapError: () => void;
  onPick: (coordinate: { latitude: number; longitude: number }) => void;
}
