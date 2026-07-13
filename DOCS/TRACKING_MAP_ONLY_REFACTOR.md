# Tracking Map Only Refactor

## Identidad

- Rama: `tracking-map-only`
- Plataforma activa: Android
- Plataforma futura: iOS mediante adaptador de plataforma
- Backend: Supabase `fmkwqfnvtpuqtpgkengs`
- Objetivo: dejar el mapa y el tracking local/live funcionales, verificables y preparados para crecer sin recuperar el acoplamiento de la aplicacion anterior.

Este documento es la guia permanente del refactor. Toda decision que cambie el alcance, el orden o una fuente de verdad debe registrarse aqui.

## Resultado buscado

El MVP debe permitir que un usuario autenticado abra el mapa, vea su ubicacion, inicie una sesion, recorra y guarde una ruta, restaure una sesion interrumpida y comparta su posicion con otros usuarios. En Android debe comportarse de forma estable en primer plano y segundo plano. La logica de dominio no debe depender directamente del proveedor de mapa para que iOS pueda incorporarse despues con un modulo de plataforma.

## Reglas arquitectonicas

1. `trackingStore` es la unica fuente de verdad de la sesion de tracking.
2. Los hooks coordinan efectos; no crean estados paralelos del dominio.
3. Servicios de ubicacion, almacenamiento, background y Supabase no escriben UI.
4. Toda ubicacion entra por un unico pipeline de validacion e ingesta.
5. El mapa representa estado; no calcula distancia, velocidad ni decisiones de sesion.
6. La camara solo se mueve automaticamente cuando una accion explicita lo solicita.
7. Android e iOS implementan contratos de plataforma; el dominio compartido no conoce detalles nativos.
8. Ninguna migracion destructiva se ejecuta sobre la base enlazada durante este refactor.
9. Datos productivos, contrasenas y llaves privadas nunca se guardan en Git.
10. Cada etapa debe cerrar con validacion estatica, arranque Android y una prueba funcional definida.

## Estado verificado al iniciar

- El proyecto Supabase esta activo y enlazado al mismo `project-ref` usado por la app.
- `tracking_live` existe, tiene RLS y esta publicado en Realtime.
- Auth y `public.usuarios` quedaron consistentes: cuatro cuentas y cuatro perfiles.
- Hay tres registros en `tracking_live`; los registros obsoletos se filtran por antiguedad en el cliente.
- El esquema remoto restaurado no tiene historial de migraciones.
- El modo sin contrasena de la CLI falla porque el proyecto restaurado no puede administrar `cli_login_postgres`.
- La CLI de Supabase queda fijada como dependencia de desarrollo del proyecto.
- `src/` contiene la arquitectura nueva y debe preservarse junto con la eliminacion intencional de la app anterior.

## Conservacion de datos Supabase

Una migracion de esquema describe tablas, funciones, restricciones, triggers y politicas. No contiene ni elimina las filas de `auth.users`, `public.usuarios` o `tracking_live`.

Para crear la linea base se usara `db pull`; no se usaran `db reset`, restauraciones, truncados ni migraciones destructivas sobre el proyecto enlazado. La contrasena de base se suministra solo como variable temporal y nunca se escribe en el repositorio:

```powershell
$env:SUPABASE_DB_PASSWORD = '<database-password>'
npx supabase db pull remote_schema_baseline --linked --schema public --yes
Remove-Item Env:SUPABASE_DB_PASSWORD
npx supabase migration list --linked
```

La linea base se considera cerrada solo cuando el SQL generado se revise y la cantidad de cuentas/perfiles siga siendo la misma antes y despues.

## Hoja de ruta 1-12

### 1. Preservar estado actual y linea base

- Proteger secretos y archivos locales.
- Registrar la arquitectura nueva y las eliminaciones intencionales.
- Reparar inconsistencias aditivas entre Auth y perfiles.
- Capturar el esquema remoto como migracion base sin aplicar cambios destructivos.
- Crear un commit recuperable y esta guia.

Criterio de salida: Git limpio, punto recuperable, cuatro cuentas/cuatro perfiles y migracion base revisada.

### 2. Normalizar Android y Expo

- Resolver todos los hallazgos de Expo Doctor.
- Alinear dependencias con Expo SDK 54.
- Definir CNG/app config como fuente nativa.
- Confirmar development build Android reproducible.

