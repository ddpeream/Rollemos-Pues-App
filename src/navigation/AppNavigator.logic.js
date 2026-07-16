import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppLogout } from '../app/hooks/useAppLogout.logic';
import Tracking from '../features/tracking';
import TrackingHistory, { TrackingHistoryDetail } from '../features/tracking-history';
import { sizes } from '../theme';
import { useTheme } from '../hooks/useTheme';
import AppHeader from '../shared/components/AppHeader/AppHeader';
import { APP_ROUTES } from './navigation.constants';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function LogoutPlaceholder() {
  return null;
}

function AppTabs() {
  const { theme } = useTheme();
  const logout = useAppLogout();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabs.active,
        tabBarInactiveTintColor: theme.colors.tabs.inactive,
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name={APP_ROUTES.TRACKING_TAB}
        component={Tracking}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="navigate-circle" size={sizes.tabBar.icon} color={color} />
          ),
          tabBarLabel: 'Tracking',
          title: 'Tracking',
        }}
      />
      <Tab.Screen
        name={APP_ROUTES.LOGOUT_TAB}
        component={LogoutPlaceholder}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            logout();
          },
        }}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="log-out-outline" size={sizes.tabBar.icon} color={color} />
          ),
          tabBarLabel: 'Salir',
          title: 'Salir',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const logout = useAppLogout();

  return (
    <>
      <AppHeader
        onLogout={logout}
        showLanguageButton
        showThemeButton
        showUserMenu
      />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={APP_ROUTES.APP_TABS} component={AppTabs} />
        <Stack.Screen name={APP_ROUTES.TRACKING_HISTORY} component={TrackingHistory} />
        <Stack.Screen
          name={APP_ROUTES.TRACKING_HISTORY_DETAIL}
          component={TrackingHistoryDetail}
        />
      </Stack.Navigator>
    </>
  );
}
