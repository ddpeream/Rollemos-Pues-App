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
- El esquema remoto ya tiene registrada la migracion baseline `20260713201714_remote_schema_baseline`.
- El modo sin contrasena de la CLI falla porque el proyecto restaurado no puede administrar `cli_login_postgres`.
- La CLI de Supabase queda fijada como dependencia de desarrollo del proyecto.
- `src/` contiene la arquitectura nueva y debe preservarse junto con la eliminacion intencional de la app anterior.

## Conservacion de datos Supabase

Una migracion de esquema describe tablas, funciones, restricciones, triggers y politicas. No contiene ni elimina las filas de `auth.users`, `public.usuarios` o `tracking_live`.

La linea base se extrajo mediante la integracion oficial de Supabase, sin depender de la contrasena de Postgres y sin ejecutar DDL destructivo sobre produccion. El SQL canonico esta en `supabase/migrations/20260713201714_remote_schema_baseline.sql`. Produccion registra la misma version mediante una migracion inocua porque sus objetos ya existian; el archivo completo se aplica unicamente sobre bases nuevas.

Cobertura verificada mediante reconstruccion local desde cero:

- 16 tablas y 146 columnas publicas.
- 55 constraints, 42 indices propios y 23 indices respaldados por constraints.
- 12 funciones, 55 politicas publicas y 20 politicas de Storage.
- 15 tablas con RLS habilitado, 5 buckets y 7 tablas en `supabase_realtime`.
- 12 triggers reproducibles. `public.notificaciones_insert_push` se excluye deliberadamente porque su definicion remota contiene una credencial `service_role`; debe reemplazarse por una integracion respaldada por secretos antes de incorporarlo a migraciones.

La validacion remota posterior conservo cuatro cuentas en `auth.users`, cuatro perfiles en `public.usuarios` y tres posiciones en `public.tracking_live`. `npx supabase db reset --local` y `npx supabase migration list --local` confirmaron que el baseline se reproduce y que la version local coincide con la registrada en produccion.

Deuda heredada preservada, no corregida durante el baseline: `public.usuarios` tiene politicas pero RLS deshabilitado; las 12 funciones publicas no fijan `search_path`; existen politicas permisivas y buckets publicos. Estos hallazgos requieren migraciones funcionales y pruebas separadas, porque corregirlos dentro de la linea base cambiaria el comportamiento productivo.

## Hoja de ruta 1-12

### 1. Preservar estado actual y linea base (completado)

- Proteger secretos y archivos locales.
- Registrar la arquitectura nueva y las eliminaciones intencionales.
- Reparar inconsistencias aditivas entre Auth y perfiles.
- Capturar el esquema remoto como migracion base sin aplicar cambios destructivos.
- Crear un commit recuperable y esta guia.

Criterio de salida: Git limpio, punto recuperable, cuatro cuentas/cuatro perfiles y migracion base revisada.

### 2. Normalizar Android y Expo (completado)

- Resolver todos los hallazgos de Expo Doctor.
- Alinear dependencias con Expo SDK 54.
- Definir CNG/app config como fuente nativa.
- Confirmar development build Android reproducible.

Criterio de salida: Expo Doctor sin fallos relevantes y app iniciando en Android.

Estado: Expo Doctor pasa 18/18 y Prebuild regenera Android desde `app.json`. La compilacion local alcanzo C++ nativo y se detuvo por la ruta de Windows superior a 260 caracteres; debe repetirse desde una ruta corta o en EAS, sin cambios de codigo.

### 3. Definir contratos de tracking y plataforma (completado)

- Contratos para coordenada, muestra GPS, ruta, segmento, sesion, metricas y errores.
- Contratos para proveedor de ubicacion, controlador de mapa y background.
- Normalizadores en los limites de Expo Location, almacenamiento y Supabase.

Criterio de salida: dominio compartido sin dependencia directa del proveedor de mapa.

Estado: contratos de dominio y plataforma completos y verificados con @ts-check; Expo Location se selecciona mediante un adaptador, la camara usa un controlador de react-native-maps fuera de la sesion y Expo, almacenamiento y Supabase normalizan sus datos antes de entrar al dominio.

