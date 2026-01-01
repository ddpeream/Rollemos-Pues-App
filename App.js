import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import './i18n';

import { ErrorBoundary } from './components/ErrorBoundary';
import AuthStack from './navigation/AuthStack';
import MainTabs from './navigation/MainTabs';
import Perfil from './screens/Perfil';
import EditarPerfil from './screens/EditarPerfil';
import Configuracion from './screens/Configuracion';
import useAppStore from './store/useAppStore';
import { cleanupOrphanedTracking } from './services/trackingAutoStop';
import "./tasks/trackingLiveTask";

const RootStack = createNativeStackNavigator();

export default function App() {
  const { isDark, theme, isAuthenticated, authLoading, initializeApp } = useAppStore();

  useEffect(() => {
    initializeApp();
    
    // 🛑 Verificar y limpiar tracking huérfano al iniciar la app
    const checkOrphanedTracking = async () => {
      try {
        const result = await cleanupOrphanedTracking();
        
        if (result.cleaned) {
          console.log(`🛑 Tracking huérfano limpiado: ${result.inactiveMinutes} min de inactividad`);
          
          // Notificar al usuario
          Alert.alert(
            'Tracking detenido',
            `El tracking se detuvo automáticamente después de ${result.inactiveMinutes} minutos de inactividad.`,
            [{ text: 'Entendido', style: 'default' }]
          );
        }
      } catch (error) {
        console.error('Error verificando tracking huérfano:', error);
      }
    };

    checkOrphanedTracking();
  }, [initializeApp]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <PaperProvider>
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
              <>
                <RootStack.Screen name="MainTabs" component={MainTabs} />
                <RootStack.Screen name="Perfil" component={Perfil} />
                <RootStack.Screen name="EditarPerfil" component={EditarPerfil} />
                <RootStack.Screen name="Configuracion" component={Configuracion} />
              </>
            ) : (
              <RootStack.Screen name="AuthStack" component={AuthStack} />
            )}
          </RootStack.Navigator>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </NavigationContainer>
      </PaperProvider>
    </ErrorBoundary>
  );
}
