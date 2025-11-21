import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { moderateScale as ms, verticalScale as vs } from 'react-native-size-matters';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function BannerDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Get the data passed from the carousel
  const { image, title, description } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* Full Width Image */}
      <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.separator} />
        <Text style={styles.description}>{description}</Text>
      </View>
      
      {/* Optional Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: vs(250),
  },
  content: {
    padding: ms(20),
  },
  title: {
    fontSize: ms(24),
    fontWeight: '900',
    color: '#333',
    marginBottom: vs(10),
    textTransform: 'uppercase',
  },
  separator: {
    height: 2,
    width: ms(50),
    backgroundColor: '#ff00ff',
    marginBottom: vs(15),
  },
  description: {
    fontSize: ms(16),
    lineHeight: ms(24),
    color: '#555',
  },
  backButton: {
    marginHorizontal: ms(20),
    padding: ms(15),
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderRadius: ms(10),
    marginTop: vs(20),
  },
  backText: {
    color: '#333',
    fontWeight: 'bold',
  },
});