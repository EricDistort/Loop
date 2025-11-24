import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

// Type definitions
export type Product = {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
};

export type User = {
  id: string;
  store_id: string;
};

type AllProductsProps = {
  products: Product[];
  user: User | null;
  navigation: any;
};

export default function AllProducts({
  products,
  user,
  navigation,
}: AllProductsProps) {
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

  // --- RENDER PRODUCT CARD ---
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
          {/* HEIGHT REDUCED HERE */}
          <Image source={{ uri: item.image_url }} style={localStyles.image} />
          {/* HEIGHT REDUCED HERE */}
          <View style={localStyles.info}>
            <Text style={localStyles.name}>{item.name}</Text>
            {item.brand ? (
              <Text style={localStyles.brandText}>{item.brand}</Text>
            ) : null}
            <Text style={localStyles.price}>৳{Math.round(item.price)}</Text>
          </View>
        </TouchableOpacity>

        {/* HEIGHT REDUCED HERE */}
        <View style={localStyles.actionColumn}>
          {/* BUTTON HEIGHT REDUCED HERE */}
          <TouchableOpacity
            style={localStyles.addBtnSmall}
            onPress={() => commitToCart(item)}
          >
            <Text style={localStyles.addBtnText}>ADD</Text>
          </TouchableOpacity>

          {/* COUNTER HEIGHT REDUCED HERE */}
          <View style={localStyles.horizontalCounter}>
            <TouchableOpacity
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
            </TouchableOpacity>

            <Text style={localStyles.counterNumber}>{quantity}</Text>

            <TouchableOpacity
              style={localStyles.counterBtn}
              onPress={() => updateLocalQuantity(item.id, 1)}
            >
              <Text style={localStyles.counterText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ width: '100%' }}>
      {/* HEADER */}
      <View style={localStyles.listHeader}>
        <View style={localStyles.searchContainer}>
          <TextInput
            style={localStyles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#a08eacff"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={localStyles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}

          {/* "All" Button inside search bar */}
          <TouchableOpacity
            style={localStyles.allButton}
            onPress={() =>
              navigation.navigate('FullCatalog', {
                products: products,
                user: user,
              })
            }
          >
            <Text style={localStyles.allButtonText}>All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={localStyles.headerCartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          {/* UPDATED: Replaced Emoji Text with Local Image */}
          {/* REPLACE THE PATH BELOW WITH YOUR ACTUAL IMAGE PATH */}
          <Image
            source={require('../StoreMedia/Cart.png')}
            style={localStyles.cartIcon}
          />
        </TouchableOpacity>
      </View>

      {/* LIST */}
      {filteredProducts.length > 0 ? (
        filteredProducts.map(renderProductCard)
      ) : (
        <View style={localStyles.noResultContainer}>
          <Text style={localStyles.emptyText}>No products found.</Text>
        </View>
      )}
    </View>
  );
}

// --- LOCAL STYLES (HEIGHT ADJUSTMENTS APPLIED HERE) ---
const localStyles = StyleSheet.create({
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(15),
    width: '100%',
    gap: ms(10),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#64008b10',
    borderRadius: ms(17),
    alignItems: 'center',
    paddingLeft: ms(15),
    paddingRight: ms(5),
    height: vs(35),
  },
  searchInput: { flex: 1, fontSize: ms(14), color: '#333', height: '100%' },
  clearIcon: { fontSize: ms(14), color: '#999', padding: ms(5) },

  allButton: {
    backgroundColor: 'white',
    paddingVertical: vs(4),
    paddingHorizontal: ms(12),
    borderRadius: ms(12),
    marginRight: ms(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 1,
  },
  allButtonText: {
    color: '#6c008dff',
    fontWeight: '800',
    fontSize: ms(12),
  },

  headerCartBtn: {
    backgroundColor: '#6c008dff',
    height: vs(35),
    width: vs(35),
    borderRadius: ms(17),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    width: ms(20),
    height: ms(20),
    resizeMode: 'contain',
    tintColor: 'white',
  },
  noResultContainer: { padding: ms(20), alignItems: 'center' },
  emptyText: { color: '#888', textAlign: 'center', fontSize: ms(14) },

  // --- CARD STYLES ---
  card: {
    flexDirection: 'row',
    backgroundColor: '#64008b10',
    borderRadius: ms(30),
    marginBottom: vs(15),
    padding: ms(10),
    alignItems: 'center',
  },
  clickableArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  image: {
    // REDUCED FROM s(70)
    width: s(55),
    height: s(55),
    // REDUCED FROM ms(25)
    borderRadius: ms(20),
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    marginLeft: ms(15),
    justifyContent: 'space-evenly',
    // REDUCED FROM s(60)
    height: s(55),
  },
  name: {
    fontSize: ms(16),
    fontWeight: '900',
    color: '#333',
  },
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
    // REDUCED FROM s(65)
    height: s(55),
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: ms(5),
  },
  addBtnSmall: {
    backgroundColor: '#79009eff',
    width: s(90),
    // REDUCED FROM s(30)
    height: s(25),
    borderRadius: ms(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: 'white', fontSize: ms(12), fontWeight: '900' },
  horizontalCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#34005218',
    borderRadius: ms(50),
    width: '100%',
    // REDUCED FROM vs(25)
    height: vs(20),
  },
  counterBtn: {
    marginHorizontal: s(10),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterSymbol: { fontSize: ms(20), color: '#555', fontWeight: '900' },
  counterText: {
    fontSize: ms(15),
    fontWeight: '900',
    color: '#333',
    minWidth: s(15),
    textAlign: 'center',
  },
  counterNumber: {
    fontSize: ms(15),
    fontWeight: '900',
    color: '#333',
    minWidth: s(15),
    textAlign: 'center',
  },
});
