import React, { useState } from 'react';
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
import { supabase } from '../../utils/supabaseClient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

// Type definitions
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

export default function FullCatalog({ route, navigation }: any) {
  // 1. Get data passed from the AllProducts "All" button
  const { products, user } = route.params as {
    products: Product[];
    user: User;
  };

  // --- STATE ---
  const [itemQuantities, setItemQuantities] = useState<{
    [key: number]: number;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');

  // --- LOGIC: FILTER PRODUCTS ---
  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand &&
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // --- LOCAL QUANTITY HANDLER ---
  const updateLocalQuantity = (productId: number, change: number) => {
    setItemQuantities(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [productId]: newQty };
    });
  };

  // --- CART COMMIT LOGIC ---
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
      Alert.alert(
        'Success',
        `${quantityToAdd} item(s) added to cart successfully!`,
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setItemQuantities(prev => ({ ...prev, [product.id]: quantityToAdd }));
    }
  };

  // --- RENDER PRODUCT CARD (Identical Modern Style) ---
  const renderProductCard = (item: Product) => {
    const quantity = itemQuantities[item.id] || 0;

    return (
      <View key={item.id} style={localStyles.card}>
        <TouchableOpacity
          style={localStyles.clickableArea}
          onPress={() =>
            navigation.navigate('ProductDetails', { product: item, user: user })
          }
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.image_url }} style={localStyles.image} />
          <View style={localStyles.info}>
            <Text style={localStyles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {item.brand ? (
              <Text style={localStyles.brandText}>{item.brand}</Text>
            ) : null}
            <Text style={localStyles.price}>৳{Math.round(item.price)}</Text>
          </View>
        </TouchableOpacity>

        {/* Right: Actions Column */}
        <View style={localStyles.actionColumn}>
          <TouchableOpacity
            style={localStyles.addBtnSmall}
            onPress={() => commitToCart(item)}
          >
            <Text style={localStyles.addBtnText}>ADD</Text>
          </TouchableOpacity>

          <View style={localStyles.horizontalCounter}>
            <TouchableOpacity
              style={localStyles.counterBtn}
              onPress={() => updateLocalQuantity(item.id, -1)}
              disabled={quantity === 0}
            >
              <Text
                style={[
                  localStyles.counterSymbol,
                  { opacity: quantity === 0 ? 0.3 : 1 },
                ]}
              >
                -
              </Text>
            </TouchableOpacity>

            <Text style={localStyles.counterText}>{quantity}</Text>

            <TouchableOpacity
              style={localStyles.counterBtn}
              onPress={() => updateLocalQuantity(item.id, 1)}
            >
              <Text style={localStyles.counterSymbol}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={localStyles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* --- HEADER (Back + Title + Cart) --- */}
      <View style={localStyles.screenHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={localStyles.backButton}
        >
          {/* Simple Back Arrow */}
          <Text style={localStyles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={localStyles.screenTitle}>All Products</Text>

        <TouchableOpacity
          style={localStyles.headerCartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={localStyles.headerCartText}>🛒</Text>
        </TouchableOpacity>
      </View>

      {/* --- SEARCH BAR (Identical, but NO 'All' button) --- */}
      <View style={localStyles.searchContainer}>
        <TextInput
          style={localStyles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#a08eacff"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={localStyles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* --- SCROLLABLE LIST --- */}
      <ScrollView
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.length > 0 ? (
          filteredProducts.map(renderProductCard)
        ) : (
          <View style={localStyles.noResultContainer}>
            <Text style={localStyles.emptyText}>
              No products found matching "{searchQuery}"
            </Text>
          </View>
        )}
        {/* Bottom spacer */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

// --- LOCAL STYLES (Identical to modernized AllProducts) ---
const localStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff', // White background for the full screen
    paddingTop: vs(10), // Safe area top
    paddingHorizontal: ms(10),
  },

  // Header Styles
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(15),
    paddingHorizontal: ms(5),
  },
  backButton: {
    padding: ms(5),
    width: ms(40),
  },
  backButtonText: {
    fontSize: ms(28),
    fontWeight: 'bold',
    color: '#333',
  },
  screenTitle: {
    fontSize: ms(20),
    fontWeight: '900',
    color: '#333',
  },

  // Search Container (No 'All' Button)
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: ms(50),
    alignItems: 'center',
    paddingHorizontal: ms(15),
    height: vs(40),
    marginBottom: vs(15),
    // Shadows
    shadowColor: '#6c008d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#6c008d15',
  },
  searchInput: { flex: 1, fontSize: ms(14), color: '#333', height: '100%' },
  clearIcon: { fontSize: ms(14), color: '#999', padding: ms(5) },

  // Cart Button
  headerCartBtn: {
    backgroundColor: '#6c008dff',
    height: vs(40),
    width: vs(40),
    borderRadius: ms(50),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c008d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerCartText: { fontSize: ms(20), color: 'white' },

  scrollContent: {
    paddingBottom: vs(20),
    paddingHorizontal: ms(5), // Alignment fix
  },
  noResultContainer: {
    padding: ms(20),
    alignItems: 'center',
    marginTop: vs(50),
  },
  emptyText: { color: '#888', textAlign: 'center', fontSize: ms(14) },

  // --- MODERN CARD STYLES ---
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(12),
    marginBottom: vs(15),
    borderRadius: ms(20),
    backgroundColor: 'white',
    shadowColor: '#6c008d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#6c008d10',
  },
  clickableArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  image: {
    width: s(75),
    height: s(75),
    borderRadius: ms(18),
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
    marginLeft: ms(15),
    justifyContent: 'center',
    height: s(75),
  },
  name: {
    fontSize: ms(16),
    fontWeight: '800',
    color: '#222',
    marginBottom: vs(2),
  },
  brandText: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#6c008dff',
    marginBottom: vs(6),
    opacity: 0.9,
  },
  price: {
    fontSize: ms(17),
    color: '#333',
    fontWeight: '800',
  },

  actionColumn: {
    width: s(95),
    height: s(70),
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: ms(10),
    paddingVertical: vs(2),
  },
  addBtnSmall: {
    backgroundColor: '#6c008dff',
    width: '100%',
    height: s(32),
    borderRadius: ms(50),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c008d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addBtnText: {
    color: 'white',
    fontSize: ms(12),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  horizontalCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: ms(50),
    width: '100%',
    height: vs(28),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  counterBtn: {
    width: s(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterSymbol: { fontSize: ms(18), color: '#555', fontWeight: '700' },
  counterText: {
    fontSize: ms(15),
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
  },
});
