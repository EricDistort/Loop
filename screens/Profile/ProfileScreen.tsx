import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import LinearGradient from 'react-native-linear-gradient';
import { supabase } from '../../utils/supabaseClient';
import { useUser } from '../../utils/UserContext';
import PopButton from '../../utils/PopButton';

export default function ProfileScreen() {
  const { user, setUser } = useUser();
  const navigation = useNavigation<any>();
  const [copyLabel, setCopyLabel] = useState('❐');
  const [applying, setApplying] = useState(false);

  const handleLogout = () => {
    setUser(null);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'US';
  };

  const handleCopyId = () => {
    if (user?.id) {
      Clipboard.setString(user.id.toString());
      setCopyLabel('✓');
      setTimeout(() => setCopyLabel('❐'), 2000);
    }
  };

  const handleDeactivate = () => {
    Alert.alert('Deactivate', 'Are you sure you want to deactivate?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive' },
    ]);
  };

  const navigateToEdit = () => {
    navigation.navigate('ProfileEdit');
  };

  const handleApplyLooper = async () => {
    if (!user) return;
    setApplying(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ looper: 'applied' })
        .eq('id', user.id);

      if (error) throw error;

      // Update local context
      setUser({ ...user, looper: 'applied' });
      // Alert removed as requested
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setApplying(false);
    }
  };

  const isApplied = user?.looper === 'applied';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#340052ff" />

      {/* HEADER */}
      <LinearGradient
        colors={['#340052ff', '#a700b6ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerRow}
      >
        <View style={styles.userInfoSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {getInitials(user?.username || '')}
            </Text>
          </View>
          <View style={styles.textColumn}>
            <Text style={styles.usernameText} numberOfLines={1}>
              {user?.username || 'Guest User'}
            </Text>

            <View style={styles.idRow}>
              <Text style={styles.userIdText}>{user?.id}</Text>
              <PopButton onPress={handleCopyId} style={styles.copyBtn}>
                <Text style={styles.copyText}>{copyLabel}</Text>
              </PopButton>
            </View>
          </View>
        </View>

        <PopButton onPress={handleLogout} style={styles.logoutBtnSmall}>
          <Text style={styles.logoutTextSmall}>Log Out</Text>
        </PopButton>
      </LinearGradient>

      {/* BODY CONTENT */}
      <View style={styles.bodyContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Contact Information</Text>

            {/* Mobile */}
            <View style={styles.dataRow}>
              <View style={styles.dataContent}>
                <Text style={styles.subtitle}>Mobile Number</Text>
                <Text style={styles.bodyText}>{user?.phone || 'N/A'}</Text>
              </View>
              <PopButton onPress={navigateToEdit}>
                <LinearGradient
                  colors={['#4c0079ff', '#a200b1ff']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Change</Text>
                </LinearGradient>
              </PopButton>
            </View>

            <View style={styles.divider} />

            {/* Location */}
            <View style={styles.dataRow}>
              <View style={styles.dataContent}>
                <Text style={styles.subtitle}>Location</Text>
                <Text style={styles.bodyText} numberOfLines={2}>
                  {user?.address || 'N/A'}
                </Text>
              </View>
              <PopButton onPress={navigateToEdit}>
                <LinearGradient
                  colors={['#4c0079ff', '#a200b1ff']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Change</Text>
                </LinearGradient>
              </PopButton>
            </View>

            <View style={styles.divider} />

            {/* Account Status */}
            <View style={styles.dataRow}>
              <View style={styles.dataContent}>
                <Text style={styles.subtitle}>Account Status</Text>
                <Text style={[styles.bodyText, { color: '#00b300' }]}>
                  Active
                </Text>
              </View>
              <PopButton
                style={styles.deactivateBtn}
                onPress={handleDeactivate}
              >
                <Text style={styles.btnText}>Deactivate</Text>
              </PopButton>
            </View>

            <View style={styles.divider} />

            {/* Apply for Looper Section */}
            <View style={styles.dataRow}>
              <View style={styles.dataContent}>
                <Text style={styles.subtitle}>Apply for Looper</Text>
                <Text style={styles.bodyText}>Be a Loop store owner</Text>
              </View>

              <PopButton
                onPress={handleApplyLooper}
                disabled={isApplied || applying}
              >
                {isApplied ? (
                  // Applied State (Green)
                  <View style={styles.appliedBtn}>
                    <Text style={styles.btnText}>Applied</Text>
                  </View>
                ) : (
                  // Normal Apply State (Gradient)
                  <LinearGradient
                    colors={['#340052ff', '#a700b6ff']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    {applying ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.btnText}>Apply</Text>
                    )}
                  </LinearGradient>
                )}
              </PopButton>
            </View>
          </View>
          <View style={{ height: vs(80) }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    width: '100%',
    paddingTop: vs(40), // Safe area for top
    paddingBottom: vs(25), // Increased bottom padding for the curve
    paddingHorizontal: ms(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: ms(60), // Smoother curve
    borderBottomRightRadius: ms(60),
    elevation: 8,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: ms(10),
  },
  // --- INCREASED SIZE ---
  avatarContainer: {
    width: s(70),
    height: s(70),
    borderRadius: s(35),
    backgroundColor: 'rgba(123, 0, 148, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffffff',
    marginRight: ms(15),
  },
  avatarText: {
    fontSize: ms(24),
    fontWeight: 'bold',
    color: 'white',
  },
  textColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  usernameText: {
    fontSize: ms(20), // Responsive font size
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'capitalize',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(4),
  },
  userIdText: {
    fontSize: ms(13),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  copyBtn: {
    marginLeft: ms(8),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: ms(40),
    paddingHorizontal: ms(8),
    paddingVertical: vs(4),
  },
  copyText: {
    color: 'white',
    fontSize: ms(10),
    fontWeight: 'bold',
  },
  logoutBtnSmall: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: ms(12),
    paddingVertical: vs(8),
    borderRadius: ms(15),
  },
  logoutTextSmall: {
    color: 'white',
    fontSize: ms(12),
    fontWeight: 'bold',
  },
  bodyContainer: {
    flex: 1,
    marginTop: vs(15),
  },
  scrollContent: {
    paddingHorizontal: ms(20),
    paddingBottom: vs(20),
  },
  infoCard: {
    backgroundColor: '#fff', // Changed to white for better contrast
    width: '100%',
    borderRadius: ms(20),
    padding: ms(20),
    elevation: 2, // Added shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: ms(18),
    fontWeight: '900',
    color: '#340052ff',
    marginBottom: vs(20),
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(5),
  },
  dataContent: {
    flex: 1,
    flexDirection: 'column',
    marginRight: ms(15), // Ensure text doesn't hit button
  },
  subtitle: {
    fontSize: ms(12),
    color: '#888',
    marginBottom: vs(4),
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: ms(15),
    color: '#333',
    fontWeight: 'bold',
  },
  gradientBtn: {
    paddingHorizontal: ms(15),
    paddingVertical: vs(8),
    borderRadius: ms(15),
    minWidth: s(75), // Minimum width for touch target
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedBtn: {
    paddingHorizontal: ms(15),
    paddingVertical: vs(8),
    borderRadius: ms(15),
    minWidth: s(75),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00b300',
  },
  deactivateBtn: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: ms(15),
    paddingVertical: vs(8),
    borderRadius: ms(15),
    minWidth: s(75),
    alignItems: 'center',
  },
  btnText: {
    color: 'white',
    fontSize: ms(12),
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0', // Lighter divider for cleaner look
    marginVertical: vs(15),
  },
});