import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppContent from './app/AppContent';
import './i18n';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
