import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import PopButton from '../../utils/PopButton';

export default function ProfileEditScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useUser();

  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  // Address Dropdown States
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);

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

  const handleUpdate = async () => {
    if (!password.trim()) {
      return Alert.alert(
        'Verification',
        'Please enter your password to confirm changes.',
      );
    }

    if (password.trim() !== user?.password) {
      return Alert.alert('Error', 'Incorrect password.');
    }

    if (!username.trim() || !phone.trim()) {
      return Alert.alert('Error', 'Name and Phone cannot be empty.');
    }

    setLoading(true);

    try {
      // 1. Check unique phone if changed
      if (phone.trim() !== user?.phone) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('phone', phone.trim())
          .neq('id', user.id)
          .maybeSingle();
        if (existing) throw new Error('Mobile number already in use.');
      }

      // 2. Prepare Update Object
      const updateData: any = {
        username: username.trim(),
        phone: phone.trim(),
      };

      // 3. Address Logic: Only update if all dropdowns selected
      if (selectedState && selectedCity && selectedStore) {
        const stateObj = states.find((s) => s.id === selectedState);
        const cityObj = cities.find((c) => c.id === selectedCity);
        const storeObj = stores.find((st) => st.id === selectedStore);
        const newAddress = `${stateObj?.name}, ${cityObj?.name}, ${storeObj?.name}`;

        updateData.state_id = selectedState;
        updateData.city_id = selectedCity;
        updateData.store_id = selectedStore;
        updateData.address = newAddress;
      }

      // 4. Update Supabase
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* PASSWORD VERIFICATION */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter Password (Required)</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Your Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* PERSONAL INFO */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="01XXX..."
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* ADDRESS SECTION */}
            <Text style={styles.helperText}>
              Select all fields to update address
            </Text>

            <View style={styles.dropdownWrapper}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedState}
                  
                  onValueChange={(v) => {
                    setSelectedState(v);
                    if (v !== null) fetchCities(v);
                  }}
                  style={styles.picker}
                  dropdownIconColor="black"
                  mode="dropdown"
                >
                  <Picker.Item
                    label="Select State"
                    value={null}
                    style={styles.pickerItem}
                  />
                  {states.map((s) => (
                    <Picker.Item
                      key={s.id}
                      label={s.name}
                      value={s.id}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCity}
                  onValueChange={(v) => {
                    setSelectedCity(v);
                    if (v !== null) fetchStores(v);
                  }}
                  enabled={cities.length > 0}
                  style={styles.picker}
                  dropdownIconColor="black"
                  mode="dropdown"
                >
                  <Picker.Item
                    label="Select City"
                    value={null}
                    style={styles.pickerItem}
                  />
                  {cities.map((c) => (
                    <Picker.Item
                      key={c.id}
                      label={c.name}
                      value={c.id}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedStore}
                  onValueChange={(v) => setSelectedStore(v)}
                  enabled={stores.length > 0}
                  style={styles.picker}
                  dropdownIconColor="black"
                  mode="dropdown"
                >
                  <Picker.Item
                    label="Select Store"
                    value={null}
                    style={styles.pickerItem}
                  />
                  {stores.map((st) => (
                    <Picker.Item
                      key={st.id}
                      label={st.name}
                      value={st.id}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* FIXED SIZE SUBMIT BUTTON CENTERED */}
            <View style={styles.buttonCenterContainer}>
              <PopButton
                onPress={handleUpdate}
                disabled={loading}
                style={styles.fixedButton}
              >
                <LinearGradient
                  colors={['#4c0079ff', '#a200b1ff']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitText}>
                    {loading ? '...' : 'Save Changes'}
                  </Text>
                </LinearGradient>
              </PopButton>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    paddingTop: vs(20), // Reduced slightly as ScrollView handles content
  },
  scrollContent: {
    padding: ms(20),
    paddingBottom: vs(100), // Extra space at bottom so keyboard doesn't hide button
  },
  card: {
    backgroundColor: 'white',
    borderRadius: ms(20),
    // Removed padding here so we can control it via ScrollView or per-item
  },
  inputGroup: {
    marginBottom: vs(15),
  },
  label: {
    fontSize: ms(14),
    color: '#666',
    marginBottom: vs(6),
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee', // Softer border
    borderRadius: ms(20),
    paddingHorizontal: ms(15),
    height: vs(50), // Fixed responsive height
    fontSize: ms(16),
    color: '#333',
    backgroundColor: '#64008b10', // Light purple tint
  },
  helperText: {
    fontSize: ms(12),
    color: '#999',
    marginBottom: vs(10),
    marginTop: vs(10),
   
  },
  dropdownWrapper: {
    marginBottom: vs(20),
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: ms(25),
    marginBottom: vs(12),
    backgroundColor: '#64008b10',
    height: vs(50),
    justifyContent: 'center', // Important for Android Picker alignment
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: '#333',
  },
  pickerItem: {
    fontSize: ms(14),
    color: '#333',
  },
  // New Styles for Fixed Button
  buttonCenterContainer: {
    alignItems: 'center',
    //marginTop: vs(10),
  },
  fixedButton: {
    width: s(170), // Fixed Width scaled
    height: vs(45), // Fixed Height scaled
    borderRadius: ms(25),
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  submitGradient: {
    flex: 1,
    borderRadius: ms(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: 'white',
    fontSize: ms(16),
    fontWeight: 'bold',
  },
});