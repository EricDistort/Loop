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
    const { data, error } = await supabase.from('states').select('*');
    if (!error && data) setStates(data);
  };

  const fetchCities = async (stateId: number) => {
    setCities([]);
    setStores([]);
    setSelectedCity(null);
    setSelectedStore(null);
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('state_id', stateId);
    if (!error && data) setCities(data);
  };

  const fetchStores = async (cityId: number) => {
    setStores([]);
    setSelectedStore(null);
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('city_id', cityId);
    if (!error && data) setStores(data);
  };

  const generateUserId = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000);
  };

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
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.trim())
        .maybeSingle();

      if (existingUser) {
        setLoading(false);
        return Alert.alert('Username already exists');
      }

      const userId = generateUserId();

      // Create address string combining state, city, store
      const stateObj = states.find(s => s.id === selectedState);
      const cityObj = cities.find(c => c.id === selectedCity);
      const storeObj = stores.find(st => st.id === selectedStore);
      const address = `${stateObj?.name}, ${cityObj?.name}, ${storeObj?.name}`;

      const { data: insertedUser, error: insertError } = await supabase
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

      if (insertError) throw insertError;

      setLoading(false);
      setUser(insertedUser);
      navigation.replace('Main');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Registration Error', error.message);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim())
      return Alert.alert('Fill all fields');
    setLoading(true);
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .maybeSingle();

      if (error) throw error;
      if (!user) {
        setLoading(false);
        return Alert.alert('User not found');
      }

      if (user.password === password.trim()) {
        setLoading(false);
        setUser(user);
        navigation.replace('Main');
      } else {
        setLoading(false);
        Alert.alert('Invalid password');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Login Error', error.message);
    }
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.safeArea}>
        {loading && (
          <View style={styles.fullScreenContainer}>
            <LottieView
              source={require('./LoginMedia/loginanimation2.json')}
              autoPlay
              loop
              style={styles.fullScreenAnimation}
            />
          </View>
        )}
        <LinearGradient
          colors={['#00c6ff', '#ff00ff']}
          style={{ padding: ms(2), borderRadius: ms(14) }}
        >
          <View style={styles.container}>
            <Text style={styles.title}>Login / Register</Text>

            <TextInput
              placeholder="Username"
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#00c8ff56"
            />
            <TextInput
              placeholder="Password"
              style={styles.input}
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              autoCapitalize="none"
              placeholderTextColor="#00c8ff56"
            />
            <TextInput
              placeholder="Phone Number"
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#00c8ff56"
            />

            {/* State Dropdown */}
            <View style={styles.dropdownContainer}>
              <Picker
                selectedValue={selectedState}
                onValueChange={itemValue => {
                  setSelectedState(itemValue);
                  if (itemValue !== null) fetchCities(itemValue);
                }}
                style={styles.picker}
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

            {/* City Dropdown */}
            <View style={styles.dropdownContainer}>
              <Picker
                selectedValue={selectedCity}
                onValueChange={itemValue => {
                  setSelectedCity(itemValue);
                  if (itemValue !== null) fetchStores(itemValue);
                }}
                style={styles.picker}
                enabled={cities.length > 0}
              >
                <Picker.Item label="Select City" value={null} />
                {cities.map(city => (
                  <Picker.Item
                    key={city.id}
                    label={city.name}
                    value={city.id}
                  />
                ))}
              </Picker>
            </View>

            {/* Store Dropdown */}
            <View style={styles.dropdownContainer}>
              <Picker
                selectedValue={selectedStore}
                onValueChange={itemValue => setSelectedStore(itemValue)}
                style={styles.picker}
                enabled={stores.length > 0}
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
    padding: ms(8),
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
  },
  fullScreenAnimation: {
    width: s(620),
    height: s(620),
    backgroundColor: 'black',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    padding: s(14),
    backgroundColor: 'black',
    height: vs(600),
    width: s(300),
    borderRadius: ms(14),
    borderWidth: ms(2),
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  title: {
    fontSize: ms(26),
    marginBottom: vs(22),
    color: '#00c6ff',
    fontWeight: 'bold',
  },
  input: {
    width: '80%',
    paddingVertical: ms(10),
    marginBottom: vs(12),
    backgroundColor: 'transparent',
    color: '#00c6ff',
    borderRadius: ms(4),
    fontSize: ms(17),
    borderBottomWidth: 0.5,
    borderBottomColor: '#00c8ff7e',
  },
  dropdownContainer: {
    width: '80%',
    marginBottom: vs(12),
    borderBottomWidth: 0.5,
    borderBottomColor: '#00c8ff7e',
    borderRadius: ms(4),
  },
  picker: { color: '#00c6ff', backgroundColor: 'black' },
  button: {
    padding: ms(14),
    borderRadius: ms(8),
    marginTop: vs(12),
    alignItems: 'center',
    backgroundColor: '#ff00ffbd',
    width: '48%',
  },
  btntxt: { color: '#fff', fontWeight: 'bold', fontSize: ms(17) },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    alignItems: 'center',
    marginTop: vs(12),
  },
});