### 4. Fortalecer el pipeline GPS (completado y validado en Android)

- Permisos, lectura inicial, watcher unico y limpieza.
- Validacion de precision, timestamp, velocidad y saltos imposibles.
- Estados explicitos de disponibilidad y error.
- Ubicacion visible al entrar sin iniciar una ruta.

Criterio de salida: el marcador sigue el dispositivo de forma estable en una prueba real.

Estado: prueba fisica Android aprobada el 2026-07-15. El marcador siguio el dispositivo antes de iniciar, durante tracking y durante pausa; el recorrido previo a Play no se registro, la camara conservo el zoom manual, salir de la vista limpio el watcher y una sesion nueva inicio desde cero con su propia bandera. Detener guardo la ruta finalizada, limpio la sesion visible y el historial hidrato posteriormente la misma geometria. El escenario con GPS apagado no produjo estados rotos; la denegacion manual del permiso se difiere a la matriz del punto 11.

Hallazgos de campo asignados a etapas posteriores: al reanudar se conecto la ubicacion actual con el ultimo punto anterior a la pausa y se incorporaron 77 m en dos segundos activos, comportamiento que debe resolverse con segmentos en el punto 6. El valor del cronometro se partio en dos lineas por falta de ancho, ajuste visual correspondiente al punto 7.

### 5. Centralizar ingesta atomica y maquina de estados (completado)

- Un unico comando para aceptar cada muestra valida.
- Transiciones start, pause, resume, stop y restore invariantes.
- Evitar escrituras parciales o estados imposibles.

Criterio de salida: todas las fuentes de ubicacion usan la misma entrada al store.

Estado: `acceptTrackingLocation` es la unica entrada de coordenadas GPS canonicas al store y actualiza `currentLocation`, estado de disponibilidad y ruta elegible en una sola escritura. `startTrackingSession`, `pauseTrackingSession`, `resumeTrackingSession`, `stopTrackingSession` y `restoreTrackingSession` aplican parches atomicos y rechazan transiciones invalidas sin modificar el estado. La logica pura vive en `store/trackingSession.logic.js`; el hook paralelo `useTrackingRoute`, los setters directos y las mutaciones parciales fueron eliminados. Lectura inicial y watcher convergen en la misma ingesta; restauracion usa su comando de frontera normalizada.

### 6. Consolidar ruta, segmentos y metricas (implementado; prueba fisica Android pendiente)

- Separar segmentos al pausar y reanudar.
- Evitar lineas falsas entre puntos no continuos.
- Calcular distancia, duracion, velocidades y calorias incrementalmente.
- Mantener bandera de salida y polyline coherentes.

Criterio de salida: ruta y metricas verificadas con recorridos controlados.

Estado: `routeSegments` reemplaza la lista plana como unica geometria canonica en `trackingStore`. Iniciar abre el primer segmento, pausar lo cierra, las muestras pausadas solo mueven el marcador y reanudar abre un segmento desde la ubicacion actual. Distancia, velocidad actual y maxima se actualizan incrementalmente dentro del comando atomico de ingesta; el reloj solo actualiza duracion, promedio, calorias y vencimiento de velocidad. Mapa activo, historial y previews renderizan cada segmento por separado, por lo que no dibujan ni contabilizan el desplazamiento durante la pausa.

Persistencia local de sesion y rutas usa formato version 2 con limites de segmento. Los datos version 1 se normalizan como un unico segmento y permanecen legibles. La validacion automatizada cubrio 61 aserciones de transiciones, metricas, compatibilidad, guardado, hidratacion y borrado; TypeScript, parseo de 243 archivos, Expo Doctor 18/18 y bundle Android de 1278 modulos finalizaron correctamente. Falta repetir en dispositivo el recorrido controlado pausa-movimiento-reanudacion para aprobar el criterio fisico.

### 7. Estabilizar camara, marcador y render del mapa (implementado; prueba fisica Android pendiente)

