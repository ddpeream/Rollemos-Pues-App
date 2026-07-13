import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AppHeaderUI({ children, styles }) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View pointerEvents="box-none" style={styles.container}>
        {children}
      </View>
    </SafeAreaView>
  );
}
