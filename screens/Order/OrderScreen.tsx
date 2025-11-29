import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  StatusBar,
  RefreshControl, // 1. Import RefreshControl
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import { useNavigation } from '@react-navigation/native';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

type Order = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
};

const imgConfirmed = require('./OrderMedia/Confirmed.png');
const imgPacked = require('./OrderMedia/Packed.png');
const imgOut = require('./OrderMedia/OutForDelivery.png');
const imgDelivered = require('./OrderMedia/Delivered.png');
const imgCancelled = require('./OrderMedia/Cancelled.png');

export default function UserOrdersScreen() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('purchases')
      .select('id,total_amount,status,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) Alert.alert('Error', error.message);
    else setOrders(data || []);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [user]);

  const filteredOrders = orders.filter(order =>
    order.id.toString().includes(searchQuery),
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const getStatusImage = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'cancelled') return imgCancelled;
    if (s === 'delivered') return imgDelivered;
    if (s.includes('out') || s.includes('delivery')) return imgOut;
    if (s === 'packed') return imgPacked;
    return imgConfirmed;
  };

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      activeOpacity={0.7}
    >
      <Image source={getStatusImage(item.status)} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.name}>Order {item.id}</Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.price}>৳{item.total_amount.toFixed(0)}</Text>
      </View>

      <View style={styles.actionColumn}>
        <View
          style={[
            styles.statusBadge,
            { borderColor: getStatusColor(item.status) },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // 2. Use explicit RefreshControl component
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // 3. This pushes the spinner down by 90 vertical units
            progressViewOffset={vs(90)} 
            colors={['#6c008dff']} // Optional: Match your brand color
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No orders match your search.' : 'No orders found.'}
            </Text>
          </View>
        }
      />

      {/* Sticky Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchIsland}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order ID..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType="numeric"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // --- FLOATING SEARCH BAR STYLES ---
  searchWrapper: {
    position: 'absolute',
    top: vs(25),
    left: 0,
    right: 0,
    paddingHorizontal: ms(20),
    zIndex: 100,
    alignItems: 'center',
  },
  searchIsland: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbf2ffff',
    borderRadius: ms(30),
    borderWidth: 3,
    borderColor: '#ffffffff',
    height: vs(45),
    width: '100%',
    paddingHorizontal: ms(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  searchIcon: {
    fontSize: ms(16),
    marginRight: ms(10),
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: ms(14),
    fontWeight: '600',
    height: '100%',
  },
  clearIcon: {
    color: '#888',
    fontSize: ms(14),
    fontWeight: 'bold',
    marginLeft: ms(5),
    padding: ms(5),
  },
  // --- LIST STYLES ---
  listContent: {
    paddingHorizontal: ms(10),
    paddingBottom: vs(20),
    paddingTop: vs(85), // Vital: Push content down so it starts below the search bar
  },
  emptyContainer: {
    padding: ms(20),
    alignItems: 'center',
    marginTop: vs(20),
  },
  emptyText: {
    color: '#888',
    fontSize: ms(16),
  },
  // --- CARD STYLES ---
  card: {
    flexDirection: 'row',
    backgroundColor: '#64008b10',
    borderRadius: ms(30),
    marginBottom: vs(10),
    paddingRight: ms(15),
    alignItems: 'center',
    overflow: 'hidden',
    height: s(75),
  },
  image: {
    width: s(75),
    height: s(75),
    backgroundColor: '#fff',
    resizeMode: 'cover',
    borderRadius: ms(30),
  },
  info: {
    flex: 1,
    marginLeft: ms(15),
    justifyContent: 'center',
    height: s(75),
    paddingVertical: ms(5),
  },
  name: {
    fontSize: ms(16),
    fontWeight: '900',
    color: '#333',
    marginBottom: vs(2),
  },
  dateText: {
    fontSize: ms(12),
    color: '#666',
    marginBottom: vs(2),
  },
  price: {
    fontSize: ms(15),
    color: '#31313181',
    fontWeight: '700',
  },
  actionColumn: {
    height: s(75),
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: vs(4),
    paddingHorizontal: ms(10),
    borderRadius: ms(12),
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  statusText: {
    fontSize: ms(12),
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
});