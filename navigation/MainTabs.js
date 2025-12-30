import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, TouchableOpacity, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import Inicio from '../screens/Inicio';
import Patinadores from '../screens/Patinadores';
import Parches from '../screens/Parches';
import Spots from '../screens/Spots';
import Galeria from '../screens/Galeria';
import Tracking from '../screens/Tracking';
import RoutesHistory from '../screens/RoutesHistory';
import ThemeToggle from '../components/ThemeToggle';
import useAppStore from '../store/useAppStore';

const Tab = createBottomTabNavigator();
const RutasStack = createNativeStackNavigator();

function RutasStackScreen() {
  const { theme } = useAppStore();

  return (
    <RutasStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background.primary },
      }}
    >
      <RutasStack.Screen name="TrackingMain" component={Tracking} />
      <RutasStack.Screen name="RoutesHistoryScreen" component={RoutesHistory} />
    </RutasStack.Navigator>
  );
}

export default function MainTabs() {
  const { theme } = useAppStore();
  const logout = useAppStore((state) => state.logout);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const navigation = useNavigation();
  const { i18n, t } = useTranslation();

  const [languageVisible, setLanguageVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const currentLang = i18n.language;

  const openLanguage = () => setLanguageVisible(true);
  const closeLanguage = () => setLanguageVisible(false);
  const openUserMenu = () => setUserMenuVisible(true);
  const closeUserMenu = () => setUserMenuVisible(false);

  const getFlag = () => {
    if (currentLang === 'es') return '\uD83C\uDDE8\uD83C\uDDF4';
    if (currentLang === 'en') return '\uD83C\uDDFA\uD83C\uDDF8';
    if (currentLang === 'fr') return '\uD83C\uDDEB\uD83C\uDDF7';
    return '\uD83C\uDFF3\uFE0F';
  };

  const handleNavigate = (routeName) => {
    closeUserMenu();
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate(routeName);
    } else {
      navigation.navigate(routeName);
    }
  };

  const handleLogout = () => {
    closeUserMenu();
    Alert.alert(
      t('common.logout'),
      t('screens.auth.logoutConfirm', '¿Deseas cerrar sesión?'),
      [
        { text: t('screens.auth.logoutCancel', 'Cancelar'), style: 'cancel' },
        { text: t('screens.auth.logoutConfirmButton', 'Cerrar sesión'), style: 'destructive', onPress: logout },
      ]
    );
  };

  const headerActions = useMemo(
    () => (
      <View
        pointerEvents="box-none"
        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}
      >
        <View style={{ marginRight: 8 }}>
          <ThemeToggle />
        </View>
        <Pressable
          onPress={openLanguage}
          style={{
            padding: 8,
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: 20,
            minWidth: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
          hitSlop={8}
        >
          <Text style={{ fontSize: 24 }}>{getFlag()}</Text>
        </Pressable>
        <Pressable
          onPress={openUserMenu}
          style={{
            padding: 8,
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: 20,
            minWidth: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#333" />
        </Pressable>
      </View>
    ),
    [openLanguage, openUserMenu, currentLang, theme]
  );

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: theme.colors.background.primary,
          },
          headerTintColor: theme.colors.text.primary,
          headerRightContainerStyle: { pointerEvents: 'box-none' },
          tabBarStyle: {
            backgroundColor: theme.colors.background.primary,
            borderTopColor: theme.colors.border,
          },
          headerRight: () => headerActions,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let IconComponent = Ionicons;

            if (route.name === 'Inicio') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Patinadores') {
              IconComponent = MaterialCommunityIcons;
              iconName = focused ? 'skate' : 'skate';
              return <IconComponent name={iconName} size={size} color={color} />;
            } else if (route.name === 'Parches') {
              IconComponent = FontAwesome5;
              iconName = 'users';
              return <IconComponent name={iconName} size={size - 2} color={color} />;
            } else if (route.name === 'Spots') {
              iconName = focused ? 'location' : 'location-outline';
            } else if (route.name === 'Rutas') {
              iconName = focused ? 'navigate-circle' : 'navigate-circle-outline';
            } else if (route.name === 'Galería') {
              iconName = focused ? 'images' : 'images-outline';
            }

            return <IconComponent name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.tabs.active,
          tabBarInactiveTintColor: theme.colors.tabs.inactive,
        })}
      >
        <Tab.Screen
          name="Inicio"
          component={Inicio}
          options={{ title: t('nav.inicio'), tabBarLabel: t('nav.inicio') }}
        />
        <Tab.Screen
          name="Patinadores"
          component={Patinadores}
          options={{ title: t('nav.patinadores'), tabBarLabel: t('nav.patinadores') }}
        />
        <Tab.Screen
          name="Parches"
          component={Parches}
          options={{ title: t('nav.parches'), tabBarLabel: t('nav.parches') }}
        />
        <Tab.Screen
          name="Spots"
          component={Spots}
          options={{ title: t('nav.spots'), tabBarLabel: t('nav.spots') }}
        />
        <Tab.Screen
          name="Rutas"
          component={RutasStackScreen}
          options={{
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="Galería"
          component={Galeria}
          options={{ title: t('nav.galeria'), tabBarLabel: t('nav.galeria') }}
        />
      </Tab.Navigator>

      <Modal
        visible={languageVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLanguage}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeLanguage}
          style={{ flex: 1, backgroundColor: 'transparent' }}
        >
          <View
            style={{
              position: 'absolute',
              top: 60,
              right: 70,
              backgroundColor: 'white',
              borderRadius: 8,
              paddingVertical: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            {[
              { id: 'es', label: '\uD83C\uDDE8\uD83C\uDDF4 Espanol' },
              { id: 'en', label: '\uD83C\uDDFA\uD83C\uDDF8 English' },
              { id: 'fr', label: '\uD83C\uDDEB\uD83C\uDDF7 Francais' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setLanguage(item.id);
                  closeLanguage();
                }}
                style={{ paddingHorizontal: 16, paddingVertical: 10 }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: currentLang === item.id ? 'bold' : 'normal',
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={userMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeUserMenu}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeUserMenu}
          style={{ flex: 1, backgroundColor: 'transparent' }}
        >
          <View
            style={{
              position: 'absolute',
              top: 60,
              right: 10,
              backgroundColor: 'white',
              borderRadius: 8,
              paddingVertical: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <TouchableOpacity
              onPress={() => handleNavigate('Perfil')}
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 16 }}>{t('screens.menu.profile')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNavigate('Configuracion')}
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 16 }}>{t('screens.menu.settings')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 16 }}>{t('common.logout')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}


