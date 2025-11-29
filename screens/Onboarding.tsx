import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import ScreenWrapper from '../utils/ScreenWrapper';

// 1. IMPORT POP BUTTON
import PopButton from '../utils/PopButton';

const { width, height } = Dimensions.get('window');
const DARK_PURPLE = '#3c005fff';

const slides = [
  {
    id: '1',
    title: 'Shop Anything',
    desc: 'Buy Anything From Anywhere Anytime. Just Login to Loop App',
    image: require('./LoginMedia/shopanywhere.png'),
  },
  {
    id: '2',
    title: 'Fast Delivery',
    desc: 'Your Order will be delivered to your doorstep quickly',
    image: require('./LoginMedia/homedelivery.png'),
  },
  {
    id: '3',
    title: 'Cash Payment',
    desc: 'Pay with cash upon delivery. No online payments needed',
    image: require('./LoginMedia/cashondelivery.png'),
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= slides.length) nextIndex = 0;

      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  });

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <FlatList
            data={slides}
            ref={flatListRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <Image
                  source={item.image}
                  style={styles.image}
                  resizeMode="contain"
                />
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc}>{item.desc}</Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          />
        </View>

        {/* Pagination dots */}
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.activeDot]}
            />
          ))}
        </View>

        {/* Buttons Container */}
        <View style={styles.buttonContainer}>
          {/* Continue Button */}
          <PopButton onPress={() => navigation.replace('Login')}>
            <LinearGradient
              colors={['#340052ff', '#8c0099ff']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtn}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </PopButton>

          {/* Skip Button */}
          <PopButton onPress={() => navigation.replace('Explore')}>
            <LinearGradient
              colors={['#340052ff', '#8c0099ff']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.skipBtn}
            >
              <Text style={styles.exploreButtonText}>Skip</Text>
            </LinearGradient>
          </PopButton>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center', // Helps center content vertically
    marginTop: vs(100), // Scaled margin top (reduced slightly from 200 to fit smaller screens better)
  },
  image: {
    width: width * 0.75, // Keeps width dynamic based on screen width
    height: width * 0.75, // Keeps aspect ratio square relative to width
    marginBottom: vs(20), // Vertical spacing
  },
  title: {
    color: DARK_PURPLE,
    fontSize: ms(26), // Responsive font size
    fontWeight: 'bold',
    marginBottom: vs(10), // Vertical spacing
  },
  desc: {
    color: '#908497ff',
    fontSize: ms(16), // Responsive font size
    width: '80%',
    textAlign: 'center',
    lineHeight: ms(22), // Added for better readability on varied screens
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: vs(30), // Vertical spacing
  },
  dot: {
    width: ms(10), // Scaled dot size
    height: ms(10),
    backgroundColor: '#bebebeff',
    borderRadius: ms(5),
    marginHorizontal: s(5),
  },
  activeDot: {
    backgroundColor: DARK_PURPLE,
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
  },

  // --- Button Styles ---
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(35), // Scaled padding
    marginBottom: vs(50), // Scaled bottom margin
  },

  // 1. CONTINUE BUTTON SIZE (Responsive)
  continueBtn: {
    width: s(180), // Scaled width
    height: vs(50), // Scaled height
    borderRadius: ms(25), // Scaled border radius
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  // 2. SKIP BUTTON SIZE (Responsive)
  skipBtn: {
    width: s(80), // Scaled width
    height: vs(50), // Scaled height
    borderRadius: ms(25), // Scaled border radius
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: ms(18), // Responsive font size
  },
  exploreButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: ms(18), // Responsive font size
  },
});