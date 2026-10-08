import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width } = useWindowDimensions();
  const tablet = width >= 768;
  return { tablet };
}
