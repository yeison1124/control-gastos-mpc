-- ==========================================
-- FIX: CORREGIR ADVERTENCIA DE SEGURIDAD EN FUNCIÓN
-- ==========================================

-- Esta consulta corrige el error: "La función tiene un rol mutable search_path"
-- Estableciendo search_path = public aseguramos que la función sea segura.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- INSTRUCCIONES:
-- 1. Copia todo este código.
-- 2. Pégalo en el SQL Editor de Supabase.
-- 3. Ejecuta (Run).
-- 4. Intenta registrarte de nuevo.
-- ==========================================
