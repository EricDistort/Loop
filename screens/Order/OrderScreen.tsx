import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
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

// --- STATUS IMAGES ---
const imgConfirmed = require('./OrderMedia/Confirmed.png'); // Default/Pending
const imgPacked = require('./OrderMedia/Packed.png');
const imgOut = require('./OrderMedia/OutForDelivery.png');
const imgDelivered = require('./OrderMedia/Delivered.png');
const imgCancelled = require('./OrderMedia/Cancelled.png');

export default function UserOrdersScreen() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
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

  // --- HELPER TO GET IMAGE BASED ON STATUS ---
  const getStatusImage = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'cancelled') return imgCancelled;
    if (s === 'delivered') return imgDelivered;
    if (s.includes('out') || s.includes('delivery')) return imgOut;
    if (s === 'packed') return imgPacked;
    return imgConfirmed; // Covers Confirmed & Pending
  };

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      activeOpacity={0.7}
    >
      {/* 1. Dynamic Image Section */}
      <Image source={getStatusImage(item.status)} style={styles.image} />

      {/* 2. Info Section */}
      <View style={styles.info}>
        <Text style={styles.name}>Order {item.id}</Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.price}>৳{item.total_amount.toFixed(0)}</Text>
      </View>

      {/* 3. Action Column (Status) */}
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
      <Text style={styles.headerTitle}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: vs(15),
    paddingHorizontal: ms(10),
  },
  headerTitle: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#340052ff',
    marginBottom: vs(15),
    marginLeft: ms(5),
  },
  listContent: {
    paddingBottom: vs(20),
  },
  emptyContainer: {
    padding: ms(20),
    alignItems: 'center',
    marginTop: vs(50),
  },
  emptyText: {
    color: '#888',
    fontSize: ms(16),
  },
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
    backgroundColor: '#fff', // Changed to white to blend better if transparent png
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
