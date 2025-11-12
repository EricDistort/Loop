import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
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

type CartItem = {
  id: number;
  product_id: number;
  quantity: number;
  products: {
    id: number;
    name: string;
    price: number;
  };
};

export default function CartScreen() {
  const { user } = useUser();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [detailedAddress, setDetailedAddress] = useState('');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('cart_items')
      .select(
        `
        id,
        quantity,
        products(id, name, price)
      `,
      )
      .eq('user_id', user.id);

    if (error) return Alert.alert('Error', error.message);
    setCartItems(data || []);
  };

  const getTotal = () =>
    cartItems.reduce(
      (acc, item) => acc + item.quantity * item.products.price,
      0,
    );

  const removeItem = async (id: number) => {
    await supabase.from('cart_items').delete().eq('id', id);
    fetchCart();
  };

  const placeOrder = async () => {
    if (!user || !detailedAddress.trim()) {
      return Alert.alert('Please enter your detailed address');
    }

    if (cartItems.length === 0) return Alert.alert('Cart is empty');

    const totalAmount = getTotal();
    const deliveryAddress = `${user.address}, ${detailedAddress}`;
    const productsData = cartItems.map(item => ({
      product_id: item.products.id,
      quantity: item.quantity,
      price: item.products.price,
    }));

    try {
      await supabase.from('purchases').insert([
        {
          user_id: user.id,
          store_id: user.store_id,
          total_amount: totalAmount,
          delivery_address: deliveryAddress,
          status: 'Pending',
          products: productsData,
        },
      ]);

      // Clear cart
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      setCartItems([]);
      setDetailedAddress('');
      Alert.alert('Order placed successfully!');
    } catch (error: any) {
      Alert.alert('Error placing order', error.message);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.products.name}</Text>
      <Text style={styles.quantity}>Qty: {item.quantity}</Text>
      <Text style={styles.price}>
        ${(item.quantity * item.products.price).toFixed(2)}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => removeItem(item.id)}
      >
        <Text style={styles.buttonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={{ paddingBottom: vs(20) }}>
          <Text style={styles.title}>Your Cart</Text>

          <FlatList
            data={cartItems}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: vs(20) }}
          />

          <View style={styles.checkoutContainer}>
            <Text style={styles.label}>Registered Address:</Text>
            <Text style={styles.address}>{user?.address || 'N/A'}</Text>

            <Text style={styles.label}>Detailed Address:</Text>
            <TextInput
              style={styles.input}
              placeholder="House no, Floor, etc."
              placeholderTextColor="#00c6ff99"
              value={detailedAddress}
              onChangeText={setDetailedAddress}
            />

            <Text style={styles.total}>Total: ${getTotal().toFixed(2)}</Text>

            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={placeOrder}
            >
              <Text style={styles.placeOrderText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'black', padding: ms(10) },
  title: {
    fontSize: ms(26),
    fontWeight: 'bold',
    color: '#00c6ff',
    marginBottom: vs(12),
    alignSelf: 'center',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: ms(10),
    borderRadius: ms(10),
    marginBottom: vs(10),
    borderWidth: 1,
    borderColor: '#00c6ff33',
  },
  name: { color: '#00c6ff', fontSize: ms(16), fontWeight: 'bold' },
  quantity: { color: '#00ff00', fontSize: ms(14) },
  price: { color: '#ff00ff', fontSize: ms(14), fontWeight: 'bold' },
  button: {
    backgroundColor: '#ff00ffbd',
    padding: vs(4),
    borderRadius: ms(6),
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: ms(14) },
  checkoutContainer: {
    marginTop: vs(20),
    padding: ms(10),
    backgroundColor: '#1a1a1a',
    borderRadius: ms(10),
  },
  label: {
    color: '#00c6ff',
    fontWeight: 'bold',
    marginBottom: vs(4),
    fontSize: ms(14),
  },
  address: { color: '#fff', marginBottom: vs(10), fontSize: ms(14) },
  input: {
    backgroundColor: '#00000033',
    color: '#00c6ff',
    borderRadius: ms(6),
    padding: ms(8),
    marginBottom: vs(10),
  },
  total: {
    color: '#00ff00',
    fontSize: ms(18),
    fontWeight: 'bold',
    marginBottom: vs(12),
  },
  placeOrderButton: {
    backgroundColor: '#ff00ffbd',
    padding: vs(12),
    borderRadius: ms(8),
    alignItems: 'center',
  },
  placeOrderText: { color: '#fff', fontWeight: 'bold', fontSize: ms(16) },
});
