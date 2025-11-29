import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  StatusBar,
  ActivityIndicator,
  Clipboard,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  stores?: {
    live_location: string | null;
  };
};

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- COPY BUTTON STATE ---
  const [copyState, setCopyState] = useState<'idle' | 'loading' | 'success'>(
    'idle',
  );

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('purchases')
        .select('*, stores(live_location)')
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

        const mergedItems: DisplayItem[] = currentOrder.products.map(
          jsonItem => {
            const details = productsData?.find(
              p => p.id === jsonItem.product_id,
            );
            return {
              quantity: jsonItem.quantity,
              price: jsonItem.price,
              productDetails: details,
            };
          },
        );

        setDisplayItems(mergedItems);
      }
    } catch (error: any) {
      console.error('Error fetching order:', error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const openLocation = () => {
    if (order?.location) {
      Linking.openURL(order.location).catch(() => {}); // Silently fail
    }
  };

  // --- LIVE TRACKING LOGIC ---
  const handleTrackDelivery = () => {
    const liveLink = order?.stores?.live_location;
    if (liveLink) {
      Linking.openURL(liveLink).catch(() => {}); // Silently fail
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

  // --- CANCEL LOGIC (Direct execution, no alert) ---
  const handleCancelOrder = async () => {
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ status: 'Cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      if (order) {
        setOrder({ ...order, status: 'Cancelled' });
      }
    } catch (err: any) {
      console.error('Error cancelling order:', err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'confirmed':
        return '#ff9900';
      case 'packed':
        return '#6c008dff';
      case 'out for delivery':
      case 'outfordelivery':
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

  const showTrackButton =
    order?.status?.toLowerCase() === 'out for delivery' ||
    order?.status?.toLowerCase() === 'outfordelivery';

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
          resizeMode="contain" // Contain ensures full animation visibility
        />
      </View>

      {/* 2. Status & Action Buttons Row */}
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

        {/* CANCEL BUTTON (Direct action) */}
        {showCancelButton && (
          <PopButton
            onPress={handleCancelOrder}
            style={[
              styles.statusBadge,
              {
                borderColor: '#ff0000',
                marginLeft: ms(10),
                backgroundColor: '#ff0000ff',
              },
            ]}
          >
            <Text style={[styles.statusText, { color: '#ffffffff' }]}>
              Cancel
            </Text>
          </PopButton>
        )}

        {/* TRACK BUTTON */}
        {showTrackButton && (
          <PopButton
            onPress={handleTrackDelivery}
            style={[
              styles.statusBadge,
              {
                borderColor: '#007bff',
                marginLeft: ms(10),
                backgroundColor: '#007bff',
              },
            ]}
          >
            <Text style={[styles.statusText, { color: '#ffffff' }]}>Track</Text>
          </PopButton>
        )}
      </View>

      {/* 3. Items Section */}
      <View style={styles.section}>
        <View style={styles.itemsScrollContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: vs(10) }}
          >
            {displayItems.map((item, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.productDetails?.image_url }}
                    style={styles.itemImage}
                    resizeMode="cover"
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

            {/* Copy Button */}
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
                <Text
                  style={[
                    styles.copyButtonText,
                    { color: 'green', fontSize: ms(14) },
                  ]}
                >
                  ✓
                </Text>
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
            // Location Button
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
    height: vs(320), // Reduced slightly to allow more room for content
    backgroundColor: '#ffffffff',
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
    marginTop: vs(-20), // Pull up slightly closer to animation
    paddingHorizontal: ms(20),
    marginBottom: vs(15),
  },
  statusBadge: {
    paddingVertical: vs(6),
    paddingHorizontal: ms(14),
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
    // Increased height to show more items without scrolling the tiny window
    maxHeight: vs(120),
    marginBottom: vs(10),
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
    height: s(60), // Increased slightly for better breathing room
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
    borderRadius: ms(20), // Scaled radius
  },
  info: {
    flex: 1,
    marginLeft: ms(12),
    justifyContent: 'center',
    height: s(72),
  },
  name: {
    fontSize: ms(15),
    fontWeight: '900',
    color: '#562e63ff',
  },
  brandText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: '#8f7896ff',
  },
  actionColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: s(72),
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
    paddingTop: vs(5),
  },
  orderIdBottom: {
    fontSize: ms(15),
    fontWeight: 'bold',
    color: '#333',
  },
  // --- ROUNDED COPY BUTTON STYLES ---
  copyButton: {
    marginLeft: ms(10),
    backgroundColor: '#f0f0f0',
    borderRadius: ms(15),
    width: s(30),
    height: s(30),
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
    paddingTop: vs(10),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: vs(30),
    flex: 1, // Fill remaining space
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
