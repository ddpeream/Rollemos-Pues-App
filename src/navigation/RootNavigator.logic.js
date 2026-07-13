import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import ProfileRequiredScreen from './ProfileRequiredScreen';
import { ROOT_ROUTES } from './navigation.constants';
import { AUTH_STATUS, useAuthStore } from '../features/auth';
import { useUserStore } from '../features/users';
import { useTheme } from '../hooks/useTheme';
import { createRootNavigatorStyles } from './rootNavigator.style';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { theme } = useTheme();
  const styles = useMemo(() => createRootNavigatorStyles(theme), [theme]);

  const authStatus = useAuthStore((state) => state.authStatus);
  const authUser = useAuthStore((state) => state.authUser);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const startAuthListener = useAuthStore((state) => state.startAuthListener);
  const stopAuthListener = useAuthStore((state) => state.stopAuthListener);

  const clearCurrentUser = useUserStore((state) => state.clearCurrentUser);
  const currentUser = useUserStore((state) => state.currentUser);
  const isCurrentUserLoading = useUserStore((state) => state.isCurrentUserLoading);
  const isCurrentUserReady = useUserStore((state) => state.isCurrentUserReady);
  const loadCurrentUserById = useUserStore((state) => state.loadCurrentUserById);

  useEffect(() => {
    initializeAuth();
    startAuthListener();

    return () => {
      stopAuthListener();
    };
  }, [initializeAuth, startAuthListener, stopAuthListener]);

  useEffect(() => {
    if (authUser?.id) {
      loadCurrentUserById(authUser.id);
      return;
    }

    clearCurrentUser();
  }, [authUser?.id, clearCurrentUser, loadCurrentUserById]);

  const hasAuthenticatedSession = authStatus === AUTH_STATUS.AUTHENTICATED;
  const isLoadingCurrentUser = hasAuthenticatedSession && (
    isCurrentUserLoading || !isCurrentUserReady
  );

  if (!isAuthReady || isAuthLoading || isLoadingCurrentUser) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const canOpenPrivateApp = hasAuthenticatedSession && !!currentUser?.id;
  const requiresProfile = hasAuthenticatedSession && isCurrentUserReady && !currentUser?.id;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {canOpenPrivateApp ? (
        <Stack.Screen name={ROOT_ROUTES.APP} component={AppNavigator} />
      ) : requiresProfile ? (
        <Stack.Screen
          name={ROOT_ROUTES.PROFILE_REQUIRED}
          component={ProfileRequiredScreen}
        />
      ) : (
        <Stack.Screen name={ROOT_ROUTES.AUTH} component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
