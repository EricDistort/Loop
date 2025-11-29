import React, { useEffect, useState, useRef } from 'react';
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
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Dimensions,
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
const successAnimation = require('../StoreMedia/Confirmed.json'); // <--- 1. Success Animation

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

  // --- 2. NEW STATE FOR SUCCESS ANIMATION ---
  const [showSuccess, setShowSuccess] = useState(false);
  const animationRef = useRef<LottieView>(null);

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
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=$${latitude},${longitude}`;

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

    // Validation
    if (!detailedAddress.trim() && !locationUrl) {
      return Alert.alert(
        'Required',
        'Please enter an address OR use the Map button.',
      );
    }

    if (cartItems.length === 0) return Alert.alert('Cart is empty');

    const totalAmount = getTotal();

    // Construct address
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

      // --- 3. SHOW ANIMATION INSTEAD OF ALERT ---
      setShowSuccess(true);
      animationRef.current?.play();

      // Wait 2 seconds for animation, then go back
      setTimeout(() => {
        setShowSuccess(false);
        navigation.goBack();
      }, 4000);
    } catch (error: any) {
      Alert.alert('Error placing order', error.message);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      {/* 1. Image Section: Fills Height, No Gap */}
      <Image
        source={{ uri: item.products.image_url }}
        style={styles.image}
        resizeMode="cover"
      />

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
            <Text style={styles.value} numberOfLines={2}>
              {user?.address || 'N/A'}
            </Text>
          </View>

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
          <View style={{ alignItems: 'center', width: '100%' }}>
            <PopButton onPress={placeOrder}>
              <LinearGradient
                colors={['#340052ff', '#8c0099ff']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.placeOrderButton}
              >
                <Text style={styles.placeOrderText}>
                  Buy Total {getTotal().toFixed(0)}৳
                </Text>
              </LinearGradient>
            </PopButton>
          </View>
          <View style={styles.row}></View>
        </ScrollView>
      </View>

      {/* --- 4. SUCCESS OVERLAY COMPONENT --- */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <LottieView
            ref={animationRef}
            source={successAnimation}
            autoPlay
            loop={false}
            style={styles.successLottie}
          />
        </View>
      )}
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
  },
  lottieEmpty: {
    width: s(380),
    height: s(380),
    marginRight: ms(30),
  },
  emptyText: {
    color: '#888',
    fontSize: ms(16),
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#64008b10',
    borderRadius: ms(25),
    marginBottom: vs(10),
    padding: 0,
    paddingRight: ms(10),
    alignItems: 'center',
    overflow: 'hidden',
    height: s(68),
  },
  image: {
    width: s(68),
    height: s(68),
    backgroundColor: '#eee',
    borderRadius: ms(25),
  },
  info: {
    flex: 1,
    marginLeft: ms(10),
    justifyContent: 'center',
    height: '100%',
    paddingVertical: ms(5),
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
    justifyContent: 'center',
    height: '100%',
    paddingVertical: vs(5),
    gap: vs(4),
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
    width: s(20),
    height: s(20),
    borderRadius: s(10),
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
    backgroundColor: 'transparent',
    padding: ms(20),
    marginBottom: vs(80),
    maxHeight: vs(250),
  },
  row: {
    marginBottom: vs(4),
    marginLeft: ms(7),
  },
  label: {
    color: '#6c008dff',
    fontWeight: '700',
    fontSize: ms(14),
    marginBottom: vs(7),
    marginLeft: ms(7),
  },
  value: {
    color: '#333',
    fontSize: ms(15),
    fontWeight: '500',
    marginBottom: vs(5),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64008b10',
    borderRadius: ms(20),
    marginBottom: vs(15),
    paddingRight: ms(10),
    height: vs(45),
  },
  inputWithIcon: {
    flex: 1,
    color: '#333',
    paddingHorizontal: ms(12),
    fontSize: ms(14),
    height: '100%',
  },
  locationBtn: {
    backgroundColor: '#eec8faff',
    paddingVertical: vs(6),
    paddingHorizontal: ms(12),
    borderRadius: ms(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: ms(5),
    elevation: 2,
  },
  locationBtnText: {
    color: '#7400aaff',
    fontSize: ms(12),
    fontWeight: 'bold',
  },
  placeOrderButton: {
    paddingVertical: vs(10),
    borderRadius: ms(22),
    justifyContent: 'center',
    alignItems: 'center',
    width: s(250),
    height: vs(45),
  },
  placeOrderText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: ms(18),
  },
  // --- 5. NEW STYLES FOR OVERLAY ---
  successOverlay: {
    ...StyleSheet.absoluteFillObject, // Covers the entire screen
    backgroundColor: 'rgba(255, 255, 255, 1)', // White background with slight transparency
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensures it sits on top of everything
  },
  successLottie: {
    width: s(350),
    height: s(350),
  },
});
