import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { s } from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <LottieView
        // Replace with your actual Lottie JSON file path
        source={require('./screens/LoginMedia/Loading.json')}
        autoPlay
        loop
        speed={1}
        style={styles.lottie}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Change to match your Lottie background
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: s(380), // Adjusted to be safer on smaller screens
       height: s(380),
       backgroundColor: 'white',
  },
});

export default SplashScreen;
