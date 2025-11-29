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

const { width } = Dimensions.get('window');

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
    paddingHorizontal: s(20), // Scaled padding
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingBottom: vs(10), // Added slight bottom padding for safety
  },

  halfCircle: {
    position: 'absolute',
    // We scale the circle dimensions so the curve remains consistent across devices
    width: s(1000),
    height: s(1000),
    borderRadius: s(500),
    top: -s(780), // Scaled top position to match the circle size
    // Shadow
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 1,
    shadowRadius: ms(10),
    elevation: 15,
    zIndex: -1, // Ensure it stays behind text
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between', // Ensures button and text are separated
  },

  textWrapper: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: s(50), // Prevent text from hitting the button
  },

  greetingTitle: {
    fontSize: ms(30), // Slightly reduced base size for better fit on small screens
    fontWeight: '900',
    color: 'white',
    textAlign: 'left',
    marginBottom: vs(5),
    lineHeight: ms(34), // Added line height for better vertical alignment
  },

  username: {
    color: '#fff',
    textTransform: 'capitalize',
  },

  bodyText: {
    fontSize: ms(15),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'left',
    lineHeight: ms(20), // Improves readability
  },

  // Button Style (Passed to PopButton)
  helpButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: s(18), // Scaled radius
    width: s(36), // Scaled width
    height: s(36), // Scaled height (square aspect ratio)
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