import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import ScreenWrapper from '../../utils/ScreenWrapper';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    if (!user?.store_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_products')
        .select(
          `
          stock_quantity,
          products (
            id,
            name,
            description,
            price,
            image_url
          )
        `,
        )
        .eq('store_id', user.store_id);

      if (error) throw error;

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
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: Product) => {
    if (!user) return;

    try {
      // Check if item already exists
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
        // Insert new cart item
        await supabase.from('cart_items').insert([
          {
            user_id: user.id,
            product_id: product.id,
            store_id: user.store_id,
            quantity: 1,
          },
        ]);
      }

      Alert.alert('Added to cart!');
    } catch (error: any) {
      Alert.alert('Error adding to cart', error.message);
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <Text style={styles.stock}>Stock: {item.stock_quantity}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => addToCart(item)}
          >
            <Text style={styles.buttonText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.buttonText}>Go to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Products</Text>
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: vs(20) }}
        />
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, padding: ms(10), backgroundColor: 'black' },
  title: {
    fontSize: ms(26),
    fontWeight: 'bold',
    color: '#00c6ff',
    marginBottom: vs(12),
    alignSelf: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: ms(12),
    marginBottom: vs(12),
    padding: ms(10),
    borderWidth: 1,
    borderColor: '#00c6ff33',
  },
  image: { width: s(100), height: s(100), borderRadius: ms(8) },
  info: { flex: 1, marginLeft: ms(10), justifyContent: 'space-between' },
  name: { fontSize: ms(18), fontWeight: 'bold', color: '#00c6ff' },
  desc: { fontSize: ms(14), color: '#00c6ff99' },
  price: { fontSize: ms(16), color: '#ff00ff', fontWeight: 'bold' },
  stock: { fontSize: ms(14), color: '#00ff00' },
  button: {
    backgroundColor: '#ff00ffbd',
    paddingVertical: vs(6),
    borderRadius: ms(6),
    alignItems: 'center',
    marginTop: vs(4),
    width: s(100),
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: ms(14) },
});
