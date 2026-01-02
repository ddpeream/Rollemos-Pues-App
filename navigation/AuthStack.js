import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Auth from '../screens/Auth';
import Signup from '../screens/Signup';
import AuthHeaderActions from '../components/AuthHeaderActions';
import useAppStore from '../store/useAppStore';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const { theme } = useAppStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
        },
        headerRight: () => <AuthHeaderActions />,
      }}
    >
      <Stack.Screen name="AuthScreen" component={Auth} />
      <Stack.Screen name="SignupScreen" component={Signup} />
    </Stack.Navigator>
  );
}
