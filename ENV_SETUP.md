# 🔧 GUÍA DE CONFIGURACIÓN - Variables de Entorno

Esta guía te ayudará a configurar correctamente las variables de entorno de tu proyecto Rollemos Pues.

---

## 📋 TABLA DE CONTENIDOS

1. [Variables de Entorno Requeridas](#variables-de-entorno-requeridas)
2. [Configuración para Desarrollo](#configuración-para-desarrollo)
3. [Configuración para Producción](#configuración-para-producción)
4. [Obtener Credenciales de Supabase](#obtener-credenciales-de-supabase)
5. [Solución de Problemas](#solución-de-problemas)

---

## 🔑 VARIABLES DE ENTORNO REQUERIDAS

Tu aplicación necesita las siguientes variables de entorno:

| Variable | Descripción | Dónde se usa |
|----------|-------------|--------------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | Cliente de Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Llave anónima pública de Supabase | Cliente de Supabase |

> **Nota**: El prefijo `EXPO_PUBLIC_` es necesario para que Expo pueda acceder a estas variables en el cliente.

---

## 💻 CONFIGURACIÓN PARA DESARROLLO

### Paso 1: Crear archivo .env.local

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Abre `.env.local` y reemplaza los valores con tus credenciales reales:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-real
   ```

### Paso 2: Verificar que .gitignore incluye .env.local

Asegúrate de que `.gitignore` contiene:
```
.env
*.env
*.local
```

✅ **Tu archivo .env.local NUNCA debe subirse a git**

### Paso 3: Reiniciar el servidor de desarrollo

Después de crear o modificar .env.local:
```bash
# Detener el servidor actual (Ctrl+C)

# Limpiar caché
npx expo start --clear

# O simplemente
npm start
```

---

## 🚀 CONFIGURACIÓN PARA PRODUCCIÓN

### Opción A: EAS Build (Recomendado)

EAS Build maneja las variables de entorno de forma segura.

#### 1. Configurar secrets en EAS

```bash
# Instalar EAS CLI (si no lo tienes)
npm install -g eas-cli

# Login
eas login

# Configurar secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://tu-proyecto.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-anon-key"
```

#### 2. Actualizar eas.json

Tu `eas.json` debe verse así:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$(EXPO_PUBLIC_SUPABASE_URL)",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$(EXPO_PUBLIC_SUPABASE_ANON_KEY)"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$(EXPO_PUBLIC_SUPABASE_URL)",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$(EXPO_PUBLIC_SUPABASE_ANON_KEY)"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "$(EXPO_PUBLIC_SUPABASE_URL)",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$(EXPO_PUBLIC_SUPABASE_ANON_KEY)"
      }
    }
  }
}
```

#### 3. Construir la app

```bash
# Preview build (para testing)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### Opción B: Usando app.json (Menos Seguro)

Si necesitas incluir las credenciales directamente en `app.json` para desarrollo local:

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_SUPABASE_URL": "https://tu-proyecto.supabase.co",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "tu-anon-key"
    }
  }
}
```

⚠️ **ADVERTENCIA**: Si usas esta opción:
- NO subas app.json a un repositorio público
- Asegúrate de tener RLS configurado (ver SECURITY_SETUP.md)
- Considera usar variables de entorno con EAS Secrets en producción

---

## 🔍 OBTENER CREDENCIALES DE SUPABASE

### Paso 1: Acceder a tu proyecto

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión
3. Selecciona tu proyecto (o crea uno nuevo)

### Paso 2: Obtener las credenciales

1. En el menú lateral, ve a **Settings** ⚙️
2. Selecciona **API**
3. Copia los valores:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Ejemplo de valores

```bash
# URL del proyecto (Project URL)
EXPO_PUBLIC_SUPABASE_URL=https://xyzabcdefg.supabase.co

# Anon key (anon public)
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Nota**: La anon key es muy larga (varios cientos de caracteres). Cópiala completa.

---

## 🔒 SEGURIDAD

### ¿Es seguro exponer la anon key?

**SÍ**, la anon key está diseñada para ser pública. La seguridad viene de:

1. **Row Level Security (RLS)**: Políticas que controlan quién puede acceder a qué datos
2. **Autenticación**: Solo usuarios autenticados pueden hacer ciertas operaciones
3. **Validaciones del servidor**: Supabase valida cada request

### ⚠️ IMPORTANTE: Debes configurar RLS

Sin RLS, **cualquier persona con tu anon key puede acceder a todos tus datos**.

✅ **Sigue la guía SECURITY_SETUP.md** para configurar RLS antes de lanzar en producción.

### ¿Qué NO debes exponer?

- ❌ **service_role key**: Esta key tiene permisos de admin
- ❌ **Database password**: Nunca la uses en el cliente
- ❌ **JWT secret**: Solo para el servidor

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Configuración de Supabase faltante"

**Causa**: No se encuentran las variables de entorno.

**Solución**:
1. Verifica que `.env.local` existe y tiene las variables correctas
2. Reinicia el servidor con `npx expo start --clear`
3. Verifica que las variables tienen el prefijo `EXPO_PUBLIC_`

### Error: "Invalid API key"

**Causa**: La anon key es incorrecta.

**Solución**:
1. Copia nuevamente la anon key desde Supabase
2. Asegúrate de copiar la key **completa** (es muy larga)
3. No debe tener espacios ni saltos de línea

### Error: "fetch failed" o "Network error"

**Causa**: La URL de Supabase es incorrecta o no hay conexión.

**Solución**:
1. Verifica que la URL sea exactamente la que aparece en Supabase
2. Debe incluir `https://` al inicio
3. No debe tener `/` al final
4. Verifica tu conexión a internet

### Las variables no se actualizan

**Causa**: Expo cachea las variables de entorno.

**Solución**:
```bash
# Limpiar caché completamente
rm -rf node_modules .expo
npm install
npx expo start --clear
```

### Error en producción: "Cannot read environment variables"

**Causa**: Las variables no están configuradas en EAS.

**Solución**:
1. Configura las variables con `eas secret:create`
2. Actualiza `eas.json` con las variables
3. Rebuilds la app con `eas build`

---

## 📝 CHECKLIST DE CONFIGURACIÓN

### Desarrollo Local
- [ ] Archivo `.env.example` existe
- [ ] Archivo `.env.local` creado con credenciales reales
- [ ] `.env.local` está en `.gitignore`
- [ ] Variables tienen el prefijo `EXPO_PUBLIC_`
- [ ] Servidor reiniciado con `--clear`
- [ ] App se conecta a Supabase correctamente

### Producción
- [ ] EAS CLI instalado
- [ ] Secrets configurados con `eas secret:create`
- [ ] `eas.json` actualizado con variables
- [ ] RLS configurado en Supabase (ver SECURITY_SETUP.md)
- [ ] Build de producción exitoso
- [ ] App probada en dispositivo real

---

## 🔗 RECURSOS ÚTILES

- [Documentación de Supabase](https://supabase.com/docs)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Build Configuration](https://docs.expo.dev/build/introduction/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ❓ PREGUNTAS FRECUENTES

### ¿Puedo usar diferentes proyectos de Supabase para dev y prod?

**Sí**, es una buena práctica. Configura:
- `.env.local` con credenciales de desarrollo
- EAS Secrets con credenciales de producción

### ¿Necesito pagar por Supabase?

El plan gratuito incluye:
- 500MB de espacio en base de datos
- 1GB de almacenamiento
- 2GB de ancho de banda

Suficiente para un MVP. Puedes actualizar después.

### ¿Qué hago si expuse mis credenciales en git?

1. **Rotar las keys** en Supabase:
   - Ve a Settings → API
   - Genera nuevas keys
2. Actualiza `.env.local` con las nuevas keys
3. Actualiza los secrets en EAS
4. Elimina el historial de git o haz el repo privado

---

**Fecha de creación**: 2025-11-02
**Versión**: 1.0
**Última actualización**: 2025-11-02
