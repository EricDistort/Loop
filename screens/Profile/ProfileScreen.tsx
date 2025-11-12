import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import ScreenWrapper from '../../utils/ScreenWrapper';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';

type UserProfile = {
  id: number;
  username: string;
  phone: string;
  state_name: string;
  city_name: string;
  store_name: string;
  created_at: string;
};

export default function ProfileScreen() {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // 1. Fetch user basic info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (userError || !userData)
        throw userError || new Error('User not found');

      // 2. Fetch state name
      const { data: stateData } = await supabase
        .from('states')
        .select('name')
        .eq('id', userData.state_id)
        .maybeSingle();

      // 3. Fetch city name
      const { data: cityData } = await supabase
        .from('cities')
        .select('name')
        .eq('id', userData.city_id)
        .maybeSingle();

      // 4. Fetch store name
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', userData.store_id)
        .maybeSingle();

      setProfile({
        id: userData.id,
        username: userData.username,
        phone: userData.phone,
        state_name: stateData?.name || 'N/A',
        city_name: cityData?.name || 'N/A',
        store_name: storeData?.name || 'N/A',
        created_at: userData.created_at,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (!profile) return null;

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.value}>{profile.id}</Text>

          <Text style={styles.label}>Username:</Text>
          <Text style={styles.value}>{profile.username}</Text>

          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{profile.phone}</Text>

          <Text style={styles.label}>State:</Text>
          <Text style={styles.value}>{profile.state_name}</Text>

          <Text style={styles.label}>City:</Text>
          <Text style={styles.value}>{profile.city_name}</Text>

          <Text style={styles.label}>Store:</Text>
          <Text style={styles.value}>{profile.store_name}</Text>

          <Text style={styles.label}>Joined On:</Text>
          <Text style={styles.value}>
            {new Date(profile.created_at).toLocaleDateString()}
          </Text>
        </View>
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
  infoContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: ms(10),
    padding: ms(12),
    borderWidth: 1,
    borderColor: '#00c6ff33',
  },
  label: { color: '#00c6ff', fontSize: ms(14), marginTop: vs(6) },
  value: {
    color: '#ff00ff',
    fontSize: ms(16),
    fontWeight: 'bold',
    marginTop: vs(2),
  },
});
