import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadow } from '@/constants/theme';
import { assetUrl } from '@/services/martnow';
import type { ProductImage } from '@/types/api';

import { ImageZoomModal } from './ImageZoomModal';

interface GalleryImage {
  key: string;
  uri: string;
}

export interface ProductImageGalleryProps {
  productName: string;
  primaryImage?: string | null;
  images?: readonly ProductImage[];
  category?: string | null;
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
}

interface GallerySlideProps {
  image: GalleryImage;
  index: number;
  total: number;
  width: number;
  productName: string;
  onExpand: (index: number) => void;
}

function GallerySlide({ image, index, total, width, productName, onExpand }: GallerySlideProps) {
  const [failed, setFailed] = useState(false);

  return (
    <Pressable
      accessibilityHint="Opens the full-screen image viewer"
      accessibilityLabel={`${productName}, image ${index + 1} of ${total}`}
      accessibilityRole="imagebutton"
      onPress={() => onExpand(index)}
      style={({ pressed }) => [styles.slide, { width }, pressed && styles.slidePressed]}
    >
      {failed ? (
        <View style={styles.imageFallback}>
          <Ionicons color={colors.muted} name="image-outline" size={45} />
          <Text style={styles.imageFallbackText}>Image unavailable</Text>
        </View>
      ) : (
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          cachePolicy="memory-disk"
          contentFit="contain"
          draggable={false}
          onError={() => setFailed(true)}
          source={{ uri: image.uri }}
          style={styles.productImage}
          transition={180}
        />
      )}
    </Pressable>
  );
}

