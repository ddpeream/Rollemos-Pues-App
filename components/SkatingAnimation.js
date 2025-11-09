import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Image, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '../store/useAppStore';

const { width } = Dimensions.get('window');

/**
 * Componente de animación de patín deslizándose
 * Muestra una imagen de patín que se desliza de izquierda a derecha
 */
export default function SkatingAnimation({ 
  size = 'medium',
  autoPlay = true,
  loop = true,
  speed = 1,
  style 
}) {
  const { theme } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const animProgress = new Animated.Value(0); // 0 a 1 (ida y vuelta)

  // Tamaños predefinidos
  const sizes = {
    small: { width: 60, height: 60 },
    medium: { width: 100, height: 100 },
    large: { width: 150, height: 120 },
  };

  const animationSize = sizes[size] || sizes.medium;
  const animationDuration = 4000 / speed;

  // Interpolar el progreso a posición X y rotación
  const translateX = animProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-150, width + 150, -150], // Ida completa y vuelta completa
  });

  const scaleX = animProgress.interpolate({
    inputRange: [0, 0.49, 0.5, 0.99, 1],
    outputRange: [1, 1, -1, -1, 1], // Se voltea en el punto 0.5
  });

  useEffect(() => {
    if (autoPlay && imageLoaded) {
      animProgress.setValue(0);
      console.log('🛼 SkatingAnimation: Iniciando animación (ida y vuelta)...');

      const animation = Animated.loop(
        Animated.timing(animProgress, {
          toValue: 1,
          duration: animationDuration * 2, // Ida + vuelta
          useNativeDriver: true,
        }),
        {
          iterations: -1,
        }
      );

      animation.start();

      return () => animation.stop();
    }
  }, [autoPlay, animationDuration, imageLoaded]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: '100%',
      height: animationSize.height + 60,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background.surface,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      minHeight: 140,
    },
    skateboard: {
      width: animationSize.width,
      height: animationSize.height,
    },
    animatedView: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      height: 80,
    },
  }), [animationSize, theme]);

  return (
    <View style={[styles.container, style]}>
      {!imageLoaded && !useFallback && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      
      <Animated.View 
        style={[
          styles.animatedView,
          {
            transform: [
              { translateX },
              { scaleX }, // Voltea horizontalmente
            ],
          },
        ]}
      >
        {useFallback ? (
          // Fallback: SVG local
          <Image
            source={require('../assets/img/skateboard.svg')}
            style={styles.skateboard}
            resizeMode="contain"
          />
        ) : (
          // Intentar imagen de URL primero
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/128/882/882198.png',
            }}
            style={styles.skateboard}
            resizeMode="contain"
            onLoad={() => {
              console.log('✅ Imagen de rollers cargada');
              setImageLoaded(true);
            }}
            onError={(error) => {
              console.error('❌ Error cargando imagen URL, usando fallback SVG:', error);
              setUseFallback(true);
              setImageLoaded(true);
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}
