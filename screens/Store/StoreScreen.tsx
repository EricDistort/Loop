import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import ScreenWrapper from '../../utils/ScreenWrapper';
import { moderateScale as ms } from 'react-native-size-matters';

// --- CUSTOM COMPONENT IMPORTS ---
import GreetingScreen from './GreetingScreen';
import BannersContainer from './BannersContainer';
// 1. IMPORT THE TYPE HERE
import AllProducts, { Product } from './AllProducts'; 

// --- CONSTANTS ---
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SECTION_1_HEIGHT = SCREEN_HEIGHT * 0.25;
const SECTION_2_HEIGHT = SCREEN_HEIGHT * 0.25;

// 2. DELETED LOCAL TYPE DEFINITION (It is now imported)

export default function StoreProductsScreen({ navigation }: any) {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // --- ANIMATION VALUE ---
  const scrollY = useRef(new Animated.Value(0)).current;

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchProducts();
  }, [user?.store_id]);

  const fetchProducts = async () => {
    if (!user?.store_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_products')
        .select(
          `
            stock_quantity,
            products ( id, name, brand, description, price, image_url ) 
          `, 
          // 3. ADDED 'brand' TO THE QUERY ABOVE ^^^
        )
        .eq('store_id', user.store_id);

      if (error) throw error;

      const formatted = data.map((item: any) => ({
        id: item.products.id,
        name: item.products.name,
        brand: item.products.brand, // Now this data will actually exist
        description: item.products.description,
        price: item.products.price,
        image_url: item.products.image_url,
        stock_quantity: item.stock_quantity,
      }));

      setProducts(formatted);
    } catch (error: any) {
      console.error('Error products:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- ANIMATION INTERPOLATION ---
  const translateOne = scrollY.interpolate({
    inputRange: [-1, 0, SECTION_1_HEIGHT, SECTION_1_HEIGHT + 1],
    outputRange: [0, 0, SECTION_1_HEIGHT, SECTION_1_HEIGHT],
  });

  const scaleOne = scrollY.interpolate({
    inputRange: [0, SECTION_1_HEIGHT],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const translateTwo = scrollY.interpolate({
    inputRange: [
      -1,
      SECTION_1_HEIGHT,
      SECTION_1_HEIGHT + SECTION_2_HEIGHT,
      SECTION_1_HEIGHT + SECTION_2_HEIGHT + 1,
    ],
    outputRange: [0, 0, SECTION_2_HEIGHT, SECTION_2_HEIGHT],
  });

  return (
    <ScreenWrapper>
      <StatusBar barStyle="light-content" />
      <View style={styles.mainContainer}>
        <Animated.ScrollView
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
        >
          {/* --- CONTAINER 1 (Greeting) --- */}
          <Animated.View
            style={[
              styles.sectionContainer,
              {
                height: SECTION_1_HEIGHT,
                zIndex: 1,
                transform: [{ translateY: translateOne }, { scale: scaleOne }],
              },
            ]}
          >
            <GreetingScreen />
          </Animated.View>

          {/* --- CONTAINER 2 (Banners) --- */}
          <Animated.View
            style={[
              styles.sectionContainer,
              {
                height: SECTION_2_HEIGHT,
                zIndex: 2,
                transform: [{ translateY: translateTwo }],
              },
            ]}
          >
            <BannersContainer />
          </Animated.View>

          {/* --- CONTAINER 3: ALL PRODUCTS --- */}
          <View style={styles.whiteContainer}>
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#00c6ff"
                style={{ marginTop: 50 }}
              />
            ) : (
              <AllProducts
                products={products}
                user={user}
                navigation={navigation}
              />
            )}
            <View style={{ height: 100 }} />
          </View>
        </Animated.ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sectionContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  whiteContainer: {
    minHeight: SCREEN_HEIGHT,
    backgroundColor: '#ffffffff',
    zIndex: 3,
    marginTop: -20,
    paddingTop: ms(20),
    paddingHorizontal: ms(15),
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
  },
});