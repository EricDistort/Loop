import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

export type Product = {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  category?: string;
};

export type User = {
  id: string;
  store_id: string;
};

type AllProductsProps = {
  products: Product[];
  user: User | null;
  navigation: any;
  searchQuery: string;
};

export default function AllProducts({
  products: initialProducts,
  user,
  navigation,
  searchQuery,
}: AllProductsProps) {
  
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [itemQuantities, setItemQuantities] = useState<{ [key: number]: number }>({});
  
  // We keep this state for visual consistency, but navigation happens immediately
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [showSuccess, setShowSuccess] = useState(false);
  const animationRef = useRef<LottieView>(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchFreshProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) setProducts(data);
    };
    fetchFreshProducts();
  }, [user?.id, user?.store_id]);

  // --- 2. CATEGORIES ---
  const categories = useMemo(() => {
    const allCats = products.map(p => p.category || 'General');
    const uniqueCats = [...new Set(allCats)];
    return ['All', ...uniqueCats.sort()];
  }, [products]);

  // --- 3. FILTER LOGIC (Only Search is active here now, Category jumps to new screen) ---
  const filteredProducts = products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    );
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
      setShowSuccess(true);
      animationRef.current?.play();
      setTimeout(() => setShowSuccess(false), 1500);
    } catch (error: any) {
      setItemQuantities(prev => ({ ...prev, [product.id]: quantityToAdd }));
    }
  };

  const renderProductCard = (item: Product) => {
    const quantity = itemQuantities[item.id] || 0;
    return (
      <View key={item.id} style={localStyles.card}>
        <TouchableOpacity
          style={localStyles.clickableArea}
          onPress={() => navigation.navigate('ProductDetails', { product: item, user: user })}
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.image_url }} style={localStyles.image} />
          <View style={localStyles.info}>
            <Text style={localStyles.name} numberOfLines={1}>{item.name}</Text>
            {item.brand && <Text style={localStyles.brandText}>{item.brand}</Text>}
            <Text style={localStyles.price}>৳{Math.round(item.price)}</Text>
          </View>
        </TouchableOpacity>

        <View style={localStyles.actionColumn}>
          <PopButton style={localStyles.addBtnSmall} onPress={() => commitToCart(item)}>
            <LinearGradient
              colors={['#4c0079ff', '#a200b1ff']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={localStyles.addBtnText}>ADD</Text>
            </LinearGradient>
          </PopButton>

          <View style={localStyles.horizontalCounter}>
            <PopButton style={localStyles.counterBtn} onPress={() => updateLocalQuantity(item.id, -1)} disabled={quantity === 0}>
              <Text style={[localStyles.counterText, { opacity: quantity === 0 ? 0.3 : 1 }]}>-</Text>
            </PopButton>
            <Text style={localStyles.counterNumber}>{quantity}</Text>
            <PopButton style={localStyles.counterBtn} onPress={() => updateLocalQuantity(item.id, 1)}>
              <Text style={localStyles.counterText}>+</Text>
            </PopButton>
          </View>
        </View>
      </View>
    );
  };

  // --- RENDER CATEGORY PILL (UPDATED: Navigates to FullCatalog) ---
  const renderCategoryPill = (cat: string) => {
    // We treat "All" as selected visually just for this screen, 
    // but clicking anything navigates away.
    const isSelected = selectedCategory === cat; 

    return (
        <PopButton 
            key={cat} 
            style={{ marginRight: ms(10) }}
            onPress={() => {
                // Navigate to FullCatalog passing the clicked category
                navigation.navigate('FullCatalog', {
                    products: products,
                    user: user,
                    initialCategory: cat // Pass this to pre-select in FullCatalog
                });
            }}
        >
            {isSelected ? (
                <LinearGradient
                    colors={['#4c0079ff', '#a200b1ff']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={localStyles.categoryPill}
                >
                    <Text style={[localStyles.categoryText, { color: 'white' }]}>{cat}</Text>
                </LinearGradient>
            ) : (
                <View style={[localStyles.categoryPill, localStyles.categoryPillUnselected]}>
                    <Text style={[localStyles.categoryText, { color: '#666' }]}>{cat}</Text>
                </View>
            )}
        </PopButton>
    );
  };

  return (
    <View style={localStyles.container}>
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

      {/* LIST */}
      {filteredProducts.length > 0 ? (
        filteredProducts.map(renderProductCard)
      ) : (
        <View style={localStyles.noResultContainer}>
          <Text style={localStyles.emptyText}>
            No products found matching "{searchQuery}"
          </Text>
        </View>
      )}
      
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
  container: { 
    flex: 1, 
    backgroundColor: '#ffffffff',
    paddingBottom: vs(20),
  },
  // --- LAYOUT STYLES ---
  categoryContainer: {
    backgroundColor: '#ffffffff', 
    height: vs(50), 
    justifyContent: 'center',
    marginBottom: vs(5),
  },
  categoryPill: {
    paddingHorizontal: ms(20),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillUnselected: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
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
  
  // --- CARD STYLES ---
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
  name: { fontSize: ms(16), fontWeight: '900', color: '#333' },
  brandText: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#6c008dff',
    marginTop: vs(-3),
  },
  price: {
    fontSize: ms(15),
    color: '#31313181',
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
  },
  lottie: {
    width: ms(350),
    height: ms(350),
  },
});