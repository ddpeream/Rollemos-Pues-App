import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../store/useAppStore';

const ThemeToggle = ({ showLabel = false }) => {
  const { isDark, toggleTheme, theme } = useAppStore();
  const [animation] = React.useState(new Animated.Value(isDark ? 1 : 0));

  React.useEffect(() => {
    Animated.spring(animation, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [isDark]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.toggleContainer,
        { backgroundColor: isDark ? theme.colors.primary : '#D1D5DB' }
      ]}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.toggleCircle,
          {
            transform: [{ translateX }],
            backgroundColor: '#FFFFFF',
          }
        ]}
      >
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={16}
          color={isDark ? theme.colors.primary : '#F59E0B'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default ThemeToggle;
