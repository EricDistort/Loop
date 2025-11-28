import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity, // Keeping for any non-animated areas if needed
  TextInput,
  Image,
  Alert,
  ScrollView,
  StatusBar,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import Geolocation from 'react-native-geolocation-service';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

// 1. IMPORT POP BUTTON
import PopButton from '../../utils/PopButton';

// REPLACE with your actual local Lottie file path
const emptyCartAnimation = require('../StoreMedia/Cat.json');

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
  const [locationUrl, setLocationUrl] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

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

  const decrementQuantity = async (id: number, currentQty: number) => {
    if (currentQty <= 1) return;
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: currentQty - 1 })
      .eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else fetchCart();
  };

  // --- LOCATION HANDLING ---
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location to auto-fill address.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    setLoadingLocation(true);

    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

        // Just set state, no alerts
        setLocationUrl(mapsLink);
        setLoadingLocation(false);
      },
      error => {
        console.error(error);
        Alert.alert('Error', 'Failed to get location. Ensure GPS is on.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const placeOrder = async () => {
    if (!user) return;

    // VALIDATION CHANGE:
    // Allow if detailedAddress has text OR locationUrl is set
    if (!detailedAddress.trim() && !locationUrl) {
      return Alert.alert(
        'Required',
        'Please enter an address OR use the Map button.',
      );
    }

    if (cartItems.length === 0) return Alert.alert('Cart is empty');

    const totalAmount = getTotal();

    // Construct address: Handle case where detailedAddress might be empty
    const baseAddress = user.address || '';
    const separator = baseAddress && detailedAddress.trim() ? ', ' : '';
    const finalDeliveryAddress = baseAddress + separator + detailedAddress;

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
          delivery_address: finalDeliveryAddress,
          location: locationUrl,
          status: 'Confirmed', 
          products: productsData,
        },
      ]);

      if (error) throw error;

      // Clear cart
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      setCartItems([]);
      setDetailedAddress('');
      setLocationUrl('');
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
      </View>
      <View style={styles.actionColumn}>
        <View style={styles.priceQtyRow}>
          <Text style={styles.quantityTextRight}>{item.quantity}x</Text>
          <Text style={styles.price}>
            ৳{(item.quantity * item.products.price).toFixed(0)}
          </Text>
        </View>
        <View style={styles.priceQtyRow}>
          
          {/* 3. POP ANIMATION: Minus Button */}
          <PopButton
            style={styles.minusBtn}
            onPress={() => decrementQuantity(item.id, item.quantity)}
          >
            <Text style={styles.minusBtnText}>-</Text>
          </PopButton>

          {/* 4. POP ANIMATION: Remove Button */}
          <PopButton
            style={styles.removeBtn}
            onPress={() => removeItem(item.id)}
          >
            <Text style={styles.removeBtnText}>Remove</Text>
          </PopButton>

        </View>
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
            <LottieView
              source={emptyCartAnimation}
              autoPlay
              loop
              style={styles.lottieEmpty}
            />
          </View>
        )}
      </View>

      {/* Bottom Half: Checkout */}
      <View style={styles.checkoutContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.row}>
            <Text style={styles.value}>{user?.address || 'N/A'}</Text>
          </View>
          <Text style={styles.label}>Location Details</Text>

          {/* Location Input Wrapper */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="House no, Floor, Road, Area..."
              placeholderTextColor="#a08eacff"
              value={detailedAddress}
              onChangeText={setDetailedAddress}
              numberOfLines={1}
            />

            {/* 2. POP ANIMATION: Map Button */}
            <PopButton
              style={[
                styles.locationBtn,
                locationUrl ? { backgroundColor: '#e0ffe0' } : {},
              ]}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#9100caff" />
              ) : (
                <Text
                  style={[
                    styles.locationBtnText,
                    locationUrl ? { color: 'green' } : {},
                  ]}
                >
                  {locationUrl ? 'Pinned' : 'Map'}
                </Text>
              )}
            </PopButton>
          </View>

          {/* 5. POP ANIMATION: Buy Button */}
          <PopButton onPress={placeOrder}>
            <LinearGradient
              colors={['#340052ff', '#8c0099ff']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.placeOrderButton}
            >
              <Text style={styles.placeOrderText}>
                Buy Total ৳{getTotal().toFixed(0)}
              </Text>
            </LinearGradient>
          </PopButton>
          <View style={styles.row}>
            
          </View>
          
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: ms(10),
    paddingTop: vs(20),
    backgroundColor: 'white',
  },
  listContent: {
    paddingBottom: vs(10),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    //paddingRight: ms(20),
  },
  lottieEmpty: {
    width: ms(500),
    height: ms(500),
    marginRight: ms(30),
    //marginBottom: vs(10),
  },
  emptyText: {
    color: '#888',
    fontSize: ms(16),
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#64008b10',
    borderRadius: ms(30),
    marginBottom: vs(10),
    padding: ms(10),
    alignItems: 'center',
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: ms(20),
    overflow: 'hidden',
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
  actionColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: s(50),
    paddingVertical: vs(2),
  },
  priceQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityTextRight: {
    fontSize: ms(13),
    color: '#555',
    marginLeft: ms(8),
    marginRight: ms(8),
  },
  price: {
    fontSize: ms(16),
    color: '#340052ff',
    fontWeight: '900',
    marginRight: ms(8),
  },
  minusBtn: {
    backgroundColor: '#ddd',
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ms(8),
  },
  minusBtnText: {
    fontSize: ms(14),
    fontWeight: 'bold',
    color: '#333',
    lineHeight: ms(16),
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
  checkoutContainer: {
    backgroundColor: '#ffffffff',
    padding: ms(20),
    marginBottom: vs(80),
  },
  row: {
    marginBottom: vs(4),
    marginLeft: ms(7),
  },
  label: {
    color: '#6c008dff',
    fontWeight: '700',
    fontSize: ms(14),
    marginBottom: vs(5),
    marginLeft: ms(7),
  },
  value: {
    color: '#333',
    fontSize: ms(15),
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64008b10',
    borderRadius: ms(20),
    marginBottom: vs(10),
    paddingRight: ms(10),
  },
  inputWithIcon: {
    flex: 1,
    color: '#333',
    padding: ms(12),
    fontSize: ms(14),
    minHeight: vs(40),
  },
  locationBtn: {
    backgroundColor: '#7d01a328',
    paddingVertical: vs(6),
    paddingHorizontal: ms(12),
    borderRadius: ms(15),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: ms(5),
  },
  locationBtnText: {
    color: '#9d00e6ff',
    fontSize: ms(12),
    fontWeight: 'bold',
  },
  placeOrderButton: {
    paddingVertical: vs(10),
    borderRadius: ms(22),
    justifyContent: 'center',
    alignItems: 'center',
    width: ms(250),
    height: vs(40),
  },
  placeOrderText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: ms(18),
  },
});