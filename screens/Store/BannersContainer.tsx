import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../utils/supabaseClient';
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

  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);

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

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= banners.length) nextIndex = 0;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setActiveIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, banners]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#ff00ff" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Banner }) => (
    <View style={styles.slide}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('BannerDetailsScreen', {
            image: item.image_url,
            title: item.title,
            description: item.body_text,
          })
        }
        style={styles.imageContainer}
      >
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
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
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: vs(200),
    width: '100%',
    backgroundColor: 'transparent',
    marginTop: vs(-50),
  },
  loadingContainer: {
    height: vs(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(15),
  },
  imageContainer: {
    width: '100%',
    height: '80%',
    borderRadius: ms(30),
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: '#ffffffff',
        shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: { width: 0, height: vs(1) },
    shadowOpacity: 1,
    shadowRadius: ms(10),
    elevation: 15,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
