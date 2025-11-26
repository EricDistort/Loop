import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ScreenWrapper from '../utils/ScreenWrapper';

const { width } = Dimensions.get('window');
const DARK_PURPLE = '#3c005fff'; // Extracted dark purple color

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
          {/* Continue button */}
          <TouchableOpacity 
            style={styles.continueButtonWrapper} 
            onPress={() => navigation.replace('Login')}
          >
            <LinearGradient
              colors={['#340052ff', '#b300a4ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Explore button */}
          <TouchableOpacity
            style={styles.exploreButtonWrapper}
            onPress={() => navigation.replace('Explore')}
          >
            <LinearGradient
              colors={['#340052ff', '#b300a4ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.exploreButtonText}>Skip</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    justifyContent: 'space-between', // Space out the two buttons
    marginHorizontal: 40,
    marginBottom: 50,
  },
  continueButtonWrapper: {
    flex: 1, // Allows 'Continue' button to take available space
    marginRight: 10, // Small margin between the two buttons
  },
  exploreButtonWrapper: {
    width: '25%', // Allocate specific width for 'Explore' button
  },
  button: {
    paddingVertical: 12,
    borderRadius: 50,
    elevation: 5,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  exploreButton: {
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: DARK_PURPLE, // Adding a subtle border for clarity
    elevation: 5,
  },
  exploreButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});