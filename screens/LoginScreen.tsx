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

        {/* LinearGradient now acts as the main card container */}
        <LinearGradient
          colors={['#340052ff', '#b300b3ff']}
          start={{ x: 0, y: 1 }} // top-left corner
          end={{ x: 1, y: 0 }}
          style={styles.gradientCard}
        >
          <Text style={styles.title}>Login / Register</Text>

          <TextInput
            placeholder="Username"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            autoCapitalize="none"
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
          />
          <TextInput
            placeholder="Phone Number"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
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
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }} // For iOS
            >
              <Picker.Item
                label="Select State"
                value={null}
                style={styles.pickerItem}
              />
              {states.map(state => (
                <Picker.Item
                  key={state.id}
                  label={state.name}
                  value={state.id}
                  style={styles.pickerItem}
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
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }} // For iOS
            >
              <Picker.Item
                label="Select City"
                value={null}
                style={styles.pickerItem}
              />
              {cities.map(city => (
                <Picker.Item
                  key={city.id}
                  label={city.name}
                  value={city.id}
                  style={styles.pickerItem}
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
              dropdownIconColor="white"
              itemStyle={{ color: 'white' }} // For iOS
            >
              <Picker.Item
                label="Select Store"
                value={null}
                style={styles.pickerItem}
              />
              {stores.map(store => (
                <Picker.Item
                  key={store.id}
                  label={store.name}
                  value={store.id}
                  style={styles.pickerItem}
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
  // Updated to be the main container card
  gradientCard: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    padding: s(5),
    height: vs(500),
    width: s(300),
    borderRadius: ms(50),
    // Added shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: ms(26),
    marginBottom: vs(22),
    color: 'white', // White for contrast on gradient
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowRadius: 3,
  },
  input: {
    width: '80%',
    paddingVertical: ms(10),
    marginBottom: vs(12),
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent white
    color: 'white',
    borderRadius: ms(30),
    fontSize: ms(17),

    paddingHorizontal: ms(10),
  },
  dropdownContainer: {
    width: '80%',
    marginBottom: vs(12),

    borderRadius: ms(30),
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Match input style
  },
  picker: {
    color: 'white',
  },
  pickerItem: {
    color: 'black', // Native picker items usually need dark text on white background when popped up
    fontSize: ms(14),
  },
  button: {
    padding: ms(14),
    borderRadius: ms(80),
    marginTop: vs(12),
    alignItems: 'center',
    backgroundColor: 'white', // White buttons pop on the gradient
    width: '48%',
    elevation: 2,
  },
  btntxt: {
    color: '#340052ff', // Gradient-ish color for text
    fontWeight: 'bold',
    fontSize: ms(17),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    alignItems: 'center',
    marginTop: vs(12),
  },
});
