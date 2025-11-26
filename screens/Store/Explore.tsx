import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { supabase } from '../../utils/supabaseClient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
const successAnimation = require('../StoreMedia/Confirmed.json');

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

export default function AllProducts({ navigation }: { navigation: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        setProducts(data || []);
      } catch (e) {
        console.error('Error fetching products:', e);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = (products || []).filter(
    product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand &&
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const renderProductCard = (item: Product) => (
    <View key={item.id} style={localStyles.card}>
      <TouchableOpacity
        style={localStyles.clickableArea}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.image_url }} style={localStyles.image} />
        <View style={localStyles.info}>
          <Text style={localStyles.name}>{item.name}</Text>
          {item.brand && (
            <Text style={localStyles.brandText}>{item.brand}</Text>
          )}
          <Text style={localStyles.price}>৳{Math.round(item.price)}</Text>
        </View>
      </TouchableOpacity>
      <View style={localStyles.actionColumn}>
        <TouchableOpacity
          style={localStyles.addBtnSmall}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={localStyles.addBtnText}>ADD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{
        width: '100%',
        flex: 1,
        backgroundColor: '#fff',
        padding: ms(15),
        paddingTop: vs(25),
      }}
    >
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
        </View>
      </View>

      {filteredProducts.length > 0 ? (
        filteredProducts.map(renderProductCard)
      ) : (
        <View style={localStyles.noResultContainer}>
          <Text style={localStyles.emptyText}>No products found.</Text>
        </View>
      )}
    </ScrollView>
  );
}

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
  card: {
    flexDirection: 'row',
    backgroundColor: '#64008b10',
    borderRadius: ms(30),
    marginBottom: vs(10),
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
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: ms(5),
  },
  addBtnSmall: {
    backgroundColor: '#710094ff',
    width: s(90),
    height: s(35),
    alignSelf: 'center',
    borderRadius: ms(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: 'white', fontSize: ms(12), fontWeight: '900' },
  noResultContainer: { padding: ms(20), alignItems: 'center' },
  emptyText: { color: '#888', textAlign: 'center', fontSize: ms(14) },
});
