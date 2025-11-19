import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import ScreenWrapper from '../../utils/ScreenWrapper';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

// --- CUSTOM COMPONENT IMPORTS ---
// Make sure these files exist in your components folder
import GreetingScreen from './GreetingScreen';
import BannersContainer from './BannersContainer';

// --- CONSTANTS ---
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Container 1 & 2 take up 50% of screen together
const SECTION_1_HEIGHT = SCREEN_HEIGHT * 0.25;
const SECTION_2_HEIGHT = SCREEN_HEIGHT * 0.25;

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
};

export default function StoreProductsScreen({ navigation }: any) {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // --- ANIMATION VALUE ---
  const scrollY = useRef(new Animated.Value(0)).current;

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchProducts();
  }, [user?.store_id]); // Re-fetch if store_id changes

  const fetchProducts = async () => {
    if (!user?.store_id) return;
    setLoading(true);
    try {
      // Pull products specific to the user's selected store
      const { data, error } = await supabase
        .from('store_products')
        .select(
          `
          stock_quantity,
          products (
            id, name, description, price, image_url
          )
        `,
        )
        .eq('store_id', user.store_id);

      if (error) throw error;

      // Format data for easier usage
      const formatted = data.map((item: any) => ({
        id: item.products.id,
        name: item.products.name,
        description: item.products.description,
        price: item.products.price,
        image_url: item.products.image_url,
        stock_quantity: item.stock_quantity,
      }));

      setProducts(formatted);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Could not load products');
    } finally {
      setLoading(false);
    }
  };

  // --- CART LOGIC ---
  const addToCart = async (product: Product) => {
    if (!user) return;
    try {
      // Check if item exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .eq('store_id', user.store_id)
        .maybeSingle();

      if (existingItem) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
      } else {
        // Insert new item
        await supabase.from('cart_items').insert([
          {
            user_id: user.id,
            product_id: product.id,
            store_id: user.store_id,
            quantity: 1,
          },
        ]);
      }
      Alert.alert('Success', 'Added to cart!');
    } catch (error: any) {
      Alert.alert('Error adding to cart', error.message);
    }
  };

  // --- ANIMATION INTERPOLATION LOGIC ---

  // 1. Container 1: Sticks to top, scales down slightly
  const translateOne = scrollY.interpolate({
    inputRange: [-1, 0, SECTION_1_HEIGHT, SECTION_1_HEIGHT + 1],
    outputRange: [0, 0, SECTION_1_HEIGHT, SECTION_1_HEIGHT],
  });

  const scaleOne = scrollY.interpolate({
    inputRange: [0, SECTION_1_HEIGHT],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // 2. Container 2: Slides over Container 1, then sticks
  const translateTwo = scrollY.interpolate({
    inputRange: [
      -1,
      SECTION_1_HEIGHT,
      SECTION_1_HEIGHT + SECTION_2_HEIGHT,
      SECTION_1_HEIGHT + SECTION_2_HEIGHT + 1,
    ],
    outputRange: [0, 0, SECTION_2_HEIGHT, SECTION_2_HEIGHT],
  });

  // --- RENDER ITEM HELPER ---
  const renderProductCard = (item: Product) => (
    <View key={item.id} style={styles.card}>
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <Text style={styles.stock}>Stock: {item.stock_quantity}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => addToCart(item)}
          >
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#00c6ffaa' }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.buttonText}>Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
          {/* --- CONTAINER 1: GREETINGS --- */}
          <Animated.View
            style={[
              styles.sectionContainer,
              {
                height: SECTION_1_HEIGHT,
                backgroundColor: '#111',
                zIndex: 1, // Bottom Layer
                elevation: 1,
                // Animation Styles
                transform: [{ translateY: translateOne }, { scale: scaleOne }],
                borderBottomWidth: 1,
                borderColor: '#00c6ff33',
              },
            ]}
          >
            {/* No props needed, pulls from Context internally */}
            <GreetingScreen />
          </Animated.View>

          {/* --- CONTAINER 2: FEATURED ITEMS --- */}
          <Animated.View
            style={[
              styles.sectionContainer,
              {
                height: SECTION_2_HEIGHT,
                backgroundColor: '#1a1a1a',
                zIndex: 2, // Middle Layer (Covers #1)
                elevation: 2,
                // Animation Styles
                transform: [{ translateY: translateTwo }],
                borderBottomWidth: 1,
                borderColor: '#ff00ff33',
              },
            ]}
          >
            {/* Needs storeId to fetch specific featured items */}
            <BannersContainer />
          </Animated.View>

          {/* --- CONTAINER 3: ALL PRODUCTS --- */}
          <View
            style={[
              styles.sectionContainer,
              {
                minHeight: SCREEN_HEIGHT, // Ensures scrollability
                backgroundColor: 'black',
                zIndex: 3, // Top Layer (Covers #1 & #2)
                elevation: 3,
                paddingTop: ms(20),
                justifyContent: 'flex-start',
              },
            ]}
          >
            <Text style={styles.productListTitle}>ALL PRODUCTS</Text>

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#00c6ff"
                style={{ marginTop: 50 }}
              />
            ) : (
              <View style={{ width: '100%', paddingHorizontal: ms(10) }}>
                {products.length > 0 ? (
                  products.map(renderProductCard)
                ) : (
                  <Text
                    style={{
                      color: 'white',
                      textAlign: 'center',
                      marginTop: 20,
                    }}
                  >
                    No products found for this store.
                  </Text>
                )}
                {/* Spacer for bottom safety */}
                <View style={{ height: 100 }} />
              </View>
            )}
          </View>
        </Animated.ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  sectionContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  productListTitle: {
    fontSize: ms(22),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: vs(20),
    alignSelf: 'center',
  },
  // --- CARD STYLES ---
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: ms(12),
    marginBottom: vs(15),
    padding: ms(10),
    borderWidth: 1,
    borderColor: '#00c6ff33',
    width: '100%',
  },
  image: {
    width: s(90),
    height: s(90),
    borderRadius: ms(8),
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
    marginLeft: ms(12),
    justifyContent: 'space-between',
  },
  name: {
    fontSize: ms(16),
    fontWeight: 'bold',
    color: '#00c6ff',
  },
  desc: {
    fontSize: ms(12),
    color: '#bbb',
  },
  price: {
    fontSize: ms(15),
    color: '#ff00ff',
    fontWeight: 'bold',
  },
  stock: {
    fontSize: ms(12),
    color: '#00ff00',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(5),
  },
  button: {
    backgroundColor: '#ff00ffbd',
    paddingVertical: vs(5),
    paddingHorizontal: s(12),
    borderRadius: ms(6),
    alignItems: 'center',
    flex: 0.48,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: ms(12),
  },
});
