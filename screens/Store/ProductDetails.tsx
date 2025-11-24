import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { supabase } from '../../utils/supabaseClient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

// Type Definitions
type Product = {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
};

type User = {
  id: string;
  store_id: string;
};

// Replace with actual path
const successAnimation = require('../StoreMedia/Confirmed.json');

export default function ProductDetails({ route, navigation }: any) {
  const { product, user } = route.params as { product: Product; user: User };

  const [quantity, setQuantity] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const animationRef = useRef<LottieView>(null);

  // --- FETCH RELATED PRODUCTS (FIXED QUERY) ---
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!user?.store_id) return;

      const storeIdInt = parseInt(user.store_id, 10);
      if (isNaN(storeIdInt)) return;

      try {
        // 1. Query 'store_products' table (which HAS store_id)
        const { data, error } = await supabase
          .from('store_products')
          .select(
            `
            stock_quantity,
            products ( * ) 
          `,
          )
          .eq('store_id', storeIdInt)
          // 2. Filter out the current product using the joined relationship
          .neq('products.id', product.id)
          .limit(10);

        if (error) throw error;

        // 3. Flatten the nested data structure:
        // From: { stock_quantity: 50, products: { id: 1, name: '...' } }
        // To:   { id: 1, name: '...', stock_quantity: 50 }
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
  }, [user?.store_id, product.id]);

  // --- QUANTITY HANDLER ---
  const updateQuantity = (change: number) => {
    setQuantity(prev => Math.max(0, prev + change));
  };

  // --- CART LOGIC ---
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

  // --- RENDER RELATED PRODUCT CARD ---
  const renderRelatedProductCard = (item: Product) => (
    <TouchableOpacity
      key={item.id}
      style={styles.relatedCard}
      // Push to new screen so we can go back
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
        <Text style={styles.relatedPrice}>৳{item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. LARGE IMAGE */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            resizeMode="cover"
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
              <Text style={styles.price}>৳{product.price.toFixed(2)}</Text>

              <TouchableOpacity style={styles.addBtn} onPress={addToCart}>
                <Text style={styles.addBtnText}>ADD TO CART</Text>
              </TouchableOpacity>

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
    paddingBottom: vs(20),
  },
  imageContainer: {
    width: vs(300),
    height: vs(300),
    backgroundColor: '#ffffff04',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: vs(10),
    overflow: 'hidden',
  },
  image: {
    width: '90%',
    height: '90%',
    borderRadius: ms(60),
  },
  detailsWrapper: {
    paddingHorizontal: ms(20),
    backgroundColor: 'white',
    flex: 1,
    marginBottom: vs(10),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(15),
  },
  infoColumn: {
    flex: 2,
    paddingRight: ms(10),
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: ms(24),
    fontWeight: '900',
    color: '#333',
    marginBottom: vs(2),
  },
  brand: {
    fontSize: ms(16),
    fontWeight: '600',
    color: '#6c008dff',
  },
  description: {
    fontSize: ms(15),
    color: '#444',
    lineHeight: ms(24),
  },
  actionColumn: {
    flex: 1.2,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    gap: vs(5),
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
    borderRadius: ms(14),
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
    backgroundColor: '#340052ff',
    height: vs(30),
    width: s(120),
    borderRadius: ms(14),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#340052',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    marginVertical: vs(2),
  },
  addBtnText: {
    color: 'white',
    fontSize: ms(14),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lottieOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lottie: {
    width: ms(300),
    height: ms(300),
    borderRadius: ms(60),
    borderWidth: 5,
    borderColor: '#340052ff',
  },
  // --- NEW RELATED PRODUCTS STYLES ---
  relatedProductsContainer: {
    //paddingVertical: vs(10),
    marginTop: vs(-10),
    backgroundColor: '#ffffffff',
  },
  relatedTitle: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: ms(20),
    marginBottom: vs(10),
  },
  relatedCard: {
    width: s(140),
    marginRight: ms(10),
    marginLeft: ms(5),
    backgroundColor: '#64008b10',
    borderRadius: ms(15),
    borderTopStartRadius: ms(25),
    borderTopEndRadius: ms(25),
    overflow: 'hidden',
    paddingBottom: vs(5),
  
  },
  relatedImage: {
    width: vs(120),
    height: vs(120),
    marginBottom: vs(5),
    borderRadius: ms(25),
    alignSelf: 'center',
  },
  relatedInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: ms(8),
  },
  relatedInfoLeft: {
    flex: 1,
    marginRight: ms(5),
  },
  relatedName: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#333',
  },
  relatedBrand: {
    fontSize: ms(10),
    color: '#6c008dff',
  },
  relatedPrice: {
    fontSize: ms(13),
    fontWeight: 'bold',
    color: '#340052ff',
    
  },
});
