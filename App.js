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
import PerfilUsuario from './screens/PerfilUsuario';
import DetalleParche from './screens/DetalleParche';
import EditarPerfil from './screens/EditarPerfil';
import Configuracion from './screens/Configuracion';
import Notificaciones from './screens/Notificaciones';
import useAppStore from './store/useAppStore';
import { cleanupOrphanedTracking } from './services/trackingAutoStop';
import { usePushNotifications } from "./hooks/usePushNotifications";
import "./tasks/trackingLiveTask";
import { navigationRef } from './navigation/navigationRef';

const RootStack = createNativeStackNavigator();

export default function App() {
  const { isDark, theme, isAuthenticated, authLoading, initializeApp } = useAppStore();
  usePushNotifications();

  useEffect(() => {
    initializeApp();
    
    // 🛑 Verificar y limpiar tracking huérfano al iniciar la app
    const checkOrphanedTracking = async () => {
      try {
        const result = await cleanupOrphanedTracking();
        if (result.cleaned) {
          const action = result.action || 'paused';
          console.log(`?? Tracking huerfano ${action}: ${result.inactiveMinutes} min de inactividad`);

          // Notificar al usuario
          const title = action === 'paused' ? 'Tracking pausado' : 'Tracking detenido';
          const message =
            action === 'paused'
              ? `El tracking se pauso automaticamente despues de ${result.inactiveMinutes} minutos de inactividad.`
              : `El tracking se detuvo automaticamente despues de ${result.inactiveMinutes} minutos de inactividad.`;

          Alert.alert(title, message, [{ text: 'Entendido', style: 'default' }]);
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
        <NavigationContainer ref={navigationRef}>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
              <>
                <RootStack.Screen name="MainTabs" component={MainTabs} />
                <RootStack.Screen name="Perfil" component={Perfil} />
                <RootStack.Screen name="PerfilUsuario" component={PerfilUsuario} />
                <RootStack.Screen name="DetalleParche" component={DetalleParche} />
                <RootStack.Screen name="EditarPerfil" component={EditarPerfil} />
                <RootStack.Screen name="Configuracion" component={Configuracion} />
                <RootStack.Screen name="Notificaciones" component={Notificaciones} />
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
