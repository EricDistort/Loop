import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
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

// 1. IMPORT POP BUTTON
import PopButton from '../utils/PopButton';

const { width, height } = Dimensions.get('window');

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

  // --- NEW HELPER: FORCE 5 SECOND WAIT ---
  const playSuccessAnimation = async () => {
    // 1. Show the Lottie Animation
    setLoading(true);
    // 2. Wait strictly for 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
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

    // Start showing loading spinner immediately for API call
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

      // --- SUCCESS: PLAY ANIMATION FOR 5 SECONDS ---
      // We are already loading, but let's ensure the 5s timer runs now
      // Since API is done, we just wait to let animation play
      await new Promise(resolve => setTimeout(resolve, 5000));

      setUser(insertedUser);
      // Animation finishes, screen switches
      setLoading(false);
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
        // --- SUCCESS: PLAY ANIMATION FOR 5 SECONDS ---
        // API check passed. Wait 5s for visual effect.
        await new Promise(resolve => setTimeout(resolve, 5000));

        setUser(user);
        setLoading(false);
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%' }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                placeholder="Create Password"
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
                  mode="dropdown" // Better UI on Android
                >
                  <Picker.Item
                    label="Select Zila"
                    value={null}
                    style={{ fontSize: ms(14) }}
                  />
                  {states.map(state => (
                    <Picker.Item
                      key={state.id}
                      label={state.name}
                      value={state.id}
                      style={{ fontSize: ms(14) }}
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
                  mode="dropdown"
                >
                  <Picker.Item
                    label="Select Upozila"
                    value={null}
                    style={{ fontSize: ms(14) }}
                  />
                  {cities.map(city => (
                    <Picker.Item
                      key={city.id}
                      label={city.name}
                      value={city.id}
                      style={{ fontSize: ms(14) }}
                    />
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
                  mode="dropdown"
                >
                  <Picker.Item
                    label="Select Area"
                    value={null}
                    style={{ fontSize: ms(14) }}
                  />
                  {stores.map(store => (
                    <Picker.Item
                      key={store.id}
                      label={store.name}
                      value={store.id}
                      style={{ fontSize: ms(14) }}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.buttonContainer}>
                {/* PopButton for Login */}
                <PopButton onPress={handleLogin} style={styles.button}>
                  <Text style={styles.btntxt}>Login</Text>
                </PopButton>

                {/* PopButton for Register */}
                <PopButton onPress={handleRegister} style={styles.button}>
                  <Text style={styles.btntxt}>Register</Text>
                </PopButton>
              </View>
            </LinearGradient>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vs(20), // Adds safety padding on small screens
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Increased zIndex to ensure it covers everything
    backgroundColor: 'white',
  },
  fullScreenAnimation: {
    width: s(300), // Adjusted to be safer on smaller screens
    height: s(300),
    backgroundColor: 'white',
  },
  gradientCard: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vs(30), // Dynamic height based on content
    paddingHorizontal: s(5),
    width: s(300),
    borderRadius: ms(50),
    // Removed fixed height to allow card to grow with errors/content
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
    // Added height constraint for better alignment
    height: vs(50),
    justifyContent: 'center',
  },
  picker: {
    color: 'white',

    // Note: fontSize in style prop often ignored by Android Picker,
    // so we added it to Picker.Item as well where applicable
  },
  button: {
    borderRadius: ms(22),
    marginTop: vs(12),
    backgroundColor: 'white',
    width: s(110),
    height: vs(45),
    justifyContent: 'center',
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
    marginTop: vs(10),
  },
});