Criterio de salida: Expo Doctor sin fallos relevantes y app iniciando en Android.

### 3. Definir contratos de tracking y plataforma

- Contratos para coordenada, muestra GPS, ruta, segmento, sesion, metricas y errores.
- Contratos para proveedor de ubicacion, controlador de mapa y background.
- Normalizadores en los limites de Expo Location, almacenamiento y Supabase.

Criterio de salida: dominio compartido sin dependencia directa del proveedor de mapa.

### 4. Fortalecer el pipeline GPS

- Permisos, lectura inicial, watcher unico y limpieza.
- Validacion de precision, timestamp, velocidad y saltos imposibles.
- Estados explicitos de disponibilidad y error.
- Ubicacion visible al entrar sin iniciar una ruta.

Criterio de salida: el marcador sigue el dispositivo de forma estable en una prueba real.

### 5. Centralizar ingesta atomica y maquina de estados

- Un unico comando para aceptar cada muestra valida.
- Transiciones start, pause, resume, stop y restore invariantes.
- Evitar escrituras parciales o estados imposibles.

Criterio de salida: todas las fuentes de ubicacion usan la misma entrada al store.

### 6. Consolidar ruta, segmentos y metricas

- Separar segmentos al pausar y reanudar.
- Evitar lineas falsas entre puntos no continuos.
- Calcular distancia, duracion, velocidades y calorias incrementalmente.
- Mantener bandera de salida y polyline coherentes.

Criterio de salida: ruta y metricas verificadas con recorridos controlados.

### 7. Estabilizar camara, marcador y render del mapa

- Camara no controlada durante navegacion manual.
- Centrado solo por accion explicita.
- Animacion estable del patin y rutas sin parpadeos.
- Capas de ruta local, historica y live claramente separadas.

Criterio de salida: actualizaciones GPS no alteran el zoom ni la posicion elegida por el usuario.

### 8. Consolidar persistencia local y restauracion

- SQLite como almacenamiento durable de sesiones y rutas largas.
- Escrituras por lotes y transacciones.
- Restauracion de sesion activa, pausada o interrumpida.
- Migracion controlada desde AsyncStorage cuando corresponda.

Criterio de salida: cerrar y reabrir la app no pierde una ruta en curso.

### 9. Implementar background tracking Android

- Task Manager y servicio foreground Android.
- Buffer durable de puntos capturados en segundo plano.
- Fusion determinista al regresar a primer plano.
- Respeto de privacidad y estado de sesion.

Criterio de salida: una ruta continua sobrevive pantalla bloqueada y cambio de app.

### 10. Endurecer Live Tracking Supabase

- Publicacion limitada por frecuencia y distancia.
- Presencia activa con expiracion y limpieza de sesiones abandonadas.
- Suscripcion Realtime incremental sin consultas por cada evento.
- Rutas live acotadas y separadas del tracking local.

Criterio de salida: dos o mas dispositivos se ven mutuamente sin duplicados ni usuarios fantasma.

### 11. Ejecutar pruebas de campo, resiliencia y observabilidad

- Casos de permisos, GPS apagado, red intermitente, proceso terminado y bateria baja.
- Logs estructurados y diagnostico sin datos sensibles.
- Pruebas unitarias de dominio e integracion de servicios.
- Pruebas de campo repetibles con evidencia.

Criterio de salida: matriz Android aprobada y fallos recuperables sin perder la sesion.

### 12. Cerrar Android y preparar el adaptador iOS

- Encapsular definitivamente implementaciones Android.
- Documentar contratos que debe implementar iOS.
- Verificar configuracion release, permisos y rendimiento Android.
- Dejar el core compartido sin bifurcaciones de plataforma innecesarias.

Criterio de salida: MVP Android distribuible y modulo iOS incorporable sin reescribir tracking.

## Puertas de calidad por etapa

- `npx tsc --noEmit`
- `npx expo-doctor`
- Arranque en development build Android
- Prueba funcional especifica de la etapa
- Revision de secretos y estado de Git
- Actualizacion de este documento

## Pendientes deliberadamente fuera del MVP del mapa

- Refactor integral de seguridad y RLS de todas las features.
- Recuperacion de las demas vistas de la aplicacion.
- Rodadas, spots, galeria, comunidades y marketplace como features completas.
- Implementacion nativa iOS.
