import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { supabase } from '../../utils/supabaseClient';
import LinearGradient from 'react-native-linear-gradient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

import PopButton from '../../utils/PopButton';

const successAnimation = require('../StoreMedia/Success.json');

type Product = {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  category?: string;
};

type User = {
  id: string;
  store_id: string;
};

export default function FullCatalog({ route, navigation }: any) {
  // 1. Destructure initialCategory from params (defaults to undefined)
  const {
    products: initialProducts,
    user,
    initialCategory,
  } = route.params as {
    products: Product[];
    user: User;
    initialCategory?: string;
  };

  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [itemQuantities, setItemQuantities] = useState<{
    [key: number]: number;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Initialize state with passed category, or fallback to 'All'
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || 'All',
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [hasItemsInCart, setHasItemsInCart] = useState(false);

  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    const fetchFreshProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');

      if (!error && data) {
        setProducts(data);
      }
    };

    fetchFreshProducts();
    fetchCartStatus();
  }, [user?.id, user?.store_id]);

  const categories = useMemo(() => {
    const allCats = products.map(p => p.category || 'General');
    const uniqueCats = [...new Set(allCats)];
    return ['All', ...uniqueCats.sort()];
  }, [products]);

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
      console.error(e);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand &&
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const productCategory = product.category || 'General';
    const matchesCategory =
      selectedCategory === 'All' || productCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const updateLocalQuantity = (productId: number, change: number) => {
    setItemQuantities(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [productId]: newQty };
    });
  };

  const commitToCart = async (product: Product) => {
    if (!user) return;
    let quantityToAdd = itemQuantities[product.id] || 0;
    if (quantityToAdd === 0) quantityToAdd = 1;

    setItemQuantities(prev => ({ ...prev, [product.id]: 0 }));

    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .eq('store_id', user.store_id)
        .maybeSingle();

      const finalNewQty = (existingItem?.quantity || 0) + quantityToAdd;

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
            quantity: quantityToAdd,
          },
        ]);
      }

      await fetchCartStatus();
      setShowSuccess(true);
      animationRef.current?.play();
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setItemQuantities(prev => ({ ...prev, [product.id]: quantityToAdd }));
    }
  };

  const renderProductCard = (item: Product) => {
    const quantity = itemQuantities[item.id] || 0;
    return (
      <View key={item.id} style={localStyles.card}>
        <TouchableOpacity
          style={localStyles.clickableArea}
          onPress={() =>
            navigation.navigate('ProductDetails', { product: item, user })
          }
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.image_url }} style={localStyles.image} />
          <View style={localStyles.info}>
            <Text style={localStyles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {item.brand && (
              <Text style={localStyles.brandText}>{item.brand}</Text>
            )}
            <Text style={localStyles.price}>৳{Math.round(item.price)}</Text>
          </View>
        </TouchableOpacity>

        <View style={localStyles.actionColumn}>
          <PopButton
            style={localStyles.addBtnSmall}
            onPress={() => commitToCart(item)}
          >
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
              <Text style={localStyles.addBtnText}>ADD</Text>
            </LinearGradient>
          </PopButton>

          <View style={localStyles.horizontalCounter}>
            <PopButton
              style={localStyles.counterBtn}
              onPress={() => updateLocalQuantity(item.id, -1)}
              disabled={quantity === 0}
            >
              <Text
                style={[
                  localStyles.counterText,
                  { opacity: quantity === 0 ? 0.3 : 1 },
                ]}
              >
                -
              </Text>
            </PopButton>
            <Text style={localStyles.counterNumber}>{quantity}</Text>
            <PopButton
              style={localStyles.counterBtn}
              onPress={() => updateLocalQuantity(item.id, 1)}
            >
              <Text style={localStyles.counterText}>+</Text>
            </PopButton>
          </View>
        </View>
      </View>
    );
  };

  // 3. Render Category Pill (Handles selection within this screen)
  const renderCategoryPill = (cat: string) => {
    const isSelected = selectedCategory === cat;

    return (
      <PopButton
        key={cat}
        onPress={() => setSelectedCategory(cat)}
        style={{ marginRight: ms(10) }}
      >
        {isSelected ? (
          <LinearGradient
            colors={['#4c0079ff', '#a200b1ff']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={localStyles.categoryPill}
          >
            <Text style={[localStyles.categoryText, { color: 'white' }]}>
              {cat}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              localStyles.categoryPill,
              localStyles.categoryPillUnselected,
            ]}
          >
            <Text style={[localStyles.categoryText, { color: '#666' }]}>
              {cat}
            </Text>
          </View>
        )}
      </PopButton>
    );
  };

  return (
    <View style={localStyles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* DYNAMIC ISLAND HEADER */}
      <View style={localStyles.searchWrapper}>
        <View style={localStyles.searchIsland}>
          <TextInput
            style={localStyles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={localStyles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}

          <PopButton
            style={localStyles.headerCartBtn}
            onPress={() => navigation.navigate('Cart')}
          >
            <Image
              source={require('../StoreMedia/Cart.png')}
              style={localStyles.cartIcon}
            />
            {hasItemsInCart && <View style={localStyles.cartBadge} />}
          </PopButton>
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        //stickyHeaderIndices={[0]}
      >
        {/* CATEGORY SELECTOR */}
        <View style={localStyles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: ms(20) }}
          >
            {categories.map(renderCategoryPill)}
          </ScrollView>
        </View>

        {filteredProducts.length > 0 ? (
          filteredProducts.map(renderProductCard)
        ) : (
          <View style={localStyles.noResultContainer}>
            <Text style={localStyles.emptyText}>
              No products found matching "{searchQuery}"
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
            </Text>
          </View>
        )}
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* LOTTIE OVERLAY */}
      {showSuccess && (
        <View style={localStyles.lottieOverlay}>
          <LottieView
            ref={animationRef}
            source={successAnimation}
            autoPlay
            loop={false}
            style={localStyles.lottie}
          />
        </View>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#fff' },
  searchWrapper: {
    position: 'absolute',
    top: vs(25),
    left: 0,
    right: 0,
    paddingHorizontal: ms(20),
    zIndex: 100,
    alignItems: 'center',
  },
  searchIsland: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbf2ffff',
    borderRadius: ms(25),
    borderWidth: 3,
    borderColor: '#ffffff',
    height: vs(45),
    width: '100%',
    paddingHorizontal: ms(15),
    shadowColor: '#5f0077ff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
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
  scrollContent: {
    // Removed horizontal padding so Category Container touches edges
    paddingBottom: vs(20),
    paddingTop: vs(80),
  },
  categoryContainer: {
    // Background color needed for sticky header
    backgroundColor: '#fff',
    height: vs(50),
    justifyContent: 'center',
  },
  categoryPill: {
    paddingHorizontal: ms(20),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillUnselected: {
    backgroundColor: '#64008b1a',
    borderWidth: 1,
    borderColor: 'rgba(243, 214, 255, 1)',
  },
  categoryText: {
    fontSize: ms(13),
    fontWeight: '700',
  },
  noResultContainer: {
    padding: ms(20),
    alignItems: 'center',
    marginTop: vs(20),
  },
  emptyText: { color: '#888', textAlign: 'center', fontSize: ms(14) },
  card: {
    flexDirection: 'row',
    backgroundColor: '#64008b10',
    borderRadius: ms(30),
    marginBottom: vs(10),
    padding: 0,
    paddingRight: ms(10),
    alignItems: 'center',
    overflow: 'hidden',
    height: s(75),
    // Margin horizontal replaces scrollview padding
    marginHorizontal: ms(10),
  },
  clickableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  image: {
    width: s(75),
    height: s(75),
    backgroundColor: '#eee',
    borderRadius: 30,
  },
  info: {
    flex: 1,
    marginLeft: ms(15),
    justifyContent: 'space-evenly',
    height: s(75),
    paddingVertical: ms(5),
  },
  name: { fontSize: ms(16), fontWeight: '900', color: '#562e63ff' },
  brandText: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#8f7896ff',
    marginTop: vs(-3),
  },
  price: {
    fontSize: ms(15),
    color: '#816e86ff',
    fontWeight: '700',
    marginTop: vs(2),
  },
  actionColumn: {
    width: s(90),
    height: s(75),
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginLeft: ms(5),
    paddingVertical: ms(5),
  },
  addBtnSmall: {
    width: s(90),
    height: s(25),
    borderRadius: ms(50),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 0,
  },
  addBtnText: { color: 'white', fontSize: ms(12), fontWeight: '900' },
  horizontalCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#34005218',
    borderRadius: ms(50),
    width: '100%',
    height: vs(20),
  },
  counterBtn: {
    width: s(30),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: ms(15),
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
  },
  counterNumber: {
    fontSize: ms(15),
    fontWeight: '900',
    color: '#333',
    minWidth: s(15),
    textAlign: 'center',
  },
  lottieOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  lottie: {
    width: ms(350),
    height: ms(350),
  },
});
