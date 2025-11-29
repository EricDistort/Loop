import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Pressable,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import { useUser } from '../../utils/UserContext';

// --- 1. REUSABLE POP BUTTON COMPONENT (Scale Up Logic) ---
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
      toValue: 1.2, // Grows to 120%
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1, // Bounces back to 100%
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

        {/* 2. USING THE CUSTOM POP BUTTON */}
        <PopButton style={styles.helpButton}>
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
    paddingHorizontal: ms(20),
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  halfCircle: {
    position: 'absolute',
    width: 1000,
    height: 1000,
    borderRadius: 500,
    top: -780,
    // Shadow
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 1,
    shadowRadius: ms(10),
    elevation: 15,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },

  textWrapper: {
    flex: 1,
    alignItems: 'flex-start',
  },

  greetingTitle: {
    fontSize: ms(32),
    fontWeight: '900',
    color: 'white',
    textAlign: 'left',
    marginBottom: vs(5),
  },

  username: {
    color: '#fff',
    textTransform: 'capitalize',
  },

  bodyText: {
    fontSize: ms(16),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'left',
    paddingRight: ms(40),
  },

  // Button Style (Passed to PopButton)
  helpButton: {
    padding: ms(5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: ms(17),
    width: ms(40),
    height: ms(40),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  helpIcon: {
    width: ms(28),
    height: ms(28),
    resizeMode: 'contain',
  },
});
