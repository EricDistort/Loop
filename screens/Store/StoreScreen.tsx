import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import ScreenWrapper from '../../utils/ScreenWrapper';
import { moderateScale as ms, verticalScale as vs, scale as s } from 'react-native-size-matters';
import PopButton from '../../utils/PopButton'; // Adjust path

// --- CUSTOM COMPONENT IMPORTS ---
import GreetingScreen from './GreetingScreen';
import BannersContainer from './BannersContainer';
import AllProducts, { Product } from './AllProducts'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SECTION_1_HEIGHT = SCREEN_HEIGHT * 0.25;
const SECTION_2_HEIGHT = SCREEN_HEIGHT * 0.25;

export default function StoreProductsScreen({ navigation }: any) {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // [NEW] Lifted state
  const [hasItemsInCart, setHasItemsInCart] = useState(false);

  // --- ANIMATION VALUE ---
  const scrollY = useRef(new Animated.Value(0)).current;

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchProducts();
    fetchCartStatus();
  }, [user?.store_id]);

  const fetchProducts = async () => {
    if (!user?.store_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_products')
        .select(
          `stock_quantity, products ( id, name, brand, description, price, image_url, category )`
        )
        .eq('store_id', user.store_id);

      if (error) throw error;

      const formatted = data.map((item: any) => ({
        id: item.products.id,
        name: item.products.name,
        brand: item.products.brand,
        description: item.products.description,
        price: item.products.price,
        image_url: item.products.image_url,
        category: item.products.category,
        stock_quantity: item.stock_quantity,
      }));

      setProducts(formatted);
    } catch (error: any) {
      console.error('Error products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartStatus = async () => {
    if (!user?.id || !user?.store_id) return;
    try {
      const { count } = await supabase
        .from('cart_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('store_id', user.store_id);
      setHasItemsInCart((count || 0) > 0);
    } catch (e) { console.error(e); }
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
          // [NEW] Index 2 is the StickyHeaderContainer
          stickyHeaderIndices={[2]} 
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

          {/* --- CONTAINER 3: STICKY HEADER (Dynamic Island) --- */}
          <View style={styles.stickyHeaderContainer}>
            <View style={styles.searchIsland}>
              {/* Input */}
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {/* Clear Icon */}
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}

              {/* Cart Button */}
              <PopButton
                style={styles.headerCartBtn}
                onPress={() => navigation.navigate('Cart')}
              >
                <Image
                  source={require('../StoreMedia/Cart.png')}
                  style={styles.cartIcon}
                />
                {hasItemsInCart && <View style={styles.cartBadge} />}
              </PopButton>
            </View>
          </View>

          {/* --- CONTAINER 4: ALL PRODUCTS --- */}
          <View style={styles.contentContainer}>
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
                searchQuery={searchQuery} // Pass props down
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
  
  // --- STICKY HEADER STYLES ---
  stickyHeaderContainer: {
    height: vs(70), // Enough height for the rounded top and spacing
    width: '100%',
    backgroundColor: '#ffffffff', // White background creates the overlap effect
    //marginTop: -10, // Pulls it up over the banners
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    zIndex: 100, // Stays on top
    justifyContent: 'center',
    alignItems: 'center',
    //paddingTop: vs(10),
    paddingHorizontal: ms(20),
    top: -25,
    //overflow: 'hidden',
  },
  // The Dynamic Island itself
  searchIsland: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbf2ffff', // Black background
    borderRadius: ms(25),
    borderWidth: 3,
    borderColor: '#ffffff', // White border
    height: vs(45),
    width: '100%',
    paddingHorizontal: ms(15),
    shadowColor: '#5f0077ff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    alignSelf: 'center',
    top: vs(15),
  },
  searchInput: {
    flex: 1,
    color: '#333',
    fontSize: ms(14),
    fontWeight: '600',
    height: '100%',
  },
  clearIcon: {
    color: '#888',
    fontSize: ms(14),
    fontWeight: 'bold',
    marginLeft: ms(5),
    padding: ms(5),
  },
  headerCartBtn: {
    backgroundColor: '#6c008dff', 
    height: vs(30),
    width: vs(30),
    borderRadius: ms(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    width: ms(16),
    height: ms(16),
    resizeMode: 'contain',
    tintColor: 'white',
  },
  cartBadge: {
    position: 'absolute',
    top: -ms(2),
    right: -ms(2),
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    backgroundColor: '#ff00c8ff', 
    borderWidth: 1.5,
    borderColor: 'white',
  },

  // --- CONTENT CONTAINER ---
  contentContainer: {
    minHeight: SCREEN_HEIGHT,
    backgroundColor: '#ffffffff',
    zIndex: 3,
    marginTop: -25,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    //paddingTop: vs(15),
    // Note: No top radius or margin here because the StickyHeader handles the visual top
  },
});