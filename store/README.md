# 🐻 Zustand Store - Rollemos Pues!!!

Este directorio contiene el store global de la aplicación usando Zustand.

## 📁 Estructura

```
store/
├── useAppStore.js    # Store principal con toda la lógica
└── README.md         # Esta documentación
```

## 🎯 Secciones del Store

### 1. 🎨 Theme (Tema)
Maneja el tema claro/oscuro de la aplicación.

**Estado:**
- `isDark`: boolean - Si el tema actual es oscuro
- `theme`: object - Objeto con todos los colores y estilos del tema actual
- `isThemeLoading`: boolean - Si está cargando el tema

**Acciones:**
- `toggleTheme()` - Alterna entre tema claro y oscuro
- `setTheme(isDark)` - Establece un tema específico
- `initializeTheme()` - Inicializa el tema desde storage o sistema

**Uso:**
```javascript
import { useTheme } from '../store/useAppStore';

function MyComponent() {
  const { isDark, theme, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background.primary }}>
      <Button onPress={toggleTheme}>
        {isDark ? 'Modo Claro' : 'Modo Oscuro'}
      </Button>
    </View>
  );
}
```

---

### 2. 🌍 Language (Idioma)
Maneja el idioma de la aplicación (es, en, fr).

**Estado:**
- `language`: string - Idioma actual ('es', 'en', 'fr')
- `isLanguageLoading`: boolean - Si está cargando el idioma

**Acciones:**
- `setLanguage(lang)` - Cambia el idioma
- `initializeLanguage()` - Inicializa el idioma desde storage

**Uso:**
```javascript
import { useLanguage } from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { i18n } = useTranslation();
  
  const changeLanguage = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };
  
  return (
    <View>
      <Button onPress={() => changeLanguage('es')}>🇪🇸 Español</Button>
      <Button onPress={() => changeLanguage('en')}>🇬🇧 English</Button>
      <Button onPress={() => changeLanguage('fr')}>🇫🇷 Français</Button>
    </View>
  );
}
```

---

### 3. ⭐ Favorites (Favoritos)
Maneja los favoritos del usuario (skaters, parches, spots).

**Estado:**
- `favoriteSkaters`: array - IDs de skaters favoritos
- `favoriteParches`: array - IDs de parches favoritos
- `favoriteSpots`: array - IDs de spots favoritos

**Acciones:**
- `toggleFavoriteSkater(id)` - Agrega/quita de favoritos
- `toggleFavoriteParche(id)` - Agrega/quita de favoritos
- `toggleFavoriteSpot(id)` - Agrega/quita de favoritos
- `isFavoriteSkater(id)` - Verifica si está en favoritos
- `isFavoriteParche(id)` - Verifica si está en favoritos
- `isFavoriteSpot(id)` - Verifica si está en favoritos

**Uso:**
```javascript
import { useFavorites } from '../store/useAppStore';

function SkaterCard({ skater }) {
  const { isFavoriteSkater, toggleFavoriteSkater } = useFavorites();
  const isFavorite = isFavoriteSkater(skater.id);
  
  return (
    <View>
      <Text>{skater.name}</Text>
      <TouchableOpacity onPress={() => toggleFavoriteSkater(skater.id)}>
        <Ionicons 
          name={isFavorite ? 'heart' : 'heart-outline'} 
          size={24} 
          color={isFavorite ? '#E91E63' : '#808080'} 
        />
      </TouchableOpacity>
    </View>
  );
}
```

---

### 4. 👤 User (Usuario - Futuro)
Maneja la autenticación y datos del usuario.

**Estado:**
- `user`: object|null - Datos del usuario
- `isAuthenticated`: boolean - Si el usuario está autenticado

**Acciones:**
- `setUser(userData)` - Establece el usuario
- `logout()` - Cierra sesión

**Uso:**
```javascript
import { useUser } from '../store/useAppStore';

function ProfileScreen() {
  const { user, isAuthenticated, logout } = useUser();
  
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
  return (
    <View>
      <Text>Hola, {user.name}</Text>
      <Button onPress={logout}>Cerrar Sesión</Button>
    </View>
  );
}
```

---

## 🔧 Utility Actions

### `initializeApp()`
Inicializa todo el store (tema + idioma). Llamar en App.js al inicio.

```javascript
import { useAppStore } from '../store/useAppStore';
import { useEffect } from 'react';

function App() {
  const initializeApp = useAppStore((state) => state.initializeApp);
  
  useEffect(() => {
    initializeApp();
  }, []);
  
  return <Navigation />;
}
```

### `resetStore()`
Resetea todo el store a valores por defecto. Útil para testing o logout completo.

```javascript
const resetStore = useAppStore((state) => state.resetStore);
resetStore();
```

---

## 📚 Ejemplos Completos

