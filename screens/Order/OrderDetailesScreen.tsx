import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import ScreenWrapper from '../../utils/ScreenWrapper';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

type OrderDetail = {
  id: number;
  total_amount: number;
  status: string;
  address: string;
  detailed_address: string;
  created_at: string;
  updated_at: string;
};

export default function OrderDetailScreen({ route }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    fetchOrderDetail();
  }, []);

  const fetchOrderDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (error || !data) throw error || new Error('Order not found');

      setOrder(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (!order) return null;

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Order #{order.id}</Text>
        <Text style={styles.status}>Status: {order.status}</Text>
        <Text style={styles.address}>Address: {order.address}</Text>
        <Text style={styles.address}>Details: {order.detailed_address}</Text>
        <Text style={styles.amount}>
          Total Amount: ${order.total_amount.toFixed(2)}
        </Text>
        <Text style={styles.date}>
          Ordered on: {new Date(order.created_at).toLocaleString()}
        </Text>
        <Text style={styles.date}>
          Last Updated: {new Date(order.updated_at).toLocaleString()}
        </Text>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, padding: ms(10), backgroundColor: 'black' },
  title: {
    fontSize: ms(22),
    fontWeight: 'bold',
    color: '#00c6ff',
    marginBottom: vs(6),
  },
  status: { fontSize: ms(16), color: '#00ff00', marginBottom: vs(4) },
  address: { fontSize: ms(14), color: '#00c6ff', marginBottom: vs(2) },
  amount: {
    fontSize: ms(16),
    color: '#ff00ff',
    fontWeight: 'bold',
    marginTop: vs(6),
  },
  date: { fontSize: ms(12), color: '#00c6ff', marginTop: vs(2) },
});
