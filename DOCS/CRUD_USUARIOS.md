# CRUD de Usuarios - Documentación

## 📁 Estructura

```
utils/
  ├── supabase.js          (Conexión a Supabase - solo cliente)
  └── usuarios.js          (CRUD completo de usuarios)

screens/
  ├── Auth.js              (Login)
  ├── Signup.js            (Registro - usa createUsuario)
  └── Patinadores.js       (Muestra usuarios - usa getUsuarios)
```

## 🔧 Funciones Disponibles en `utils/usuarios.js`

### 🔍 LECTURA

#### `getUsuarios()`
- **Descripción**: Obtiene todos los usuarios de la BD
- **Retorna**: Array de usuarios o `null` si hay error
- **Uso**:
```javascript
import { getUsuarios } from './utils/usuarios';

const usuarios = await getUsuarios();
```

#### `getUsuarioById(id)`
- **Descripción**: Obtiene un usuario por su ID
- **Parámetros**: `id` (string UUID)
- **Retorna**: Objeto usuario o `null`
- **Uso**:
```javascript
const usuario = await getUsuarioById('04922f25-a065-41b3-a304-7ab2aa642b82');
```

#### `getUsuarioByEmail(email)`
- **Descripción**: Obtiene un usuario por email
- **Parámetros**: `email` (string)
- **Retorna**: Objeto usuario o `null`
- **Uso**:
```javascript
const usuario = await getUsuarioByEmail('dedapemo@gmail.com');
```

### ✏️ CREAR

#### `createUsuario(usuarioData)`
- **Descripción**: Crea un nuevo usuario en la BD
- **Parámetros**:
```javascript
{
  nombre: string (requerido),
  email: string (requerido, único),
  password: string (requerido, mín 6 caracteres),
  ciudad: string (requerido),
  nivel: string (requerido: 'principiante', 'intermedio', 'avanzado', 'profesional'),
  disciplina: string (requerido: 'street', 'park', 'freestyle', 'speed', 'downhill', 'cruising'),
  bio: string (opcional)
}
```
- **Retorna**: 
```javascript
{ 
  success: true,
  data: usuarioCreado
}
// O
{ 
  success: false,
  error: 'mensaje de error'
}
```
- **Uso**:
```javascript
import { createUsuario } from './utils/usuarios';

const resultado = await createUsuario({
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  password: 'password123',
  ciudad: 'Medellín',
  nivel: 'intermedio',
  disciplina: 'street',
  bio: 'Me encanta patinar'
});

if (resultado.success) {
  console.log('Usuario creado:', resultado.data);
} else {
  console.log('Error:', resultado.error);
}
```

### ✏️ ACTUALIZAR

#### `updateUsuario(id, usuarioData)`
- **Descripción**: Actualiza datos de un usuario
- **Parámetros**: 
  - `id`: string UUID
  - `usuarioData`: objeto con campos a actualizar
- **Retorna**: `{ success: true, data }` o `{ success: false, error }`
- **Uso**:
```javascript
const resultado = await updateUsuario(usuarioId, {
  bio: 'Nueva biografía',
  nivel: 'avanzado'
});
```

### 🗑️ ELIMINAR

#### `deleteUsuario(id)`
- **Descripción**: Elimina un usuario
- **Parámetros**: `id` (string UUID)
- **Retorna**: `{ success: true }` o `{ success: false, error }`
- **Uso**:
```javascript
const resultado = await deleteUsuario(usuarioId);
```

### 🔐 AUTENTICACIÓN

#### `validateLogin(email, password)`
- **Descripción**: Valida credenciales de login
- **Parámetros**: `email`, `password`
- **Retorna**: `{ success: true, data: usuario }` (sin password) o `{ success: false, error }`
- **Nota**: NO retorna la contraseña
- **Uso**:
```javascript
const resultado = await validateLogin('usuario@example.com', 'pass123');
if (resultado.success) {
  setUser(resultado.data); // En Zustand
}
```

### 📊 ESTADÍSTICAS

#### `getUsuariosStats()`
- **Descripción**: Obtiene estadísticas de usuarios
- **Retorna**: 
```javascript
{
  total: 5,
  porNivel: {
    principiante: 2,
    intermedio: 2,
    avanzado: 1
  },
  porDisciplina: {
    street: 2,
    park: 1,
    downhill: 1,
    freestyle: 1
  }
}
```
- **Uso**:
```javascript
const stats = await getUsuariosStats();
console.log(`Total usuarios: ${stats.total}`);
```

## 🔄 Flujo de Registro

1. Usuario ingresa datos en `Signup.js`
2. Se validan todos los campos
3. Se llama `createUsuario()` desde `utils/usuarios.js`
4. La función valida que el email no esté registrado
5. Se inserta en la BD tabla `usuarios`
6. Se retorna `{ success: true, data }`
7. Se establece el usuario en Zustand store
8. Se navega a la app autenticada

## 🔄 Flujo de Login

1. Usuario ingresa email y password en `Auth.js`
2. Se llama `validateLogin()` (futuro, por ahora es hardcodeado)
3. Se retorna usuario sin password
4. Se establece en Zustand store
5. App redirige a `MainStack`

## 📋 Tabla de Usuarios en Supabase

```sql
CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password varchar(255) NOT NULL,
  avatar_url text,
  ciudad varchar(100) NOT NULL,
  nivel varchar(50) NOT NULL,
  disciplina varchar(50) NOT NULL,
  bio text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

## ⚠️ Notas de Seguridad

- Las contraseñas NO están hasheadas (implementación futura)
- Se recomienda usar bcrypt en producción
- El servidor debe validar todas las entradas
- Implementar RLS (Row Level Security) en Supabase
- Usar variables de entorno para credenciales

## 🚀 Próximas Tablas

Para las próximas tablas seguirá el mismo patrón:
- `utils/parches.js` (CRUD de parches)
- `utils/spots.js` (CRUD de spots)
- `utils/galeria.js` (CRUD de galería)
- etc.

Cada archivo tendrá sus propias funciones CRUD organizadas por operación.
