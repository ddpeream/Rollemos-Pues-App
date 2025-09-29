import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Menu, Provider as PaperProvider } from 'react-native-paper';
import { useState } from 'react';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from './theme';
import './i18n';

import Inicio from './screens/Inicio';
import Patinadores from './screens/Patinadores';
import Parches from './screens/Parches';
import Spots from './screens/Spots';
import Galeria from './screens/Galeria';

const Tab = createBottomTabNavigator();

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

function Navigation() {
  const { t } = useTranslation();
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerRight: () => <LanguageSelector />,
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
            } else if (route.name === 'Galería') {
              iconName = focused ? 'images' : 'images-outline';
            }

            return <IconComponent name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.tabs.active,
          tabBarInactiveTintColor: colors.tabs.inactive,
        })}
      >
        <Tab.Screen name="Inicio" component={Inicio} />
        <Tab.Screen name="Patinadores" component={Patinadores} />
        <Tab.Screen name="Parches" component={Parches} />
        <Tab.Screen name="Spots" component={Spots} />
        <Tab.Screen name="Galería" component={Galeria} />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <Navigation />
    </PaperProvider>
  );
}
