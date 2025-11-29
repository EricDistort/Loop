import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Pressable,
  ViewStyle,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import { useUser } from '../../utils/UserContext';
// 1. IMPORT NAVIGATION HOOK
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// --- REUSABLE POP BUTTON COMPONENT ---
const PopButton = ({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 1.2,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function GreetingsHeader() {
  const { user } = useUser();
  // 2. INITIALIZE NAVIGATION
  const navigation = useNavigation<any>();

  const greeting = useMemo(() => {
    const words = ['Hey', 'Hi'];
    return words[Math.floor(Math.random() * words.length)];
  }, []);

  return (
    <View style={styles.container}>
      {/* Half-circle gradient */}
      <LinearGradient
        colors={['#340052ff', '#ea00ffff']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.halfCircle}
      />

      <View style={styles.row}>
        <View style={styles.textWrapper}>
          <Text style={styles.greetingTitle}>
            {greeting},{' '}
            <Text style={styles.username}>{user?.username || 'Guest'}</Text>
          </Text>

          <Text style={styles.bodyText}>
            Shop anything from loop I am here to help you
          </Text>
        </View>

        {/* 3. ADDED ONPRESS TO NAVIGATE TO SUPPORT */}
        <PopButton
          style={styles.helpButton}
          onPress={() => navigation.navigate('Help')}
        >
          <Image
            source={require('../StoreMedia/Help.png')}
            style={styles.helpIcon}
          />
        </PopButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: s(20),
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingBottom: vs(10),
  },
  halfCircle: {
    position: 'absolute',
    width: s(1000),
    height: s(1000),
    borderRadius: s(500),
    top: -s(780),
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 1,
    shadowRadius: ms(10),
    elevation: 15,
    zIndex: -1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  textWrapper: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: s(50),
  },
  greetingTitle: {
    fontSize: ms(30),
    fontWeight: '900',
    color: 'white',
    textAlign: 'left',
    marginBottom: vs(5),
    lineHeight: ms(34),
  },
  username: {
    color: '#fff',
    textTransform: 'capitalize',
  },
  bodyText: {
    fontSize: ms(15),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'left',
    lineHeight: ms(20),
  },
  helpButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: s(18),
    width: s(36),
    height: s(36),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  helpIcon: {
    width: s(24),
    height: s(24),
    resizeMode: 'contain',
  },
});