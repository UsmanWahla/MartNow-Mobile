import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const compact = width < 380;
  const tablet = width >= 768;
  const desktop = width >= 1100;
  return { width, height, compact, tablet, desktop, landscape: width > height };
}
