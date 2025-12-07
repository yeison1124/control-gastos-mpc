-- ==========================================
-- ESQUEMA DE BASE DE DATOS - CONTROL DE GASTOS
-- ==========================================

-- 1. TABLA DE PERFILES (Profiles)
-- Se vincula automáticamente con la tabla auth.users de Supabase
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- Habilitar Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Políticas de Seguridad para Perfiles
create policy "Los usuarios pueden ver su propio perfil" 
on profiles for select 
using ( auth.uid() = id );

create policy "Los usuarios pueden actualizar su propio perfil" 
on profiles for update 
using ( auth.uid() = id );

-- 2. TABLA DE CATEGORÍAS
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  icon text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.categories enable row level security;

-- Políticas de Seguridad para Categorías
create policy "Usuarios pueden ver sus propias categorías" 
on categories for select 
using ( auth.uid() = user_id );

create policy "Usuarios pueden crear sus propias categorías" 
on categories for insert 
with check ( auth.uid() = user_id );

create policy "Usuarios pueden actualizar sus propias categorías" 
on categories for update 
using ( auth.uid() = user_id );

create policy "Usuarios pueden eliminar sus propias categorías" 
on categories for delete 
using ( auth.uid() = user_id );

-- 3. TABLA DE TRANSACCIONES
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount decimal(12,2) not null,
  description text not null,
  date date not null default CURRENT_DATE,
  category_id uuid references categories(id) on delete set null,
  type text not null check (type in ('expense', 'income')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.transactions enable row level security;

-- Políticas de Seguridad para Transacciones
create policy "Usuarios pueden ver sus propias transacciones" 
on transactions for select 
using ( auth.uid() = user_id );

create policy "Usuarios pueden crear sus propias transacciones" 
on transactions for insert 
with check ( auth.uid() = user_id );

create policy "Usuarios pueden actualizar sus propias transacciones" 
on transactions for update 
using ( auth.uid() = user_id );

create policy "Usuarios pueden eliminar sus propias transacciones" 
on transactions for delete 
using ( auth.uid() = user_id );

-- 4. TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE
-- Esta función se ejecuta cada vez que un usuario se registra
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Configurar el trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- INSTRUCCIONES:
-- 1. Ve al Dashboard de Supabase -> SQL Editor
-- 2. Copia y pega todo este contenido.
-- 3. Dale a "Run" para crear todas las tablas y políticas.
-- ==========================================
