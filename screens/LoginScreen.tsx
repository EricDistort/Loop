import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import LinearGradient from 'react-native-linear-gradient';
import { supabase } from '../utils/supabaseClient';
import { useUser } from '../utils/UserContext';
import ScreenWrapper from '../utils/ScreenWrapper';
import LottieView from 'lottie-react-native';

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export default function LoginRegister() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setUser } = useUser();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    const { data } = await supabase.from('states').select('*');
    if (data) setStates(data);
  };

  const fetchCities = async (stateId: number) => {
    setCities([]);
    setStores([]);
    setSelectedCity(null);
    setSelectedStore(null);
    const { data } = await supabase
      .from('cities')
      .select('*')
      .eq('state_id', stateId);
    if (data) setCities(data);
  };

  const fetchStores = async (cityId: number) => {
    setStores([]);
    setSelectedStore(null);
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('city_id', cityId);
    if (data) setStores(data);
  };

  const generateUserId = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000);
  };

  // REGISTER
  const handleRegister = async () => {
    if (
      !username.trim() ||
      !password.trim() ||
      !phone.trim() ||
      !selectedState ||
      !selectedCity ||
      !selectedStore
    )
      return Alert.alert('Fill all fields');

    setLoading(true);

    try {
      // Check if phone number already exists
      const { data: existingPhone } = await supabase
        .from('users')
        .select('phone')
        .eq('phone', phone.trim())
        .maybeSingle();

      if (existingPhone) {
        setLoading(false);
        return Alert.alert('Mobile number already registered');
      }

      const userId = generateUserId();

      const stateObj = states.find(s => s.id === selectedState);
      const cityObj = cities.find(c => c.id === selectedCity);
      const storeObj = stores.find(st => st.id === selectedStore);

      const address = `${stateObj?.name}, ${cityObj?.name}, ${storeObj?.name}`;

      const { data: insertedUser, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            username: username.trim(),
            password: password.trim(),
            phone: phone.trim(),
            state_id: selectedState,
            city_id: selectedCity,
            store_id: selectedStore,
            address: address,
          },
        ])
        .select('*')
        .single();

      if (error) throw error;

      setLoading(false);
      setUser(insertedUser);
      navigation.replace('Main');
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Registration Error', e.message);
    }
  };

  // LOGIN (phone + password)
  const handleLogin = async () => {
    if (!phone.trim() || !password.trim())
      return Alert.alert('Fill all fields');

    setLoading(true);
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone.trim())
        .maybeSingle();

      if (error) throw error;
      if (!user) {
        setLoading(false);
        return Alert.alert('Mobile number not registered');
      }

      if (user.password === password.trim()) {
        setLoading(false);
        setUser(user);
        navigation.replace('Main');
      } else {
        setLoading(false);
        Alert.alert('Invalid password');
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Login Error', e.message);
    }
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.safeArea}>
        {loading && (
          <View style={styles.fullScreenContainer}>
            <LottieView
              source={require('./LoginMedia/Loading.json')}
              autoPlay
              loop
              style={styles.fullScreenAnimation}
            />
          </View>
        )}

        <LinearGradient
          colors={['#340052ff', '#a700b6ff']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientCard}
        >
          <Text style={styles.title}>Login / Register</Text>

          <TextInput
            placeholder="Nickname"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholderTextColor="rgba(255,255,255,0.7)"
          />

          <TextInput
            placeholder="Mobile No. 01XXX"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="rgba(255,255,255,0.7)"
          />

          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            autoCapitalize="none"
            placeholderTextColor="rgba(255,255,255,0.7)"
          />

          {/* State */}
          <View style={styles.dropdownContainer}>
            <Picker
              selectedValue={selectedState}
              onValueChange={v => {
                setSelectedState(v);
                if (v !== null) fetchCities(v);
              }}
              style={styles.picker}
              dropdownIconColor="white"
            >
              <Picker.Item label="Select State" value={null} />
              {states.map(state => (
                <Picker.Item
                  key={state.id}
                  label={state.name}
                  value={state.id}
                />
              ))}
            </Picker>
          </View>

          {/* City */}
          <View style={styles.dropdownContainer}>
            <Picker
              selectedValue={selectedCity}
              onValueChange={v => {
                setSelectedCity(v);
                if (v !== null) fetchStores(v);
              }}
              enabled={cities.length > 0}
              style={styles.picker}
              dropdownIconColor="white"
            >
              <Picker.Item label="Select City" value={null} />
              {cities.map(city => (
                <Picker.Item key={city.id} label={city.name} value={city.id} />
              ))}
            </Picker>
          </View>

          {/* Store */}
          <View style={styles.dropdownContainer}>
            <Picker
              selectedValue={selectedStore}
              onValueChange={v => setSelectedStore(v)}
              enabled={stores.length > 0}
              style={styles.picker}
              dropdownIconColor="white"
            >
              <Picker.Item label="Select Store" value={null} />
              {stores.map(store => (
                <Picker.Item
                  key={store.id}
                  label={store.name}
                  value={store.id}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleLogin} style={styles.button}>
              <Text style={styles.btntxt}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRegister} style={styles.button}>
              <Text style={styles.btntxt}>Register</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'white',
  },
  fullScreenAnimation: {
    width: s(350),
    height: s(350),
    backgroundColor: 'white',
  },
  gradientCard: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(5),
    height: vs(500),
    width: s(300),
    borderRadius: ms(50),
  },
  title: {
    fontSize: ms(26),
    marginBottom: vs(22),
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    width: '80%',
    paddingVertical: ms(10),
    marginBottom: vs(12),
    color: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ffffff7e',
    fontSize: ms(17),
    paddingHorizontal: ms(8),
  },
  dropdownContainer: {
    width: '80%',
    marginBottom: vs(12),
    borderBottomWidth: 0.5,
    borderBottomColor: '#ffffff7e',
  },
  picker: { color: 'rgba(255, 255, 255, 0.7)', fontSize: ms(17) },
  button: {
    padding: ms(14),
    borderRadius: ms(80),
    marginTop: vs(12),
    backgroundColor: 'white',
    width: '48%',
    alignItems: 'center',
  },
  btntxt: {
    color: '#340052ff',
    fontWeight: 'bold',
    fontSize: ms(17),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
});
