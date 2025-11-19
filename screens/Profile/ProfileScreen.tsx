import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale as s, verticalScale as vs, moderateScale as ms } from 'react-native-size-matters';
// 1. Import the context hook
import { useUser } from '../../utils/UserContext'; 

export default function GreetingsHeader() {
  // 2. Get user directly from Context
  const { user } = useUser(); 

  const greeting = useMemo(() => {
    const words = ['Hey', 'Hi', 'Welcome'];
    return words[Math.floor(Math.random() * words.length)];
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.textWrapper}>
        <Text style={styles.greetingTitle}>
          {greeting}, 
          {/* 3. Pull username specifically from the user object */}
          <Text style={styles.username}> {user?.username || 'Guest'}</Text>
        </Text>
        <Text style={styles.bodyText}>
          shop anything from here i am ready to help you
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(20),
  },
  textWrapper: {
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: ms(32),
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    marginBottom: vs(10),
  },
  username: {
    color: '#00c6ff', // Cyan neon
    textTransform: 'capitalize', // Optional: Makes name look better (e.g. "john" -> "John")
  },
  bodyText: {
    fontSize: ms(16),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});