-- ============================================
-- AGREGAR POLÍTICA PARA VERIFICACIÓN DE EMAIL
-- ============================================
-- Este script permite que usuarios NO autenticados puedan verificar
-- si un email existe en la tabla profiles (solo lectura del email)

-- Crear política para permitir verificación pública de emails
CREATE POLICY "Public email verification" 
ON public.profiles 
FOR SELECT 
USING (true);  -- Permite a cualquiera leer

-- NOTA IMPORTANTE:
-- Esta política permite leer TODOS los campos de profiles.
-- Si solo quieres exponer el email, considera crear una vista:

-- Opción alternativa más segura (Vista):
/*
CREATE VIEW public.email_check AS 
SELECT email FROM public.profiles;

-- Luego dar permiso de lectura a la vista
GRANT SELECT ON public.email_check TO anon, authenticated;
*/

-- ============================================
-- CÓMO USAR
-- ============================================
-- 1. Ve a Supabase Dashboard
-- 2. SQL Editor
-- 3. Pega este script
-- 4. Click "Run"

-- ============================================
-- IMPORTANTE: SEGURIDAD
-- ============================================
-- Esta política permite que usuarios no autenticados puedan:
-- - Ver si un email existe
-- - Esto es necesario para la función "olvidé mi contraseña"
-- 
-- NO permite:
-- - Ver las contraseñas (esas están en auth.users, no en profiles)
-- - Modificar datos
-- - Eliminar datos
-- 
-- Los campos sensibles como balance, configuración personal, etc.
-- son visibles con esta política. Si esto es un problema,
-- usa la alternativa de la Vista comentada arriba.
