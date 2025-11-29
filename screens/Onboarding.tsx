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
import ScreenWrapper from '../utils/ScreenWrapper';

// 1. IMPORT POP BUTTON
import PopButton from '../utils/PopButton';

const { width } = Dimensions.get('window');
const DARK_PURPLE = '#3c005fff';

const slides = [
  {
    id: '1',
    title: 'Shop Anything',
    desc: 'Jekono Jinish Kinun Apner Kacher Loop Online Store theke.',
    image: require('./LoginMedia/shopanywhere.png'),
  },
  {
    id: '2',
    title: 'Fast Delivery',
    desc: 'Apner Jinish Apner Ghore Pouche Dewa hobe Olpo Shomoye',
    image: require('./LoginMedia/homedelivery.png'),
  },
  {
    id: '3',
    title: 'Cash Payment',
    desc: 'Jinish hate peye tarpor apni apner mullo porishod korun',
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
            keyExtractor={item => item.id}
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
              style={styles.continueBtn} // <--- Manually sized below
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
              style={styles.skipBtn} // <--- Manually sized below
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
    marginTop: 200,
  },
  image: {
    width: width * 0.75,
    height: width * 0.75,
    marginBottom: 20,
  },
  title: {
    color: DARK_PURPLE,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  desc: {
    color: DARK_PURPLE,
    fontSize: 16,
    width: '80%',
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    backgroundColor: '#bebebeff',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: DARK_PURPLE,
    width: 12,
    height: 12,
  },
  
  // --- Button Styles ---
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 35, // Padding for container instead of margin
    marginBottom: 50,
  },

  // 1. CONTINUE BUTTON SIZE (Manual Control)
  continueBtn: {
    width: 220,  // <--- Change width here
    height: 50,  // <--- Change height here
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  // 2. SKIP BUTTON SIZE (Manual Control)
  skipBtn: {
    width: 80,   // <--- Change width here
    height: 50,  // <--- Change height here
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  exploreButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});