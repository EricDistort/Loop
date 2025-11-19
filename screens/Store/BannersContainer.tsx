import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient'; // Adjust path as needed
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Banner = {
  id: number;
  title: string;
  body_text: string;
  image_url: string;
};

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  // 1. Fetch Banners
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setBanners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Auto Scroll Logic (Every 3 Seconds)
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;

      // If we reach the end, go back to 0
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }

      // Scroll to the next item
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setActiveIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, banners]);

  // Handle manual scroll updates (optional, keeps state in sync if user swipes)
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  // Render Loading State
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#ff00ff" />
      </View>
    );
  }

  // Render Item
  const renderItem = ({ item }: { item: Banner }) => (
    <View style={styles.slide}>
      <ImageBackground
        source={{ uri: item.image_url }}
        style={styles.imageBackground}
        imageStyle={{ borderRadius: 0 }} // Images fill the container exactly
      >
        {/* Dark Overlay for text readability */}
        <View style={styles.overlay}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.bodyText} numberOfLines={2}>
              {item.body_text}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        // Ensure FlatList knows the layout to scroll accurately
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Optional: Pagination Dots */}
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === activeIndex ? '#ff00ff' : 'rgba(255,255,255,0.3)',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end', // Push text to bottom
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent black
    padding: ms(15),
    width: '100%',
    paddingBottom: vs(20),
  },
  textContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff00ff', // Neon pink accent
    paddingLeft: ms(10),
  },
  title: {
    fontSize: ms(20),
    fontWeight: '900',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: vs(4),
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  bodyText: {
    fontSize: ms(12),
    color: '#ddd',
    fontWeight: '500',
  },
  pagination: {
    position: 'absolute',
    bottom: vs(10),
    right: ms(20),
    flexDirection: 'row',
  },
  dot: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    marginLeft: s(6),
  },
});
