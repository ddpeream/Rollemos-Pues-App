# 🗄️ Integración de Backend Supabase

## 📋 Plan de Integración

### Archivos a CREAR:

1. **`utils/supabase.js`** (o `services/supabase.js`)
   - Configurar cliente de Supabase con las dos claves
   - Inicializar conexión

2. **`store/useSupabaseStore.js`** (en Zustand)
   - Manejo de datos de Supabase
   - Sincronización entre pantallas

### Archivos a EDITAR:

1. **`screens/Galeria.js`**
   - En vez de `galeriaData` hardcodeado, traer de Supabase
   - Guardar likes en la BD
   - Subir nuevas fotos

2. **`screens/Patinadores.js`**
   - Traer patinadores desde BD
   - Guardar favoritos del usuario

3. **`screens/Parches.js` y `screens/Spots.js`**
   - Igual, traer datos de Supabase

4. **`App.js`**
   - Inicializar Supabase al abrir la app

### Tablas a CREAR en Supabase:

#### Tabla: `usuarios`
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  avatar_url TEXT,
  ciudad TEXT,
  nivel TEXT,
  disciplina TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

- `galeria` (fotos, likes, comentarios)
- `patinadores` (datos de patinadores)
- `parches` (equipos)
- `spots` (lugares de patinaje)
- `favoritos` (likes de usuarios)

---

## 🔄 Flujo de la app:

1. **Usuario abre la app** → Supabase se inicializa
2. **Ve la galería** → Trae fotos desde BD
3. **Da like** → Se guarda en la BD
4. **Sube foto** → Se sube a Supabase Storage + BD
5. **Cierra sesión** → Datos se syncronizan

---

## ⚡ Resumen rápido:

- 2-3 archivos **nuevos**
- 4-5 archivos **editados**
- 5-6 tablas en Supabase
- Todo lo demás sigue igual
