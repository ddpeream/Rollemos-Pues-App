import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import './i18n';

import { ErrorBoundary } from './components/ErrorBoundary';
import AuthStack from './navigation/AuthStack';
import MainTabs from './navigation/MainTabs';
import Perfil from './screens/Perfil';
import PerfilUsuario from './screens/PerfilUsuario';
import DetalleParche from './screens/DetalleParche';
import DetalleComunidad from './screens/DetalleComunidad';
import EditarPerfil from './screens/EditarPerfil';
import Configuracion from './screens/Configuracion';
import Notificaciones from './screens/Notificaciones';
import useAppStore from './store/useAppStore';
import { cleanupOrphanedTracking } from './services/trackingAutoStop';
import { usePushNotifications } from "./hooks/usePushNotifications";
import { navigationRef } from './navigation/navigationRef';

const RootStack = createNativeStackNavigator();

export default function App() {
  const { isDark, theme, isAuthenticated, authLoading, initializeApp } = useAppStore();
  const { t } = useTranslation();
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
          const title =
            action === 'paused'
              ? t('screens.tracking.orphanedPausedTitle')
              : t('screens.tracking.orphanedStoppedTitle');
          const message =
            action === 'paused'
              ? t('screens.tracking.orphanedPausedMessage', { minutes: result.inactiveMinutes })
              : t('screens.tracking.orphanedStoppedMessage', { minutes: result.inactiveMinutes });

          Alert.alert(title, message, [{ text: t('common.understood'), style: 'default' }]);
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
      <SafeAreaProvider>
        <PaperProvider>
          <NavigationContainer ref={navigationRef}>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
              {isAuthenticated ? (
                <>
                  <RootStack.Screen name="MainTabs" component={MainTabs} />
                  <RootStack.Screen name="Perfil" component={Perfil} />
                  <RootStack.Screen name="PerfilUsuario" component={PerfilUsuario} />
                  <RootStack.Screen name="DetalleParche" component={DetalleParche} />
                  <RootStack.Screen name="DetalleComunidad" component={DetalleComunidad} />
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
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
