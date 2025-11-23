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
  const { products, user } = route.params as {
    products: Product[];
    user: User;
  };

  const [itemQuantities, setItemQuantities] = useState<{
    [key: number]: number;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products
  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand &&
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Update local quantity
  const updateLocalQuantity = (productId: number, change: number) => {
    setItemQuantities(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [productId]: newQty };
    });
  };

  // Commit to cart
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

  // Render product card
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
    <View style={localStyles.screenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={localStyles.listHeader}>
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

        <TouchableOpacity
          style={localStyles.headerCartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Image
            source={require('../StoreMedia/Cart.png')}
            style={localStyles.cartIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Product list */}
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
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: vs(10),
    paddingHorizontal: ms(10),
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(15),
    width: '100%',
    gap: ms(10),
    marginTop: vs(15),
  },
  searchInput: {
    flex: 1,
    fontSize: ms(14),
    color: '#333',
    height: vs(35),
    backgroundColor: '#64008b10',
    borderRadius: ms(17),
    paddingLeft: ms(15),
  },
  clearIcon: { fontSize: ms(14), color: '#999', padding: ms(5) },
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
  scrollContent: { paddingBottom: vs(20), paddingHorizontal: ms(5) },
  noResultContainer: { padding: ms(20), alignItems: 'center' },
  emptyText: { color: '#888', textAlign: 'center', fontSize: ms(14) },
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
    width: s(55),
    height: s(55),
    borderRadius: ms(20),
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    marginLeft: ms(15),
    justifyContent: 'space-evenly',
    height: s(55),
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
    height: s(55),
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: ms(5),
  },
  addBtnSmall: {
    backgroundColor: '#6c008dff',
    width: s(90),
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
