import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import LinearGradient from 'react-native-linear-gradient';
import { useUser } from '../../utils/UserContext';
import PopButton from '../../utils/PopButton';

export default function ProfileScreen() {
  const { user, setUser } = useUser();
  const navigation = useNavigation<any>();

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

  const handleDeactivate = () => {
    Alert.alert('Deactivate', 'Are you sure you want to deactivate?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive' },
    ]);
  };

  const navigateToEdit = () => {
    navigation.navigate('ProfileEdit');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#340052ff" />

      {/* 1. HEADER */}
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
            <Text style={styles.userIdText}>ID: {user?.id}</Text>
          </View>
        </View>

        <PopButton onPress={handleLogout} style={styles.logoutBtnSmall}>
          <Text style={styles.logoutTextSmall}>Log Out</Text>
        </PopButton>
      </LinearGradient>

      {/* 2. BODY CONTENT */}
      <View style={styles.bodyContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Contact Information</Text>

            {/* Row 1: Mobile */}
            <View style={styles.dataRow}>
              <View style={styles.dataContent}>
                <Text style={styles.subtitle}>Mobile Number</Text>
                <Text style={styles.bodyText}>{user?.phone || 'N/A'}</Text>
              </View>
              {/* GRADIENT CHANGE BUTTON -> Navigates to Edit Screen */}
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

            {/* Row 2: Location */}
            <View style={styles.dataRow}>
              <View style={styles.dataContent}>
                <Text style={styles.subtitle}>Location</Text>
                <Text style={styles.bodyText} numberOfLines={2}>
                  {user?.address || 'N/A'}
                </Text>
              </View>
              {/* GRADIENT CHANGE BUTTON -> Navigates to Edit Screen */}
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

            {/* Row 3: Account Status */}
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
          </View>
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
  // --- HEADER STYLES ---
  headerRow: {
    width: '100%',
    paddingTop: vs(40),
    paddingBottom: vs(20),
    paddingHorizontal: ms(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: ms(30),
    borderBottomRightRadius: ms(30),
    elevation: 8,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: ms(10),
  },
  avatarContainer: {
    width: s(50),
    height: s(50),
    borderRadius: s(25),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00c6ff',
    marginRight: ms(12),
  },
  avatarText: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: 'white',
  },
  textColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  usernameText: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'capitalize',
  },
  userIdText: {
    fontSize: ms(12),
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: vs(2),
  },
  logoutBtnSmall: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: ms(12),
    paddingVertical: vs(8),
    borderRadius: ms(20),
  },
  logoutTextSmall: {
    color: 'white',
    fontSize: ms(12),
    fontWeight: 'bold',
  },

  // --- BODY STYLES ---
  bodyContainer: {
    flex: 1,
    marginTop: vs(10),
  },
  scrollContent: {
    padding: ms(20),
  },
  infoCard: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: ms(20),
    padding: ms(20),
    elevation: 3,
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
    marginRight: ms(10),
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
    fontSize: ms(16),
    color: '#333',
    fontWeight: 'bold',
  },
  // --- BUTTON STYLES ---
  gradientBtn: {
    paddingHorizontal: ms(15),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    minWidth: s(70),
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateBtn: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: ms(15),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    minWidth: s(70),
    alignItems: 'center',
  },
  btnText: {
    color: 'white',
    fontSize: ms(12),
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: vs(15),
  },
});