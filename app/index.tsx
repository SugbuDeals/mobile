import { Link } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ImageBackground, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const stageWidth = Math.min(screenWidth * 1.0, 700);
  const stageHeight = Math.min(screenHeight * 3.5, 420);
  const centerImgWidth = stageWidth * 0.75;
  const centerImgHeight = stageHeight * 1.05;
  const centerImgLeft = (stageWidth - centerImgWidth) / 2;
  const rightImgSize = stageWidth * 0.48;
  const leftImgWidth = stageWidth * 0.52;
  const leftImgHeight = stageWidth * 0.50;

  return (
    <ImageBackground
      source={require('../assets/images/index.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.body}>
          {/* Frame 1: Top image */}
          <View style={styles.frame1}>
            <Image
              source={require('../assets/images/index.png')}
              style={styles.topImg}
              resizeMode="contain"
            />
          </View>

          {/* Frame 2: Stage with overlayed images */}
          <View style={[styles.frame2, { width: stageWidth, height: stageHeight }]}>
            <Image
              source={require('../assets/images/index1.png')}
              style={[styles.centerImg, { width: centerImgWidth, height: centerImgHeight, left: centerImgLeft }]}
              resizeMode="cover"
            />
            <Image
              source={require('../assets/images/index3.png')}
              style={[styles.rightImg, { width: rightImgSize, height: rightImgSize }]}
              resizeMode="contain"
            />
            <Image
              source={require('../assets/images/index2.png')}
              style={[styles.leftImg, { width: leftImgWidth, height: leftImgHeight }]}
              resizeMode="contain"
            />
          </View>

          {/* Frame 3: Text, dots, button */}
          <View style={styles.frame3}>
            <Text style={styles.headline}>Find the best deals near you</Text>
            <Text style={styles.dots}>• • •</Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#277874',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame1: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 30,
  },
  topImg: {
    height: 140,
    width: '100%',
  },
  frame2: {
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
    overflow: 'visible',
  },
  centerImg: {
    position: 'absolute',
    top: 40,
    left: 0,
  },
  rightImg: {
    position: 'absolute',
    top: 50,
    right: -90,
  },
  leftImg: {
    position: 'absolute',
    top: 170,
    left: -90,
  },
  frame3: {
    alignItems: 'center',
    marginTop: 16,
  },
  headline: {
    textAlign: 'center',
    fontSize: 18,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  dots: {
    fontSize: 28,
    color: '#333333',
    letterSpacing: -2,
    marginBottom: 2,
  },
  primaryButton: {
    backgroundColor: '#0A1615',
    paddingVertical: 10,
    paddingHorizontal: 110,
    borderRadius: 20,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '400',
  },
});
