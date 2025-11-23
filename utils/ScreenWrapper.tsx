import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

export default function ScreenWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.background}>{children}</View>;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
});
