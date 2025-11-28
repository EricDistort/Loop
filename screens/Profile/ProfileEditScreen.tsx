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
      return Alert.alert('Verification', 'Please enter your password to confirm changes.');
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
        const stateObj = states.find(s => s.id === selectedState);
        const cityObj = cities.find(c => c.id === selectedCity);
        const storeObj = stores.find(st => st.id === selectedStore);
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
          { text: 'OK', onPress: () => navigation.goBack() }
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
            <Text style={styles.helperText}>Select all fields to update address</Text>
            
            <View style={styles.dropdownWrapper}>
                <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedState}
                    onValueChange={v => {
                    setSelectedState(v);
                    if (v !== null) fetchCities(v);
                    }}
                    style={styles.picker}
                >
                    <Picker.Item label="Select State" value={null} />
                    {states.map(s => (
                    <Picker.Item key={s.id} label={s.name} value={s.id} />
                    ))}
                </Picker>
                </View>

                <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedCity}
                    onValueChange={v => {
                    setSelectedCity(v);
                    if (v !== null) fetchStores(v);
                    }}
                    enabled={cities.length > 0}
                    style={styles.picker}
                >
                    <Picker.Item label="Select City" value={null} />
                    {cities.map(c => (
                    <Picker.Item key={c.id} label={c.name} value={c.id} />
                    ))}
                </Picker>
                </View>

                <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedStore}
                    onValueChange={v => setSelectedStore(v)}
                    enabled={stores.length > 0}
                    style={styles.picker}
                >
                    <Picker.Item label="Select Store" value={null} />
                    {stores.map(st => (
                    <Picker.Item key={st.id} label={st.name} value={st.id} />
                    ))}
                </Picker>
                </View>
            </View>

            {/* FIXED SIZE SUBMIT BUTTON CENTERED */}
            <View style={styles.buttonCenterContainer}>
                <PopButton onPress={handleUpdate} disabled={loading} style={styles.fixedButton}>
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
        
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    //padding: ms(20),
    paddingTop: vs(40), // Added top padding since header is removed
    paddingBottom: vs(50),
  },
  content: {
    padding: ms(20),
    paddingTop: vs(40), // Added top padding since header is removed
    paddingBottom: vs(50),
  },
  card: {
      backgroundColor: 'white',
      borderRadius: ms(20),
      padding: ms(20),
      //elevation: 3,
  },
  inputGroup: {
      marginBottom: vs(15),
  },
  label: {
      fontSize: ms(14),
      color: '#666',
      marginBottom: vs(5),
      fontWeight: '600',
  },
  input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: ms(20),
      paddingHorizontal: ms(15),
      paddingVertical: vs(10),
      fontSize: ms(16),
      color: '#333',
      backgroundColor: '#64008b10',
  },
  divider: {
      height: 1,
      backgroundColor: '#eee',
      marginVertical: vs(15),
  },
  helperText: {
      fontSize: ms(12),
      color: '#999',
      marginBottom: vs(10),
     
  },
  dropdownWrapper: {
      marginBottom: vs(20),
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: ms(25),
    marginBottom: vs(10),
    backgroundColor: '#64008b10',
    justifyContent: 'center',
  },
  picker: {
    height: vs(50),
    color: '#333',
  },
  // New Styles for Fixed Button
  buttonCenterContainer: {
      alignItems: 'center',
      //marginTop: vs(10),
  },
  fixedButton: {
      width: s(170),     // Fixed Width
      height: vs(45),    // Fixed Height
      borderRadius: ms(25),
  },
  submitGradient: {
      flex: 1,           // Fill the fixed button container
      borderRadius: ms(25),
      alignItems: 'center',
      justifyContent: 'center',
  },
  submitText: {
      color: 'white',
      fontSize: ms(14),
      fontWeight: 'bold',
  },
});