export function ProductImageGallery({
  productName,
  primaryImage,
  images = [],
  category,
  aspectRatio = 1,
  style,
}: ProductImageGalleryProps) {
  const { width: windowWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<GalleryImage>>(null);
  const thumbnailRef = useRef<ScrollView>(null);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  const galleryImages = useMemo(() => {
    const seen = new Set<string>();
    const result: GalleryImage[] = [];
    const paths = [primaryImage, ...images.map((image) => image.path)];

    paths.forEach((path, index) => {
      const uri = assetUrl(path);
      if (!uri || seen.has(uri)) return;
      seen.add(uri);
      result.push({ key: `${index}-${uri}`, uri });
    });

    return result;
  }, [images, primaryImage]);

  const measuredWidth = galleryWidth || Math.max(1, windowWidth);
  const safeAspectRatio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
  const imageUris = useMemo(() => galleryImages.map((image) => image.uri), [galleryImages]);

  const revealThumbnail = useCallback(
    (index: number, animated = true) => {
      const thumbnailWidth = 68;
      const centeredOffset = index * thumbnailWidth - measuredWidth / 2 + thumbnailWidth / 2;
      thumbnailRef.current?.scrollTo({ x: Math.max(0, centeredOffset), animated });
    },
    [measuredWidth],
  );

  const selectImage = useCallback(
    (index: number, animated = true) => {
      if (!galleryImages.length) return;
      const safeIndex = Math.min(Math.max(index, 0), galleryImages.length - 1);
      setActiveIndex(safeIndex);
      listRef.current?.scrollToOffset({ offset: safeIndex * measuredWidth, animated });
      revealThumbnail(safeIndex, animated);
    },
    [galleryImages.length, measuredWidth, revealThumbnail],
  );

  useEffect(() => {
    const safeIndex = Math.min(activeIndex, Math.max(galleryImages.length - 1, 0));
    if (safeIndex !== activeIndex) setActiveIndex(safeIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: safeIndex * measuredWidth, animated: false });
      revealThumbnail(safeIndex, false);
    });
  }, [activeIndex, galleryImages.length, measuredWidth, revealThumbnail]);

  const openViewer = useCallback((index: number) => {
    setZoomIndex(index);
    setZoomVisible(true);
  }, []);

  const updateIndexFromScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!measuredWidth || galleryImages.length < 2) return;
      const nextIndex = Math.min(
        Math.max(Math.round(event.nativeEvent.contentOffset.x / measuredWidth), 0),
        galleryImages.length - 1,
      );
      setActiveIndex(nextIndex);
      revealThumbnail(nextIndex);
    },
    [galleryImages.length, measuredWidth, revealThumbnail],
  );

  const onGalleryLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0) setGalleryWidth(nextWidth);
  }, []);

  const renderImage = useCallback(
    ({ item, index }: { item: GalleryImage; index: number }) => (
      <GallerySlide
        image={item}
        index={index}
        onExpand={openViewer}
        productName={productName}
        total={galleryImages.length}
        width={measuredWidth}
      />
    ),
    [galleryImages.length, measuredWidth, openViewer, productName],
  );

  const syncFromZoom = useCallback(
    (index: number) => {
      setZoomIndex(index);
      selectImage(index);
    },
    [selectImage],
  );

  return (
    <View style={[styles.root, style]}>
      <View
        onLayout={onGalleryLayout}
        style={[styles.galleryFrame, { aspectRatio: safeAspectRatio }]}
      >
        {galleryImages.length ? (
          <FlatList
            accessibilityLabel={`${productName} product images`}
            bounces={false}
            data={galleryImages}
            decelerationRate="fast"
            directionalLockEnabled
            getItemLayout={(_, index) => ({
              length: measuredWidth,
              offset: measuredWidth * index,
              index,
            })}
            horizontal
            keyExtractor={(item) => item.key}
            onMomentumScrollEnd={updateIndexFromScroll}
            onScrollEndDrag={updateIndexFromScroll}
            pagingEnabled
            ref={listRef}
            renderItem={renderImage}
            scrollEnabled={galleryImages.length > 1}
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            snapToInterval={measuredWidth}
            windowSize={3}
          />
        ) : (
          <View
            accessibilityLabel={`${productName}, no product image`}
            style={styles.imageFallback}
          >
            <View style={styles.fallbackMark}>
              <Text style={styles.fallbackMarkText}>M</Text>
            </View>
            <Text style={styles.imageFallbackText}>No image available</Text>
          </View>
        )}

        {category ? (
          <View pointerEvents="none" style={styles.categoryBadge}>
            <Text numberOfLines={1} style={styles.categoryText}>
              {category}
            </Text>
          </View>
        ) : null}

        {galleryImages.length ? (
          <View pointerEvents="none" style={styles.expandBadge}>
            <Ionicons color={colors.ink} name="expand-outline" size={18} />
          </View>
        ) : null}

        {galleryImages.length > 1 && activeIndex > 0 ? (
          <Pressable
            accessibilityLabel="Previous product image"
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => selectImage(activeIndex - 1)}
            style={({ pressed }) => [styles.previousButton, pressed && styles.controlPressed]}
          >
            <Ionicons color={colors.ink} name="chevron-back" size={21} />
          </Pressable>
        ) : null}

        {galleryImages.length > 1 && activeIndex < galleryImages.length - 1 ? (
          <Pressable
            accessibilityLabel="Next product image"
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => selectImage(activeIndex + 1)}
            style={({ pressed }) => [styles.nextButton, pressed && styles.controlPressed]}
          >
            <Ionicons color={colors.ink} name="chevron-forward" size={21} />
          </Pressable>
        ) : null}
      </View>

      {galleryImages.length > 1 ? (
        <View style={styles.galleryNavigation}>
          <View
            accessibilityLabel={`Image ${activeIndex + 1} of ${galleryImages.length}`}
            accessibilityLiveRegion="polite"
            style={styles.dots}
          >
            {galleryImages.map((image, index) => (
              <View
                key={`dot-${image.key}`}
                style={[styles.dot, index === activeIndex && styles.activeDot]}
              />
            ))}
          </View>

          <ScrollView
            contentContainerStyle={styles.thumbnails}
            horizontal
            ref={thumbnailRef}
            showsHorizontalScrollIndicator={false}
          >
            {galleryImages.map((image, index) => {
              const selected = index === activeIndex;
              return (
                <Pressable
                  accessibilityLabel={`Show image ${index + 1} of ${galleryImages.length}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={`thumb-${image.key}`}
                  onPress={() => selectImage(index)}
                  style={({ pressed }) => [
                    styles.thumbnailButton,
                    selected && styles.selectedThumbnail,
                    pressed && styles.controlPressed,
                  ]}
                >
                  <Image
                    accessibilityIgnoresInvertColors
                    accessible={false}
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    source={{ uri: image.uri }}
                    style={styles.thumbnailImage}
                    transition={100}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <ImageZoomModal
        imageLabel={productName}
        images={imageUris}
        initialIndex={zoomIndex}
        onClose={() => setZoomVisible(false)}
        onIndexChange={syncFromZoom}
        visible={zoomVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: 12,
  },
  galleryFrame: {
    width: '100%',
    minHeight: 240,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  slide: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slidePressed: {
    opacity: 0.9,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.mint,
  },
  imageFallbackText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  fallbackMark: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tealSoft,
  },
  fallbackMarkText: {
    color: colors.teal,
    fontSize: 40,
    fontWeight: '900',
  },
  categoryBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    maxWidth: '58%',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  categoryText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '800',
  },
  expandBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  previousButton: {
    position: 'absolute',
    left: 12,
    top: '50%',
    width: 42,
    height: 42,
    marginTop: -21,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  nextButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    width: 42,
    height: 42,
    marginTop: -21,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  galleryNavigation: {
    gap: 10,
  },
  dots: {
    minHeight: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 18,
    backgroundColor: colors.teal,
  },
  thumbnails: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  thumbnailButton: {
    width: 60,
    height: 60,
    padding: 3,
    overflow: 'hidden',
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selectedThumbnail: {
    borderColor: colors.teal,
    borderWidth: 2.5,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
    backgroundColor: colors.mint,
  },
  controlPressed: {
    opacity: 0.62,
  },
});