### Ejemplo 1: Componente con Tema y Favoritos
```javascript
import { useTheme, useFavorites } from '../store/useAppStore';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function SpotCard({ spot }) {
  const { theme } = useTheme();
  const { isFavoriteSpot, toggleFavoriteSpot } = useFavorites();
  const isFavorite = isFavoriteSpot(spot.id);
  
  return (
    <View style={{
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.glass.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.colors.text.primary, fontSize: 18 }}>
          {spot.name}
        </Text>
        
        <TouchableOpacity onPress={() => toggleFavoriteSpot(spot.id)}>
          <Ionicons 
            name={isFavorite ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isFavorite ? '#E91E63' : theme.colors.text.secondary} 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={{ color: theme.colors.text.secondary }}>
        {spot.location}
      </Text>
    </View>
  );
}
```

### Ejemplo 2: Acceso Directo al Store
```javascript
import { useAppStore } from '../store/useAppStore';

function MyComponent() {
  // Seleccionar solo lo que necesitas (mejor rendimiento)
  const isDark = useAppStore((state) => state.isDark);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const favoriteSkaters = useAppStore((state) => state.favoriteSkaters);
  
  return (
    <View>
      <Text>Tema: {isDark ? 'Oscuro' : 'Claro'}</Text>
      <Text>Favoritos: {favoriteSkaters.length}</Text>
      <Button onPress={toggleTheme}>Toggle Theme</Button>
    </View>
  );
}
```

### Ejemplo 3: Múltiples Selectores
```javascript
import { useAppStore } from '../store/useAppStore';

function Dashboard() {
  // Usar el hook base para acceder a múltiples partes del estado
  const { 
    theme, 
    isDark, 
    language,
    favoriteSkaters,
    favoriteParches,
    favoriteSpots,
  } = useAppStore((state) => ({
    theme: state.theme,
    isDark: state.isDark,
    language: state.language,
    favoriteSkaters: state.favoriteSkaters,
    favoriteParches: state.favoriteParches,
    favoriteSpots: state.favoriteSpots,
  }));
  
  const totalFavorites = 
    favoriteSkaters.length + 
    favoriteParches.length + 
    favoriteSpots.length;
  
  return (
    <View style={{ backgroundColor: theme.colors.background.primary }}>
      <Text>Idioma: {language}</Text>
      <Text>Tema: {isDark ? '🌙' : '☀️'}</Text>
      <Text>Total Favoritos: {totalFavorites}</Text>
    </View>
  );
}
```

---

## 🎨 Acceso a Colores del Tema

```javascript
const { theme } = useTheme();

// Backgrounds
theme.colors.background.primary    // Fondo principal
theme.colors.background.surface    // Cards y superficies
theme.colors.background.surface2   // Superficies elevadas

// Textos
theme.colors.text.primary          // Texto principal
theme.colors.text.secondary        // Texto secundario
theme.colors.text.muted            // Texto deshabilitado

// Colores de marca
theme.colors.primary               // Color primario (#4DD7D0)
theme.colors.secondary             // Color secundario (#D26BFF)

// Tabs
theme.colors.tabs.active           // Tab activo (#E91E63)
theme.colors.tabs.inactive         // Tab inactivo (#808080)

// Bordes y glass
theme.colors.glass.border          // Bordes sutiles
theme.colors.glass.background      // Fondos glass
theme.colors.glass.backdrop        // Backdrop glass

// Alphas útiles
theme.colors.alpha.primary15       // Primary con 15% opacidad
theme.colors.alpha.white10         // Blanco 10% (tema oscuro)
theme.colors.alpha.black10         // Negro 10% (tema claro)

// Sombras
theme.shadows.card                 // Sombra para cards
theme.shadows.soft                 // Sombra suave
theme.shadows.small                // Sombra pequeña
theme.shadows.medium               // Sombra media
theme.shadows.none                 // Sin sombra
```

---

## 💾 Persistencia

### Qué se persiste automáticamente:
✅ Favoritos (skaters, parches, spots)
✅ Usuario autenticado
✅ Tema (dark/light) - con lógica personalizada
✅ Idioma - con lógica personalizada

### Storage key:
- `rollemos-pues-storage` - Datos generales (Zustand)
- `@theme` - Tema (AsyncStorage directo)
- `@language` - Idioma (AsyncStorage directo)

---

## 🚀 Ventajas de Este Setup

1. **Single Source of Truth**: Todo el estado en un solo lugar
2. **Sin Re-renders Innecesarios**: Selectores granulares
3. **TypeScript Ready**: Fácil de tipar si se migra a TS
4. **Devtools**: Compatible con Redux DevTools
5. **Persistencia Automática**: Se guarda todo automáticamente
6. **Hooks de Conveniencia**: `useTheme()`, `useLanguage()`, etc.
7. **Escalable**: Fácil agregar más estado
8. **Testing Friendly**: Fácil de mockear y testear

---

## 📝 Próximos Pasos de Migración

1. ✅ Store creado y configurado
2. ⏳ Migrar App.js para usar Zustand
3. ⏳ Migrar pantallas una por una
4. ⏳ Eliminar ThemeContext.js antiguo
5. ⏳ Testing completo

---

## 🐛 Debugging

### Ver el estado completo:
```javascript
const state = useAppStore.getState();
console.log('Estado completo:', state);
```

### Suscribirse a cambios:
```javascript
useAppStore.subscribe((state) => {
  console.log('Estado cambió:', state);
});
```

### Reset durante desarrollo:
```javascript
// En consola o botón de debug
useAppStore.getState().resetStore();
```
