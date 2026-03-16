import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { useUniwind } from 'uniwind';

const logoWhite = require('@/assets/images/logo/splash-icon-white.png');
const logoBlack = require('@/assets/images/logo/splash-icon-black.png');

interface SplashScreenPropsTypes {
  visible: boolean;
  onFinish: () => void;
}

export const SplashScreen = ({ visible, onFinish }: SplashScreenPropsTypes) => {
  const { theme } = useUniwind();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isDark = theme === 'dark';
  const logo = isDark ? logoWhite : logoBlack;
  const backgroundColor = isDark ? '#0a0a0a' : '#ffffff';

  useEffect(() => {
    if (!visible) return;

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
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.container, { backgroundColor, opacity: fadeAnim }]}>
      <Image source={logo} resizeMode="contain" />
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
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
