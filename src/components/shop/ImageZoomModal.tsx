/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutable UI-thread state. */
import { useCallback, useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;

function clamp(value: number, minimum: number, maximum: number) {
  'worklet';
  return Math.min(Math.max(value, minimum), maximum);
}

function translationLimit(size: number, currentScale: number) {
  'worklet';
  return Math.max(0, (size * (currentScale - 1)) / 2);
}

export interface ImageZoomModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  imageLabel: string;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export function ImageZoomModal({
  visible,
  images,
  initialIndex = 0,
  imageLabel,
  onClose,
  onIndexChange,
}: ImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [frame, setFrame] = useState({ width: 1, height: 1 });
  const [imageFailed, setImageFailed] = useState(false);

  const scale = useSharedValue(MIN_SCALE);
  const savedScale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetZoom = useCallback(
    (animated = true) => {
      const animate = animated ? withTiming : (value: number) => value;
      scale.value = animate(MIN_SCALE);
      savedScale.value = MIN_SCALE;
      translateX.value = animate(0);
      translateY.value = animate(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    },
    [savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY],
  );

  useEffect(() => {
    if (!visible) return;
    const safeIndex = clamp(initialIndex, 0, Math.max(images.length - 1, 0));
    setCurrentIndex(safeIndex);
    resetZoom(false);
  }, [images.length, initialIndex, resetZoom, visible]);

  useEffect(() => {
    setImageFailed(false);
    resetZoom(false);
  }, [currentIndex, resetZoom]);

  const moveTo = useCallback(
    (nextIndex: number) => {
      const safeIndex = clamp(nextIndex, 0, Math.max(images.length - 1, 0));
      setCurrentIndex(safeIndex);
      onIndexChange?.(safeIndex);
    },
    [images.length, onIndexChange],
  );

  const animateToScale = useCallback(
    (requestedScale: number) => {
      const nextScale = clamp(requestedScale, MIN_SCALE, MAX_SCALE);
      const limitX = translationLimit(frame.width, nextScale);
      const limitY = translationLimit(frame.height, nextScale);
      scale.value = withTiming(nextScale, { duration: 180 });
      translateX.value = withTiming(clamp(translateX.value, -limitX, limitX), { duration: 180 });
      translateY.value = withTiming(clamp(translateY.value, -limitY, limitY), { duration: 180 });
      if (nextScale === MIN_SCALE) {
        translateX.value = withTiming(0, { duration: 180 });
        translateY.value = withTiming(0, { duration: 180 });
      }
    },
    [frame.height, frame.width, scale, translateX, translateY],
  );

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      const limitX = translationLimit(frame.width, scale.value);
      const limitY = translationLimit(frame.height, scale.value);
      translateX.value = withSpring(clamp(translateX.value, -limitX, limitX));
      translateY.value = withSpring(clamp(translateY.value, -limitY, limitY));
      if (scale.value <= MIN_SCALE) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .enableTrackpadTwoFingerGesture(true)
    .onBegin(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value <= MIN_SCALE) return;
      const limitX = translationLimit(frame.width, scale.value);
      const limitY = translationLimit(frame.height, scale.value);
      translateX.value = clamp(savedTranslateX.value + event.translationX, -limitX, limitX);
      translateY.value = clamp(savedTranslateY.value + event.translationY, -limitY, limitY);
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(280)
    .onEnd((event, success) => {
      if (!success) return;
      if (scale.value > MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        return;
      }

      const nextScale = 2.5;
      const limitX = translationLimit(frame.width, nextScale);
      const limitY = translationLimit(frame.height, nextScale);
      scale.value = withTiming(nextScale);
      translateX.value = withTiming(
        clamp((frame.width / 2 - event.x) * (nextScale - 1), -limitX, limitX),
      );
      translateY.value = withTiming(
        clamp((frame.height / 2 - event.y) * (nextScale - 1), -limitY, limitY),
      );
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const onFrameLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFrame({ width: Math.max(1, width), height: Math.max(1, height) });
  }, []);

  const currentImage = images[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      transparent={false}
      visible={visible}
    >
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text accessibilityLiveRegion="polite" style={styles.counter}>
            {images.length ? `${currentIndex + 1} / ${images.length}` : 'No image'}
          </Text>
          <Pressable
            accessibilityLabel="Close image viewer"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.iconButton, pressed && styles.controlPressed]}
          >
            <Ionicons color="#FFFFFF" name="close" size={26} />
          </Pressable>
        </View>

        <View onLayout={onFrameLayout} style={styles.viewer}>
          {currentImage ? (
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.zoomCanvas, animatedImageStyle]}>
                {imageFailed ? (
                  <View style={styles.unavailable}>
                    <Ionicons color="#83918D" name="image-outline" size={48} />
                    <Text style={styles.unavailableText}>Image unavailable</Text>
                  </View>
                ) : (
                  <Image
                    accessibilityIgnoresInvertColors
                    accessibilityLabel={`${imageLabel}, image ${currentIndex + 1} of ${images.length}`}
                    cachePolicy="memory-disk"
                    contentFit="contain"
                    draggable={false}
                    onError={() => setImageFailed(true)}
                    source={{ uri: currentImage }}
                    style={styles.image}
                    transition={150}
                  />
                )}
              </Animated.View>
            </GestureDetector>
          ) : (
            <View style={styles.unavailable}>
              <Ionicons color="#83918D" name="image-outline" size={48} />
              <Text style={styles.unavailableText}>No product image</Text>
            </View>
          )}

          {hasPrevious ? (
            <Pressable
              accessibilityLabel="Previous image"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => moveTo(currentIndex - 1)}
              style={({ pressed }) => [styles.previousButton, pressed && styles.controlPressed]}
            >
              <Ionicons color="#FFFFFF" name="chevron-back" size={26} />
            </Pressable>
          ) : null}
          {hasNext ? (
            <Pressable
              accessibilityLabel="Next image"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => moveTo(currentIndex + 1)}
              style={({ pressed }) => [styles.nextButton, pressed && styles.controlPressed]}
            >
              <Ionicons color="#FFFFFF" name="chevron-forward" size={26} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.hint}>Pinch, pan or double-tap to zoom</Text>
          <View accessibilityLabel="Zoom controls" style={styles.zoomControls}>
            <Pressable
              accessibilityLabel="Zoom out"
              accessibilityRole="button"
              onPress={() => animateToScale(scale.value - ZOOM_STEP)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.controlPressed]}
            >
              <Ionicons color="#FFFFFF" name="remove" size={24} />
            </Pressable>
            <Pressable
              accessibilityLabel="Reset zoom"
              accessibilityRole="button"
              onPress={() => resetZoom()}
              style={({ pressed }) => [styles.resetButton, pressed && styles.controlPressed]}
            >
              <Text style={styles.resetText}>1×</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Zoom in"
              accessibilityRole="button"
              onPress={() => animateToScale(scale.value + ZOOM_STEP)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.controlPressed]}
            >
              <Ionicons color="#FFFFFF" name="add" size={24} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050807',
  },
  header: {
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  counter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  viewer: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomCanvas: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  unavailable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  unavailableText: {
    color: '#AAB5B1',
    fontSize: 14,
    fontWeight: '600',
  },
  previousButton: {
    position: 'absolute',
    left: 14,
    top: '50%',
    width: 46,
    height: 46,
    marginTop: -23,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  nextButton: {
    position: 'absolute',
    right: 14,
    top: '50%',
    width: 46,
    height: 46,
    marginTop: -23,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    color: '#AAB5B1',
    fontSize: 12,
    textAlign: 'center',
  },
  zoomControls: {
    minHeight: 52,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    minWidth: 46,
    height: 40,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  controlPressed: {
    opacity: 0.58,
  },
});
