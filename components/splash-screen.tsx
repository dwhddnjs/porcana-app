import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { useUniwind } from 'uniwind';

const logoWhite = require('@/assets/images/logo_white.png');
const logoBlack = require('@/assets/images/logo-black.png');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const { theme } = useUniwind();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isDark = theme === 'dark';
  const logo = isDark ? logoWhite : logoBlack;
  const backgroundColor = isDark ? '#0a0a0a' : '#ffffff';

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, opacity: fadeAnim },
      ]}
    >
      <Image source={logo} style={styles.logo} resizeMode="contain" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logo: {
    width: 120,
    height: 120,
  },
});
