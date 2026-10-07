export interface LocationValue {
  address: string;
  latitude: string;
  longitude: string;
}

export interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  error?: string;
  label?: string;
}
