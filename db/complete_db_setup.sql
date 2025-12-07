-- ==========================================================
-- SCRIPT DE CONFIGURACIÓN COMPLETA DE BASE DE DATOS (V4)
-- ==========================================================
-- Instrucciones:
-- 1. Copia TODO el contenido de este archivo.
-- 2. Pégalo en el SQL Editor de Supabase.
-- 3. Dale al botón "Run".
-- ==========================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. TABLAS BASE
-- ==========================================

-- Perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Perfiles (Borrar y recrear para evitar errores)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- Categorías
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories Access" ON public.categories;
CREATE POLICY "Categories Access" ON public.categories FOR ALL USING (auth.uid() = user_id);


-- Cuentas
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'credit', 'savings')),
  balance DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accounts Access" ON public.accounts;
CREATE POLICY "Accounts Access" ON public.accounts FOR ALL USING (auth.uid() = user_id);


-- Transacciones
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  account_id UUID REFERENCES public.accounts,
  category_id UUID REFERENCES public.categories,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transactions Access" ON public.transactions;
CREATE POLICY "Transactions Access" ON public.transactions FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 3. REPARACIÓN DE COLUMNAS (Para tablas existentes)
-- ==========================================
DO $$
BEGIN
    -- PROFILES: Agregar columna currency si falta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'currency') THEN
        ALTER TABLE public.profiles ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;

    -- TRANSACTIONS: Reparaciones anteriores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'account_id') THEN
        ALTER TABLE public.transactions ADD COLUMN account_id UUID REFERENCES public.accounts;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'category_id') THEN
        ALTER TABLE public.transactions ADD COLUMN category_id UUID REFERENCES public.categories;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_recurring') THEN
        ALTER TABLE public.transactions ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'notes') THEN
        ALTER TABLE public.transactions ADD COLUMN notes TEXT;
    END IF;
END $$;


-- ==========================================
-- 4. TABLAS ADICIONALES
-- ==========================================

-- Presupuestos
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES public.categories,
  amount DECIMAL(12, 2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Budgets Access" ON public.budgets;
CREATE POLICY "Budgets Access" ON public.budgets FOR ALL USING (auth.uid() = user_id);


-- Metas
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  deadline DATE,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Goals Access" ON public.goals;
CREATE POLICY "Goals Access" ON public.goals FOR ALL USING (auth.uid() = user_id);


-- Notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('budget', 'goal', 'transaction')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications Access" ON public.notifications;
CREATE POLICY "Notifications Access" ON public.notifications FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 5. FINALIZAR
-- ==========================================
NOTIFY pgrst, 'reload config';
SELECT 'SISTEMA DE BASE DE DATOS COMPLETAMENTE REPARADO (V4)' as status;
