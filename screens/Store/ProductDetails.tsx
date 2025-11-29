import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { supabase } from '../../utils/supabaseClient';
import LinearGradient from 'react-native-linear-gradient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

// 1. IMPORT POP BUTTON
import PopButton from '../../utils/PopButton';

// Type Definitions
type Product = {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  image_url: string;
  secondimage_url?: string;
  thirdimage_url?: string;
  stock_quantity: number;
  category?: string;
};

type User = {
  id: string;
  store_id: string;
};

// Replace with actual path
const successAnimation = require('../StoreMedia/Success.json');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- CONSTANTS ---
const IMAGE_WIDTH = s(300);
const GAP = s(15); // Adjust gap size here
const SNAP_INTERVAL = IMAGE_WIDTH + GAP;

export default function ProductDetails({ route, navigation }: any) {
  const { product, user } = route.params as { product: Product; user: User };
  const [quantity, setQuantity] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [hasItemsInCart, setHasItemsInCart] = useState(false);
  const animationRef = useRef<LottieView>(null);

  // --- SLIDER LOGIC START ---
  const flatListRef = useRef<FlatList>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine images and filter out nulls/undefined/empty strings
  const slideImages = [
    product.image_url,
    product.secondimage_url,
    product.thirdimage_url,
  ].filter((url): url is string => !!url && url.trim() !== '');

  useEffect(() => {
    // Only auto-slide if we have more than 1 image
    if (slideImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % slideImages.length;

        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5, // Centers the item in the view
        });

        return nextIndex;
      });
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [slideImages.length]);

  const onMomentumScrollEnd = (event: any) => {
    // Calculate index using the total stride (Width + Gap)
    const newIndex = Math.round(
      event.nativeEvent.contentOffset.x / SNAP_INTERVAL,
    );
    setCurrentIndex(newIndex);
  };
  // --- SLIDER LOGIC END ---

  const fetchCartStatus = async () => {
    if (!user?.id || !user?.store_id) {
      setHasItemsInCart(false);
      return;
    }
    try {
      const { count, error } = await supabase
        .from('cart_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('store_id', user.store_id);

      if (error) throw error;
      setHasItemsInCart((count || 0) > 0);
    } catch (e) {
      console.error('Error fetching cart status:', e);
      setHasItemsInCart(false);
    }
  };

  useEffect(() => {
    fetchCartStatus();
    const fetchRelatedProducts = async () => {
      if (!user?.store_id) return;
      const storeIdInt = parseInt(user.store_id, 10);
      if (isNaN(storeIdInt)) return;

      let categoryToSearch = product.category;
      if (!categoryToSearch) {
        try {
          const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select('category')
            .eq('id', product.id)
            .single();

          if (!prodError && prodData) {
            categoryToSearch = prodData.category;
          }
        } catch (err) {
          console.error('Error fetching missing category:', err);
        }
      }

      if (!categoryToSearch) return;

      try {
        const { data, error } = await supabase
          .from('store_products')
          .select(
            `
            stock_quantity,
            products!inner ( * ) 
          `,
          )
          .eq('store_id', storeIdInt)
          .eq('products.category', categoryToSearch)
          .neq('products.id', product.id)
          .limit(10);

        if (error) throw error;

        const formattedProducts = data
          .map((item: any) => {
            const prod = item.products;
            if (prod) {
              return {
                ...prod,
                stock_quantity: item.stock_quantity,
              };
            }
            return null;
          })
          .filter(item => item !== null);

        setRelatedProducts(formattedProducts as Product[]);
      } catch (error: any) {
        console.error('Error fetching related products:', error.message);
      }
    };

    fetchRelatedProducts();
  }, [user?.store_id, product.id, product.category]);

  const updateQuantity = (change: number) => {
    setQuantity(prev => Math.max(0, prev + change));
  };

  const addToCart = async () => {
    if (!user) return;
    const qtyToAdd = quantity === 0 ? 1 : quantity;

    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .eq('store_id', user.store_id)
        .maybeSingle();

      const finalNewQty = (existingItem?.quantity || 0) + qtyToAdd;

      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({ quantity: finalNewQty })
          .eq('id', existingItem.id);
      } else {
        await supabase.from('cart_items').insert([
          {
            user_id: user.id,
            product_id: product.id,
            store_id: user.store_id,
            quantity: qtyToAdd,
          },
        ]);
      }

      await fetchCartStatus();
      setShowSuccess(true);
      animationRef.current?.play();
      setTimeout(() => {
        setShowSuccess(false);
        setQuantity(0);
      }, 1500);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderRelatedProductCard = (item: Product) => (
    <PopButton
      key={item.id}
      style={styles.relatedCard}
      onPress={() =>
        navigation.push('ProductDetails', { product: item, user: user })
      }
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.relatedImage}
        resizeMode="cover"
      />
      <View style={styles.relatedInfoRow}>
        <View style={styles.relatedInfoLeft}>
          <Text style={styles.relatedName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.brand && (
            <Text style={styles.relatedBrand} numberOfLines={1}>
              {item.brand}
            </Text>
          )}
        </View>
        <Text style={styles.relatedPrice}>৳{item.price.toFixed(0)}</Text>
      </View>
    </PopButton>
  );

  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. LARGE IMAGE SLIDER */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatListRef}
            data={slideImages}
            horizontal
            showsHorizontalScrollIndicator={false}
            // --- GAPPING CONFIGURATION ---
            // 1. Disable paging to allow custom snap intervals
            pagingEnabled={false}
            // 2. Snap to (Image Width + Gap)
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="center"
            decelerationRate="fast"
            // 3. Render the gap
            ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
            // 4. Update layout calculation to include the gap
            getItemLayout={(_, index) => ({
              length: IMAGE_WIDTH,
              offset: SNAP_INTERVAL * index,
              index,
            })}
            // -----------------------------

            style={styles.flatListSlider}
            keyExtractor={(item, index) => index.toString()}
            onMomentumScrollEnd={onMomentumScrollEnd}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
          />
        </View>

        {/* DETAILS WRAPPER */}
        <View style={styles.detailsWrapper}>
          <View style={styles.headerRow}>
            {/* LEFT COLUMN */}
            <View style={styles.infoColumn}>
              <Text style={styles.title}>{product.name}</Text>
              {product.brand && (
                <Text style={styles.brand}>{product.brand}</Text>
              )}
              <Text style={styles.description}>
                {product.description ||
                  'No detailed description provided for this product.'}
              </Text>
            </View>

            {/* RIGHT COLUMN */}
            <View style={styles.actionColumn}>
              {/* Price Row with Pop Cart Button */}
              <View style={styles.priceRow}>
                <Text style={styles.price}>৳{product.price.toFixed(0)}</Text>

                {/* POP BUTTON: Cart */}
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

              {/* POP BUTTON: Add To Cart WITH GRADIENT */}
              <PopButton style={styles.addBtn} onPress={addToCart}>
                <LinearGradient
                  colors={['#4c0079ff', '#a200b1ff']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flex: 1,
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={styles.addBtnText}>Buy Now</Text>
                </LinearGradient>
              </PopButton>

              {/* Counter Wrapper (Standard TouchableOpacity) */}
              <View style={styles.counterWrapper}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => updateQuantity(-1)}
                  disabled={quantity === 0}
                >
                  <Text
                    style={[
                      styles.counterSymbol,
                      { opacity: quantity === 0 ? 0.3 : 1 },
                    ]}
                  >
                    -
                  </Text>
                </TouchableOpacity>

                <Text style={styles.counterText}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => updateQuantity(1)}
                >
                  <Text style={styles.counterSymbol}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* --- RELATED PRODUCTS HORIZONTAL SCROLL --- */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedProductsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedProducts.map(renderRelatedProductCard)}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* LOTTIE OVERLAY */}
      {showSuccess && (
        <View style={styles.lottieOverlay}>
          <LottieView
            ref={animationRef}
            source={successAnimation}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  scrollContent: {
    paddingBottom: vs(50),
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: vs(25),
    marginBottom: vs(15),
  },
  flatListSlider: {
    // Width must be slightly constrained or flexible.
    // Since we are centering it, limiting width to just the image helps ensure alignment,
    // but for gaps to work with snapToInterval properly, flexGrow: 0 is safest.
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH,
    flexGrow: 0,
    overflow: 'visible', // Allows the next image (gap) to be seen if desired
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH,
    borderRadius: ms(60),
  },
  detailsWrapper: {
    paddingHorizontal: ms(20),
    backgroundColor: 'transparent',
    flex: 1,
    //marginBottom: vs(10),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(15),
  },
  infoColumn: {
    flex: 2,
    paddingRight: ms(15), // Ensure text doesn't hit buttons
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#3b004eff',
    //marginBottom: vs(2),
  },
  brand: {
    fontSize: ms(16),
    fontWeight: '600',
    color: '#8f7297ff ',
    marginBottom: vs(7),
  },
  description: {
    fontSize: ms(14),
    color: '#444',
    lineHeight: ms(22),
  },
  actionColumn: {
    flex: 1.3, // Slightly wider to fit buttons comfortably
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    gap: vs(5),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: ms(8),
  },
  headerCartBtn: {
    backgroundColor: '#6c008dff',
    height: s(28),
    width: s(28),
    borderRadius: s(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    width: s(14),
    height: s(14),
    resizeMode: 'contain',
    tintColor: 'white',
  },
  cartBadge: {
    position: 'absolute',
    top: -ms(2),
    right: -ms(2),
    width: s(10),
    height: s(10),
    borderRadius: s(5),
    backgroundColor: '#ff00c8ff',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  price: {
    fontSize: ms(24),
    color: '#340052ff',
    fontWeight: '900',
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#34005218',
    borderRadius: ms(15),
    height: vs(30),
    width: s(120),
  },
  counterBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  counterSymbol: {
    fontSize: ms(20),
    color: '#555',
    fontWeight: '900',
  },
  counterText: {
    fontSize: ms(16),
    fontWeight: '900',
    color: '#333',
    minWidth: s(20),
    textAlign: 'center',
  },
  addBtn: {
    height: vs(30),
    width: s(120),
    borderRadius: ms(15),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#340052',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    marginVertical: vs(2),
    overflow: 'hidden',
    //padding: 0,
  },
  addBtnText: {
    color: 'white',
    fontSize: ms(15),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lottieOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lottie: {
    width: s(250),
    height: s(250),
  },
  relatedProductsContainer: {
    //marginTop: vs(10), // Removed negative margin for layout safety
    backgroundColor: 'transparent',
    height: s(220),
    marginTop: vs(-15),
    //paddingVertical: vs(10),
  },
  relatedHeaderTitle: {
    fontSize: ms(18),
    fontWeight: '700',
    color: '#3b004eff',
    marginLeft: ms(20),
    marginBottom: vs(10),
  },
  relatedCard: {
    width: s(130),
    marginRight: ms(10),
    marginLeft: ms(5),
    backgroundColor: '#64008b10',
    borderRadius: ms(15),
    borderTopStartRadius: ms(25),
    borderTopEndRadius: ms(25),
    overflow: 'hidden',
    paddingBottom: vs(8),
  },
  relatedImage: {
    width: s(130), // Matches card width exactly
    height: s(130), // Square aspect ratio
    marginBottom: vs(5),
    borderRadius: ms(25),
    alignSelf: 'center',
  },
  relatedInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: ms(8),
  },
  relatedInfoLeft: {
    flex: 1,
    marginRight: ms(2),
  },
  relatedName: {
    fontSize: ms(13),
    fontWeight: '700',
    color: '#562e63ff',
  },
  relatedBrand: {
    fontSize: ms(11),
    color: '#8f7896ff',
  },
  relatedPrice: {
    fontSize: ms(13),
    fontWeight: 'bold',
    color: '#340052ff',
  },
});