- Camara no controlada durante navegacion manual.
- Centrado solo por accion explicita.
- Animacion estable del patin y rutas sin parpadeos.
- Capas de ruta local, historica y live claramente separadas.

Criterio de salida: actualizaciones GPS no alteran el zoom ni la posicion elegida por el usuario.

Estado: el mapa activo permanece no controlado mediante `initialRegion`; no recibe `region` y ninguna muestra GPS mueve su camara. Iniciar, pausar y reanudar tampoco centran el mapa: el unico movimiento programatico activo sale del boton de centrado. El historial encuadra una ruta una sola vez despues de `onMapReady`, usando el mismo contrato de camara en lugar de acceder directamente a `react-native-maps`.

El patin conserva `trackingStore.currentLocation` como unica coordenada canonica y usa `AnimatedRegion` solamente como interpolacion visual mediante un adaptador de marcador. Mapa, polylines y marcadores fueron memorizados; segmentos locales y paths live reutilizan una primitiva visual con ordenes de capa definidos en el tema. El cronometro reserva un ancho estable, usa digitos tabulares y no permite salto de linea.

TypeScript, parseo de 245 archivos, Expo Doctor 18/18 y bundle Android de 1279 modulos finalizaron correctamente. Falta comprobar en dispositivo que el zoom manual sobreviva varias muestras GPS, que el patin se anime sin parpadeos y que una ruta historica solo se encuadre al abrirla.

### 8. Consolidar persistencia local y restauracion (implementado; prueba fisica Android pendiente)

- SQLite como almacenamiento durable de sesiones y rutas largas.
- Escrituras por lotes y transacciones.
- Restauracion de sesion activa, pausada o interrumpida.
- Migracion controlada desde AsyncStorage cuando corresponda.

Criterio de salida: cerrar y reabrir la app no pierde una ruta en curso.

Estado: `trackingStore` sigue siendo la unica verdad de ejecucion y SQLite pasa a ser la unica verdad durable. Una misma entidad `tracking_routes` representa la ruta activa, pausada o completada; segmentos y puntos viven normalizados en tablas hijas. El esquema activa WAL, limita la base a una sola ruta activa y usa una cola serial para evitar carreras entre muestras GPS, pausa, reanudacion, Stop e historial.

Cada persistencia de sesion actualiza solo metadatos y agrega los puntos que aun no existen, en lotes de 250 dentro de una transaccion exclusiva. Stop espera la cola y convierte esa misma ruta activa en historica, o la elimina si no cumple las condiciones minimas. Si la transaccion final falla, el store no se reinicia y la ruta activa durable permanece recuperable.

Las APIs publicas de sesion e historial no cambiaron. La migracion desde AsyncStorage es unica e idempotente: conserva IDs, rutas version 1/2 y sesiones activas o pausadas; valida estado, segmentos y cantidad real de puntos dentro de la transaccion; marca la migracion solo tras verificarla y limpia las claves antiguas despues del commit. No hay lectura ni escritura dual despues de migrar.

TypeScript, parseo de 253 archivos, validacion del esquema SQLite, conteo de bindings, cola de escrituras, Expo Doctor 18/18 y bundle Android de 1287 modulos finalizaron correctamente. Falta comprobar en dispositivo la actualizacion sobre datos AsyncStorage existentes y los cierres forzados con sesion activa y pausada para aprobar el criterio fisico.

### 9. Implementar background tracking Android (implementado; prueba fisica Android pendiente)

- Task Manager y servicio foreground Android.
- Buffer durable de puntos capturados en segundo plano.
- Fusion determinista al regresar a primer plano.
- Respeto de privacidad y estado de sesion.

Criterio de salida: una ruta continua sobrevive pantalla bloqueada y cambio de app.


Estado: `expo-task-manager` registra un unico task global antes de montar React y el adaptador Expo implementa el contrato de background ya existente. Start registra el servicio foreground Android solo despues de persistir la sesion activa; Pause, Stop y auto-pausa detienen primero el servicio y reconcilian sus muestras. Al salir de primer plano se elimina el watcher foreground y, al volver, se detiene temporalmente el task, se fusiona el buffer y solo despues se reactiva el watcher, evitando dos productores simultaneos sobre el store.

