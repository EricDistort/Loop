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

const slides = [
  {
    id: '1',
    title: 'Welcome to Our Store',
    desc: 'Order products easily from your nearest store.',
    image: require('./LoginMedia/shopanywhere.png'),
  },
  {
    id: '2',
    title: 'Fast Delivery',
    desc: 'Your items will be delivered from your selected store.',
    image: require('./LoginMedia/homedelivery.png'),
  },
  {
    id: '3',
    title: 'Secure Payments',
    desc: 'Reliable and safe ordering experience.',
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

        {/* Continue button */}
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <LinearGradient
            colors={['#340052ff', '#b300b3ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    color: '#3c005fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  desc: {
    color: '#3c005fff',
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
    backgroundColor: '#3c005fff',
    width: 12,
    height: 12,
  },
  button: {
    paddingVertical: 12,
    marginHorizontal: 40,
    borderRadius: 50,
    marginBottom: 50,
    elevation: 5,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
