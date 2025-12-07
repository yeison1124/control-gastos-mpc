# Control de Gastos - Aplicación Web

## 📋 Descripción

Aplicación web completa para control de gastos personales desarrollada con HTML, Bootstrap, JavaScript y Supabase.

## 🚀 Características Implementadas

✅ **Autenticación**
- Login y registro de usuarios
- Recuperación de contraseña
- Sesiones persistentes

✅ **Dashboard**
- Métricas financieras en tiempo real
- Transacciones recientes
- Presupuestos mensuales
- Metas de ahorro
- Acciones rápidas

✅ **Transacciones**
- Lista completa de transacciones
- Búsqueda y filtros avanzados
- Edición y eliminación
- Paginación

## 📁 Estructura del Proyecto

```
Wed Control de Gastos/
├── index.html                    # Página de login
├── register.html                 # Página de registro
├── dashboard.html                # Dashboard principal
│
├── assets/
│   ├── css/
│   │   ├── main.css             # Estilos principales
│   │   └── sidebar.css          # Estilos del sidebar
│   │
│   └── js/
│       ├── config.js            # Configuración de Supabase
│       ├── utils.js             # Funciones auxiliares
│       ├── auth.js              # Autenticación
│       ├── sidebar.js           # Navegación
│       ├── dashboard.js         # Lógica del dashboard
│       └── transactions.js      # Gestión de transacciones
```

## ⚙️ Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa los datos:
   - Nombre del proyecto: `control-gastos`
   - Database Password: (elige una contraseña segura)
   - Region: (selecciona la más cercana)
5. Espera a que el proyecto se cree (1-2 minutos)

### 2. Copiar Credenciales

1. En el panel de Supabase, ve a **Settings** > **API**
2. Copia estos dos valores:
   - **Project URL**: `https://xxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NI6...` (clave muy larga)

### 3. Configurar la Aplicación

Abre el archivo `assets/js/config.js` y reemplaza estas líneas:

```javascript
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';  // ← Pega tu Project URL aquí
const SUPABASE_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';  // ← Pega tu anon/public key aquí
```

### 4. Crear las Tablas de la Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Haz clic en **New Query**
3. Copia y pega el siguiente script SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'credit', 'savings')),
  balance DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  account_id UUID REFERENCES accounts,
  category_id UUID REFERENCES categories,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES categories,
  amount DECIMAL(12, 2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  deadline DATE,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('budget', 'goal', 'transaction')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for Categories
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Accounts
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Budgets
CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Goals
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. Haz clic en **Run** para ejecutar el script
5. Verifica que aparezca el mensaje "Success. No rows returned"

### 5. Verificar las Tablas

1. Ve a **Table Editor** en el menú lateral
2. Deberías ver todas las tablas creadas:
   - profiles
   - categories
   - accounts
   - transactions
   - budgets
   - goals
   - notifications

## 🌐 Cómo Ejecutar la Aplicación

### Opción 1: Servidor Local (Recomendado)

1. Instala la extensión **Live Server** en VS Code
2. Abre la carpeta del proyecto en VS Code
3. Haz clic derecho en `index.html` > "Open with Live Server"
4. La aplicación se abrirá en `http://localhost:5500`

### Opción 2: Python HTTP Server

```bash
# En la carpeta del proyecto
python -m http.server 8000

# o con Python 3
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` en tu navegador.

### Opción 3: Node.js http-server

```bash
# Instalar http-server globalmente (solo una vez)
npm install -g http-server

# En la carpeta del proyecto
http-server -p 8000
```

Luego abre `http://localhost:8000` en tu navegador.

## 👤 Primer Uso

1. Abre la aplicación en tu navegador
2. Haz clic en "Regístrate aquí"
3. Completa el formulario de registro
4. Las categorías predeterminadas se crearán automáticamente
5. ¡Listo! Ya puedes empezar a usar la aplicación

## 🎨 Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **Bootstrap 5.3**: Framework CSS responsive
- **JavaScript ES6+**: Lógica de la aplicación
- **Supabase**: Backend y base de datos
- **Chart.js**: Gráficos y visualizaciones
- **Bootstrap Icons**: Iconografía
- **Google Fonts (Inter)**: Tipografía moderna

## 📝 Próximas Características

- [ ] Página de nueva transacción completa
- [ ] Página de gastos detallados
- [ ] Página de ingresos
- [ ] Gestión de categorías
- [ ] Gestión de presupuestos
- [ ] Gestión de metas
- [ ] Gestión de cuentas
- [ ] Análisis y reportes
- [ ] Exportación de datos
- [ ] Notificaciones
- [ ] Configuración y perfil

## 🐛 Solución de Problemas

### Error "Failed to fetch"
- Verifica que hayas configurado correctamente las credenciales en `config.js`
- Asegúrate de que el proyecto de Supabase esté activo

### Error "relation does not exist"
- Verifica que hayas ejecutado el script SQL completo en Supabase
- Revisa que todas las tablas estén creadas en Table Editor

### La aplicación no carga
- Asegúrate de estar usando un servidor local (no abras directamente el archivo HTML)
- Verifica la consola del navegador para ver errores específicos

## 📧 Soporte

Si encuentras algún problema o tienes preguntas, revisa:
1. La consola del navegador (F12) para ver errores
2. Los logs de Supabase en el panel de administración
3. Verifica que todas las credenciales estén correctamente configuradas

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y educativo.
