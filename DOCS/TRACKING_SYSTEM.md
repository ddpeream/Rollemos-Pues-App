# 🗺️ Sistema de Tracking de Rutas GPS

> Documento historico de la implementacion anterior. La arquitectura y el estado canonicos del refactor actual estan en DOCS/TRACKING_MAP_ONLY_REFACTOR.md.

Sistema completo de grabación y tracking de rutas en tiempo real para la app de patinaje.

## ✨ Características Implementadas

### 📍 Tracking en Tiempo Real
- **Geolocalización GPS** de alta precisión con `expo-location`
- **Polyline dibujada en vivo** sobre Google Maps
- **Tracking en background** (con permisos adecuados)
- **Actualización cada segundo o cada 5 metros** para optimizar batería

### 📊 Estadísticas en Vivo
- **Velocidad actual** (km/h)
- **Distancia recorrida** (metros/kilómetros)
- **Tiempo transcurrido** (HH:MM:SS)
- **Velocidad promedio** calculada dinámicamente
- **Velocidad máxima** alcanzada
- **Calorías quemadas** (estimación basada en MET para patinaje)

### 🎮 Controles
- **Botón Start/Pause/Resume** con animación de pulso
- **Botón Stop** para finalizar y guardar
- **Estados**: IDLE → TRACKING → PAUSED → IDLE
- **Centrar mapa** en ubicación actual
- **Toggle de estadísticas** (mostrar/ocultar)

### 💾 Persistencia
- **AsyncStorage** para guardar rutas localmente
- **Límite de 50 rutas** guardadas (las más recientes)
- **Metadata completa**: coordenadas, distancia, tiempo, velocidades, calorías, fecha

### 📋 Historial de Rutas
- **Lista de rutas grabadas** con previews
- **Stats de cada ruta** en cards elegantes
- **Acciones**: Ver detalle, Compartir, Eliminar
- **Pull-to-refresh** para actualizar
- **Empty state** cuando no hay rutas

## 🎨 Diseño

### UI/UX Moderna
- **Glassmorphism** en overlays
- **Animaciones fluidas** con Animated API
- **Dark mode** integrado con tema dinámico
- **Colores según estado**:
  - Verde (#34C759) - Start
  - Naranja (#FF9500) - Pause
  - Cyan (#4DD7D0) - Resume
  - Rojo (#FF3B30) - Stop

### Responsive
- **Pantalla completa** para mejor visualización del mapa
- **Stats overlay** no intrusivo
- **Controles flotantes** accesibles
- **Adaptado a diferentes tamaños de pantalla**

## 🛠️ Stack Técnico

### Dependencias
```json
{
  "expo-location": "^18.x.x",
  "react-native-maps": "^1.x.x",
  "@react-native-async-storage/async-storage": "^2.x.x",
  "@react-navigation/native-stack": "^7.x.x"
}
```

### Estructura
```
📁 screens/
  ├── Tracking.js          # Pantalla principal de tracking
  └── RoutesHistory.js     # Historial de rutas

📁 hooks/
  └── useRouteTracker.js   # Lógica de tracking GPS

📁 App.js
  └── RutasStackScreen()   # Stack Navigator para Rutas
```

## 📱 Navegación

```
Tab Navigator
└── Rutas (nueva tab)
    ├── TrackingMain (pantalla principal)
    └── RoutesHistoryScreen (historial)
```

### Flujo de Usuario
1. Usuario entra a tab "Rutas"
2. Ve pantalla de Tracking con mapa
3. Presiona "Iniciar" → Comienza grabación
4. GPS trackea posición cada segundo
5. Polyline se dibuja en tiempo real
6. Stats se actualizan en vivo
7. Puede pausar/reanudar
8. Al finalizar, presiona "Detener"
9. Ruta se guarda automáticamente
10. Puede ver historial presionando botón de lista

## 🔒 Permisos Requeridos

### iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Necesitamos tu ubicación para grabar tus rutas de patinaje</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Permitir tracking en background para grabar tu ruta completa</string>
```

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

## 📐 Cálculos

### Distancia (Fórmula Haversine)
```javascript
const R = 6371e3; // Radio de la Tierra en metros
const φ1 = (lat1 * Math.PI) / 180;
const φ2 = (lat2 * Math.PI) / 180;
const Δφ = ((lat2 - lat1) * Math.PI) / 180;
const Δλ = ((lon2 - lon1) * Math.PI) / 180;

const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

const distance = R * c; // metros
```

### Calorías (MET - Metabolic Equivalent)
```javascript
// MET para patinaje:
// Recreacional: 7 MET
// Intenso (>15 km/h): 9.8 MET

const weight = 70; // kg (promedio)
const met = avgSpeed > 15 ? 9.8 : 7;
const calories = met * weight * (minutes / 60);
```

## 🚀 Mejoras Futuras

### Funcionalidades
- [ ] Vista detallada de ruta con mapa completo
- [ ] Compartir ruta a redes sociales
- [ ] Exportar GPX/KML
- [ ] Desafíos y logros
- [ ] Comparar rutas
- [ ] Buscar rutas de otros usuarios
- [ ] Overlay de elevación
- [ ] Puntos de interés en ruta

### Optimizaciones
- [ ] Compresión de coordenadas (algoritmo Douglas-Peucker)
- [ ] Sync con Supabase
- [ ] Caché de mapas offline
- [ ] Modo de bajo consumo de batería
- [ ] Notificaciones de progreso

### Integración
- [ ] Google Fit / Apple Health
- [ ] Strava integration
- [ ] Previsión del clima
- [ ] Alertas de seguridad

## 💡 Tips de Uso

### Para mejor precisión:
- Usar en exteriores con cielo despejado
- Esperar señal GPS fuerte antes de iniciar
- Mantener teléfono en bolsillo/brazalete estable
- Evitar túneles o edificios altos

### Para mejor batería:
- Cerrar apps en background
- Reducir brillo de pantalla
- Activar modo ahorro de energía del sistema
- El GPS consume ~5-10% batería por hora

## 📊 Formato de Datos Guardados

```javascript
{
  id: "1699999999999",
  userId: "user_123",
  coordinates: [
    { latitude: 6.2442, longitude: -75.5812, timestamp: 1699... },
    // ...más puntos
  ],
  distance: 5234.5,        // metros
  duration: 932,            // segundos
  avgSpeed: 18.5,          // km/h
  maxSpeed: 28.3,          // km/h
  calories: 245,           // kcal
  date: "2025-11-10T15:30:00.000Z",
  startPoint: { latitude, longitude },
  endPoint: { latitude, longitude }
}
```

## 🎯 Casos de Uso

1. **Patinador recreativo**: Graba rutas del parque, ve distancias recorridas
2. **Entrenamiento**: Analiza velocidades, mejora rendimiento
3. **Competidor**: Compara tiempos, optimiza rutas
4. **Social**: Comparte rutas con amigos, descubre nuevos lugares
5. **Salud**: Trackea calorías, establece metas

---

**¡Sistema de tracking completamente funcional y listo para usar! 🎉**
