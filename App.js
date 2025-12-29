import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Menu, Provider as PaperProvider } from 'react-native-paper';
import { useState } from 'react';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import './i18n';

import { ErrorBoundary } from './components/ErrorBoundary';

import Inicio from './screens/Inicio';
import Patinadores from './screens/Patinadores';
import Parches from './screens/Parches';
import Spots from './screens/Spots';
import Galeria from './screens/Galeria';
import Tracking from './screens/Tracking';
import RoutesHistory from './screens/RoutesHistory';
import ThemeToggle from './components/ThemeToggle';
import useAppStore from './store/useAppStore';

import { useDiagnostics } from './hooks/useDiagnostics';

const Tab = createBottomTabNavigator();
const RutasStack = createNativeStackNavigator();

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const currentLang = i18n.language;

  const openMenu = () => {
    console.log('Opening menu...');
    setVisible(true);
  };
  
  const closeMenu = () => {
    console.log('Closing menu...');
    setVisible(false);
  };

  const changeLanguage = (lang) => {
    console.log('Changing language to:', lang);
    i18n.changeLanguage(lang);
    closeMenu();
  };

  const getFlag = () => {
    if (currentLang === 'es') return '🇪🇸';
    if (currentLang === 'en') return '🇬🇧';
    if (currentLang === 'fr') return '🇫🇷';
    return '🇪🇸';
  };

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <TouchableOpacity 
          onPress={openMenu}
          style={{ 
            marginRight: 15, 
            padding: 8,
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: 20,
            minWidth: 40,
            alignItems: 'center',
            justifyContent: 'center'
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 24 }}>
            {getFlag()}
          </Text>
        </TouchableOpacity>
      }
      contentStyle={{ 
        marginTop: 50,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <Menu.Item 
        onPress={() => changeLanguage('es')} 
        title="🇪🇸 Español"
        titleStyle={{ 
          fontSize: 16,
          fontWeight: currentLang === 'es' ? 'bold' : 'normal'
        }}
      />
      <Menu.Item 
        onPress={() => changeLanguage('en')} 
        title="🇬🇧 English"
        titleStyle={{ 
          fontSize: 16,
          fontWeight: currentLang === 'en' ? 'bold' : 'normal'
        }}
      />
      <Menu.Item 
        onPress={() => changeLanguage('fr')} 
        title="🇫🇷 Français"
        titleStyle={{ 
          fontSize: 16,
          fontWeight: currentLang === 'fr' ? 'bold' : 'normal'
        }}
      />
    </Menu>
  );
}

// Stack Navigator para la sección de Rutas (Tracking + History)
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

function Navigation() {
  const { t } = useTranslation();
  const { isDark, theme } = useAppStore();
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: theme.colors.background.primary,
          },
          headerTintColor: theme.colors.text.primary,
          tabBarStyle: {
            backgroundColor: theme.colors.background.primary,
            borderTopColor: theme.colors.border,
          },
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginRight: 10,
              }}
            >
              <ThemeToggle />
              <LanguageSelector />
            </View>
          ),
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let IconComponent = Ionicons;

            if (route.name === "Inicio") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Patinadores") {
              IconComponent = MaterialCommunityIcons;
              iconName = focused ? "skate" : "skate";
              return (
                <IconComponent name={iconName} size={size} color={color} />
              );
            } else if (route.name === "Parches") {
              IconComponent = FontAwesome5;
              iconName = "users";
              return (
                <IconComponent name={iconName} size={size - 2} color={color} />
              );
            } else if (route.name === "Spots") {
              iconName = focused ? "location" : "location-outline";
            } else if (route.name === "Rutas") {
              iconName = focused
                ? "navigate-circle"
                : "navigate-circle-outline";
            } else if (route.name === "Galería") {
              iconName = focused ? "images" : "images-outline";
            }

            return <IconComponent name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.tabs.active,
          tabBarInactiveTintColor: theme.colors.tabs.inactive,
        })}
      >
        <Tab.Screen name="Inicio" component={Inicio} />
        <Tab.Screen name="Patinadores" component={Patinadores} />
        <Tab.Screen name="Parches" component={Parches} />
        <Tab.Screen name="Spots" component={Spots} />
        <Tab.Screen
          name="Rutas"
          component={RutasStackScreen}
          options={{
            headerShown: false,
          }}
        />
        <Tab.Screen name="Galería" component={Galeria} />
      </Tab.Navigator>
      <StatusBar style={isDark ? "light" : "dark"} />
    </NavigationContainer>
  );
}

export default function App() {
  const diagnostics = useDiagnostics();
  return (
    <ErrorBoundary>
      <PaperProvider>
        <Navigation />
      </PaperProvider>
    </ErrorBoundary>
  );
}
