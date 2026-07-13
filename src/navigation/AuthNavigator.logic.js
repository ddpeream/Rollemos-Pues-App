import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AUTH_ROUTES } from './navigation.constants';
import Login from '../features/auth/screens/Login/Login';
import Signup from '../features/auth/screens/Signup/Signup';
import { useTheme } from '../hooks/useTheme';
import AppHeader from '../shared/components/AppHeader/AppHeader';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { theme } = useTheme();

  return (
    <>
      <AppHeader
        showLanguageButton
        showThemeButton
        showUserMenu={false}
      />
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background.primary },
          fullScreenGestureEnabled: true,
          gestureEnabled: true,
          headerShown: false,
        }}
      >
        <Stack.Screen name={AUTH_ROUTES.LOGIN} component={Login} />
        <Stack.Screen name={AUTH_ROUTES.SIGNUP} component={Signup} />
      </Stack.Navigator>
    </>
  );
}