SQLite sube de esquema 1 a 2 mediante una migracion incremental que conserva rutas y sesiones existentes. La tabla local `tracking_background_points` funciona como bandeja durable, aplica deduplicacion por ruta, timestamp y coordenada, y solo acepta muestras cuando la ruta durable esta activa con estado `tracking`. Al cerrar este punto el task no importaba React, hooks, Zustand ni Supabase.

`trackingStore` conserva la unica verdad de ejecucion y SQLite la unica verdad durable. Todas las muestras foreground y las muestras reconciliadas pasan por `trackingLocationIngestion.logic.js`, que reutiliza el mismo normalizador, filtros y comando atomico del store. El buffer se confirma y elimina solamente despues de persistir exitosamente la sesion fusionada; si la app cae entre persistencia y confirmacion, la siguiente reconciliacion descarta duplicados sin perder la ruta.

La ruta local se captura tanto publica como privada. La publicacion Supabase desde background se agrega en el punto 10 despues de guardar el buffer local y usa solamente la ultima muestra aceptada, respetando privacidad y sin convertir la red en requisito para conservar la ruta.

TypeScript, sintaxis JavaScript, Expo Doctor 18/18 y bundle Android de 1299 modulos finalizaron correctamente. El manifiesto nativo contiene ubicacion background y foreground service location. Falta aprobar en APK real el permiso "Permitir todo el tiempo", la notificacion persistente, pantalla bloqueada, cambio de app, pausa, reanudacion y Stop con historial continuo.
### 10. Endurecer Live Tracking Supabase (implementado; prueba multidispositivo Android pendiente)

- Publicacion limitada por frecuencia y distancia.
- Presencia activa con expiracion y limpieza de sesiones abandonadas.
- Suscripcion Realtime incremental sin consultas por cada evento.
- Rutas live acotadas y separadas del tracking local.

Criterio de salida: dos o mas dispositivos se ven mutuamente sin duplicados ni usuarios fantasma.

Estado: el publicador global se monta en `AppContent` y consume autenticacion, privacidad, estado y ubicacion desde sus stores existentes. Publica en foreground y background mediante el mismo servicio serializado, con minimo de 3 segundos o 5 metros y heartbeat de 15 segundos. Una entrega fallida no adelanta el checkpoint local; pausa, Stop, privacidad y logout serializan la desactivacion para impedir que una escritura pendiente reactive la presencia.

SQLite sube de esquema 2 a 3 con `tracking_live_checkpoints`, separado de la ruta y de la sesion activa. El checkpoint solo registra la ultima publicacion remota confirmada. No se crea tabla ni migracion remota: se reutilizan `tracking_live`, sus politicas y su publicacion Realtime existentes.

El visor se limita a cargar y observar otros usuarios. Se suscribe antes del fetch inicial y encola eventos durante esa ventana; luego aplica INSERT, UPDATE y DELETE directamente desde el payload Realtime. Los perfiles usan cache con solicitudes concurrentes deduplicadas, el store aplica cambios atomicos, cada live path conserva hasta 120 puntos y las presencias con mas de 2 minutos se podan cada 15 segundos.

La privacidad no altera la captura ni el guardado local. En privado, background conserva el buffer pero omite Supabase; al volver a publico, el siguiente punto valido o heartbeat restablece la presencia. La sesion de Supabase conserva AsyncStorage y agrega `processLock` y control de auto-refresh segun el estado de la app.

Validacion tecnica: TypeScript y sintaxis JavaScript correctos, Expo Doctor 18/18 y bundle Android de 1309 modulos; consulta remota de `tracking_live` con relacion de usuario confirmada; canal Realtime llego a `SUBSCRIBED`. Falta validar en APK con dos cuentas y dos dispositivos: visibilidad mutua, rutas live, privacidad, pausa/Stop/logout, pantalla bloqueada, red intermitente y expiracion sin usuarios fantasma.

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
