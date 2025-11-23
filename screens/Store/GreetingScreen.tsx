import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import { useUser } from '../../utils/UserContext';

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
        colors={['#340052ff', '#b300b3ff']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
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

        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: ms(20),
    //paddingVertical: vs(20),
    //overflow: 'hidden',
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
    paddingRight: ms(20),
    //fontStyle: 'italic',
  },

  helpButton: {
    paddingVertical: ms(8),
    paddingHorizontal: ms(16),
    borderWidth: 1,
    borderColor: '#00c6ff',
    borderRadius: ms(10),
  },

  helpText: {
    color: '#00c6ff',
    fontWeight: 'bold',
  },
});
