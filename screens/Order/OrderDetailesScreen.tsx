import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity, // Still imported for non-animated areas if any
  Linking,
  StatusBar,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import LottieView from 'lottie-react-native';

// 1. IMPORT POP BUTTON
import PopButton from '../../utils/PopButton';

// --- LOTTIE ANIMATION IMPORTS ---
const animConfirmed = require('./OrderMedia/Confirmed.json');
const animPacked = require('./OrderMedia/Packed.json');
const animOutForDelivery = require('./OrderMedia/OutForDelivery.json');
const animDelivered = require('./OrderMedia/Delivered.json');
const animCancelled = require('./OrderMedia/Cancelled.json');

type JsonOrderItem = {
  product_id: number;
  quantity: number;
  price: number;
};

type ProductInfo = {
  id: number;
  name: string;
  brand: string;
  image_url: string;
};

type DisplayItem = {
  quantity: number;
  price: number;
  productDetails?: ProductInfo;
};

type OrderDetails = {
  id: number;
  status: string;
  delivery_address: string;
  location: string | null;
  total_amount: number;
  created_at: string;
  products: JsonOrderItem[];
};

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- COPY BUTTON STATE ---
  const [copyState, setCopyState] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const currentOrder = orderData as OrderDetails;
      setOrder(currentOrder);

      const productIds = currentOrder.products.map(p => p.product_id);

      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, brand, image_url')
          .in('id', productIds);

        if (productsError) throw productsError;

        const mergedItems: DisplayItem[] = currentOrder.products.map(jsonItem => {
          const details = productsData?.find(p => p.id === jsonItem.product_id);
          return {
            quantity: jsonItem.quantity,
            price: jsonItem.price,
            productDetails: details,
          };
        });

        setDisplayItems(mergedItems);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const openLocation = () => {
    if (order?.location) {
      Linking.openURL(order.location).catch(err =>
        Alert.alert('Error', 'Could not open map link'),
      );
    }
  };

  // --- COPY LOGIC ---
  const handleCopyOrderId = () => {
    if (!order?.id) return;

    setCopyState('loading');
    Clipboard.setString(order.id.toString());

    setTimeout(() => {
      setCopyState('success');
      setTimeout(() => {
        setCopyState('idle');
      }, 2000);
    }, 500); 
  };

  const handleCancelOrder = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('purchases')
              .update({ status: 'Cancelled' })
              .eq('id', orderId);

            if (error) throw error;

            if (order) {
              setOrder({ ...order, status: 'Cancelled' });
            }
            Alert.alert('Success', 'Order has been cancelled.');
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'confirmed':
        return '#ff9900';
      case 'packed':
        return '#6c008dff';
      case 'out for delivery':
        return '#007bff';
      case 'delivered':
        return '#00aa00';
      case 'cancelled':
        return '#ff0000';
      default:
        return '#6c008dff';
    }
  };

  const getStatusAnimation = (status: string = '') => {
    const s = status.toLowerCase();
    if (s === 'cancelled') return animCancelled;
    if (s === 'delivered') return animDelivered;
    if (s.includes('out') || s.includes('delivery')) return animOutForDelivery;
    if (s === 'packed') return animPacked;
    return animConfirmed;
  };

  const showCancelButton =
    order?.status === 'Pending' || order?.status === 'Confirmed';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c008dff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 1. Header Lottie Animation */}
      <View style={styles.headerImageContainer}>
        <LottieView
          source={getStatusAnimation(order?.status)}
          autoPlay
          loop
          style={styles.lottieHeader}
          resizeMode="cover"
        />
      </View>

      {/* 2. Status & Cancel Button Row */}
      <View style={styles.metaRow}>
        <View
          style={[
            styles.statusBadge,
            { borderColor: getStatusColor(order?.status || '') },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(order?.status || '') },
            ]}
          >
            {order?.status}
          </Text>
        </View>

        {showCancelButton && (
          // 2. POP ANIMATION: Cancel Button
          <PopButton
            onPress={handleCancelOrder}
            style={[
              styles.statusBadge,
              { borderColor: '#cc0000ff', marginLeft: ms(10), backgroundColor: '#ff0000ff'},
            ]}
          >
            <Text style={[styles.statusText, { color: '#ffffffff' }]}>
              Cancel
            </Text>
          </PopButton>
        )}
      </View>

      {/* 3. Items Section */}
      <View style={styles.section}>
        <View style={styles.itemsScrollContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {displayItems.map((item, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.productDetails?.image_url }}
                    style={styles.itemImage}
                  />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.productDetails?.name || 'Unknown Product'}
                  </Text>
                  {item.productDetails?.brand ? (
                    <Text style={styles.brandText}>
                      {item.productDetails.brand}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.actionColumn}>
                  <View style={styles.priceQtyRow}>
                    <Text style={styles.quantityTextRight}>
                      {item.quantity}x
                    </Text>
                    <Text style={styles.price}>
                      ৳{(item.quantity * item.price).toFixed(0)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.totalRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.orderIdBottom}>Order #{order?.id}</Text>
            
            {/* 3. POP ANIMATION: Copy Button */}
            <PopButton
              onPress={handleCopyOrderId}
              style={[
                styles.copyButton,
                copyState === 'success' && { backgroundColor: '#e0ffe0' }, 
              ]}
              disabled={copyState !== 'idle'} 
            >
              {copyState === 'loading' ? (
                <ActivityIndicator size="small" color="#666" />
              ) : copyState === 'success' ? (
                <Text style={[styles.copyButtonText, { color: 'green', fontSize: ms(14) }]}>✓</Text>
              ) : (
                <Text style={styles.copyButtonText}>❐</Text>
              )}
            </PopButton>
          </View>

          <View style={styles.totalRightContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ৳{order?.total_amount.toFixed(0)}
            </Text>
          </View>
        </View>
      </View>

      {/* 4. Delivery Details */}
      <View style={styles.addressContainer}>
       
        <View style={styles.addressRow}>
          <View style={{ flex: 1, marginRight: ms(10) }}>
            <Text style={styles.detailValue}>
              {order?.delivery_address || 'No address provided'}
            </Text>
          </View>

          {order?.location ? (
            // 4. POP ANIMATION: Location Button
            <PopButton style={styles.locationBtn} onPress={openLocation}>
              <Text style={styles.locationBtnText}>Location</Text>
            </PopButton>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  headerImageContainer: {
    width: '100%',
    height: vs(320),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieHeader: {
    width: '90%',
    height: '90%',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(-10),
    paddingHorizontal: ms(20),
    marginBottom: vs(10),
  },
  statusBadge: {
    paddingVertical: vs(4),
    paddingHorizontal: ms(12),
    borderRadius: ms(20),
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  statusText: {
    fontSize: ms(12),
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: ms(20),
  },
  sectionTitle: {
    fontSize: ms(16),
    fontWeight: '900',
    color: '#340052ff',
    marginBottom: vs(10),
  },
  itemsScrollContainer: {
    maxHeight: vs(120),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#64008b10',
    borderRadius: ms(20),
    marginBottom: vs(10),
    padding: 0,
    paddingRight: ms(10),
    alignItems: 'center',
    overflow: 'hidden',
    height: s(60),
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: ms(20),
    overflow: 'hidden',
  },
  itemImage: {
    width: s(60),
    height: s(60),
    backgroundColor: '#eee',
    borderRadius: 20,
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
    justifyContent: 'center',
    height: s(50),
    paddingRight: ms(5),
  },
  priceQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityTextRight: {
    fontSize: ms(13),
    color: '#555',
    marginRight: ms(8),
  },
  price: {
    fontSize: ms(16),
    color: '#340052ff',
    fontWeight: '900',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(10),
    paddingRight: ms(5),
  },
  orderIdBottom: {
    fontSize: ms(16),
    fontWeight: 'bold',
    color: '#333',
  },
  // --- ROUNDED COPY BUTTON STYLES ---
  copyButton: {
    marginLeft: ms(10),
    backgroundColor: '#f0f0f0',
    borderRadius: ms(20),
    width: ms(30), 
    height: ms(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: ms(14),
    color: '#666',
    fontWeight: 'bold',
  },
  totalRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: ms(16),
    fontWeight: 'bold',
    color: '#333',
    marginRight: ms(10),
  },
  totalValue: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#340052ff',
  },
  addressContainer: {
    paddingHorizontal: ms(20),
    paddingTop: vs(20),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: vs(30),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailValue: {
    fontSize: ms(14),
    color: '#333',
    lineHeight: ms(20),
  },
  locationBtn: {
    backgroundColor: '#e0ffe0',
    paddingVertical: vs(8),
    paddingHorizontal: ms(12),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00aa0020',
  },
  locationBtnText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: ms(12),
  },
});