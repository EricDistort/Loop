import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
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
    brand: string;
    image_url: string;
  };
};
export default function CartScreen({ navigation }: any) {
  const { user } = useUser();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [detailedAddress, setDetailedAddress] = useState('');
  useEffect(() => {
    fetchCart();
  }, [user]);
  const fetchCart = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('cart_items')
      .select(
        `
        id,
        quantity,
        products (
          id,
          name,
          price,
          brand,
          image_url
        )
      `,
      )
      .eq('user_id', user.id);
    if (error) {
      console.error(error);
      return Alert.alert('Error', error.message);
    }
    setCartItems(data || []);
  };
  const getTotal = () =>
    cartItems.reduce(
      (acc, item) => acc + item.quantity * item.products.price,
      0,
    );
  const removeItem = async (id: number) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else fetchCart();
  };
  const placeOrder = async () => {
    if (!user || !detailedAddress.trim()) {
      return Alert.alert('Required', 'Please enter your detailed address');
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
      const { error } = await supabase.from('purchases').insert([
        {
          user_id: user.id,
          store_id: user.store_id,
          total_amount: totalAmount,
          delivery_address: deliveryAddress,
          status: 'Pending',
          products: productsData,
        },
      ]);
      if (error) throw error;
      // Clear cart
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      setCartItems([]);
      setDetailedAddress('');
      Alert.alert('Success', 'Order placed successfully!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error placing order', error.message);
    }
  };
  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.products.image_url }} style={styles.image} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.products.name}
        </Text>
        {item.products.brand ? (
          <Text style={styles.brandText}>{item.products.brand}</Text>
        ) : null}
        <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
      </View>
      <View style={styles.actionColumn}>
        <Text style={styles.price}>
          ৳{(item.quantity * item.products.price).toFixed(0)}
        </Text>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeItem(item.id)}
        >
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top Half: Cart Items */}
      <View style={styles.listContainer}>
        {cartItems.length > 0 ? (
          <FlatList
            data={cartItems}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your cart is empty.</Text>
          </View>
        )}
      </View>
      {/* Bottom Half: Checkout */}
      <View style={styles.checkoutContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Checkout Details</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Registered Address:</Text>
            <Text style={styles.value}>{user?.address || 'N/A'}</Text>
          </View>
          <Text style={styles.label}>Detailed Address:</Text>
          <TextInput
            style={styles.input}
            placeholder="House no, Floor, etc."
            placeholderTextColor="#a08eacff"
            value={detailedAddress}
            onChangeText={setDetailedAddress}
          />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>৳{getTotal().toFixed(0)}</Text>
          </View>
          <TouchableOpacity
            style={styles.placeOrderButton}
            onPress={placeOrder}
          >
            <Text style={styles.placeOrderText}>PLACE ORDER</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    flex: 1, // Takes up half the screen roughly
    paddingHorizontal: ms(10),
    paddingTop: vs(10),
  },
  listContent: {
    paddingBottom: vs(10),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: ms(16),
  },

  // Card Styles (Matching AllProducts)
  card: {
    flexDirection: 'row',
    backgroundColor: '#64008b10',
    borderRadius: ms(20),
    marginBottom: vs(10),
    padding: ms(10),
    alignItems: 'center',
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: ms(15),
    padding: ms(2),
  },
  image: {
    width: s(50),
    height: s(50),
    borderRadius: ms(13),
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    marginLeft: ms(12),
    justifyContent: 'center',
    height: s(50),
  },
  name: {
    fontSize: ms(15),
    fontWeight: '900',
    color: '#333',
  },
  brandText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: '#6c008dff',
  },
  quantityText: {
    fontSize: ms(13),
    color: '#555',
    marginTop: vs(2),
  },
  actionColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: s(50),
    paddingVertical: vs(2),
  },
  price: {
    fontSize: ms(16),
    color: '#340052ff',
    fontWeight: '900',
  },
  removeBtn: {
    backgroundColor: '#ff000020',
    paddingHorizontal: ms(10),
    paddingVertical: vs(4),
    borderRadius: ms(10),
  },
  removeBtnText: {
    color: '#d90000',
    fontSize: ms(10),
    fontWeight: 'bold',
  },
  // Checkout Styles
  checkoutContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    padding: ms(20),
  },
  sectionTitle: {
    fontSize: ms(20),
    fontWeight: '900',
    color: '#340052ff',
    marginBottom: vs(15),
  },
  row: {
    marginBottom: vs(10),
  },
  label: {
    color: '#6c008dff',
    fontWeight: '700',
    fontSize: ms(14),
    marginBottom: vs(5),
  },
  value: {
    color: '#333',
    fontSize: ms(15),
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#64008b10',
    color: '#333',
    borderRadius: ms(12),
    padding: ms(12),
    fontSize: ms(14),
    marginBottom: vs(15),
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: vs(10),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  totalLabel: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: ms(24),
    fontWeight: '900',
    color: '#340052ff',
  },
  placeOrderButton: {
    backgroundColor: '#79009eff',
    paddingVertical: vs(15),
    borderRadius: ms(20),
    alignItems: 'center',
    shadowColor: '#79009eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  placeOrderText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: ms(16),
    letterSpacing: 1,
  },
});
