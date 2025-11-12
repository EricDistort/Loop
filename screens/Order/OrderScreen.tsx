import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import ScreenWrapper from '../../utils/ScreenWrapper';
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
};

export default function UserOrdersScreen() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('purchases')
      .select('id,total_amount,status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return Alert.alert('Error', error.message);
    setOrders(data || []);
  };

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <Text style={styles.orderId}>Order #{item.id}</Text>
      <Text style={styles.price}>${item.total_amount.toFixed(2)}</Text>
      <Text style={styles.status}>{item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>My Orders</Text>
        <FlatList
          data={orders}
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
    backgroundColor: '#1a1a1a',
    padding: ms(12),
    borderRadius: ms(10),
    marginBottom: vs(10),
    borderWidth: 1,
    borderColor: '#00c6ff33',
  },
  orderId: { color: '#00c6ff', fontSize: ms(16), fontWeight: 'bold' },
  price: {
    color: '#ff00ff',
    fontSize: ms(16),
    fontWeight: 'bold',
    marginTop: vs(4),
  },
  status: { color: '#00ff00', fontSize: ms(14), marginTop: vs(2) },
});
