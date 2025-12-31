# Configuración de Supabase para Confirmación de Email Diferida

## Objetivo
Permitir que los usuarios accedan a la aplicación inmediatamente después de registrarse, sin esperar la confirmación del email. El email de confirmación se envía, pero el usuario tiene tiempo (grace period) para confirmarlo.

## Pasos de Configuración en Supabase

### 1. Acceder a la Configuración de Autenticación

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: `control-gastos-mpc`
3. En el menú lateral, click en **Authentication**
4. Click en **Settings** (Configuración)

### 2. Configurar Email Confirmations

En la sección **Email Auth**:

```
☐ Enable email confirmations
```

**DESMARCA** esta opción para permitir acceso inmediato.

### 3. Configurar Email Templates (Opcional)

Si quieres personalizar el email de confirmación:

1. Ve a **Authentication** → **Email Templates**
2. Selecciona **Confirm signup**
3. Personaliza el mensaje:

```html
<h2>Confirma tu cuenta de Control de Gastos</h2>
<p>¡Hola!</p>
<p>Gracias por registrarte. Para confirmar tu cuenta, haz click en el siguiente enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi cuenta</a></p>
<p>Este enlace expirará en 24 horas.</p>
<p>Si no solicitaste esta cuenta, puedes ignorar este email.</p>
```

### 4. Configurar Redirect URLs

En **Authentication** → **URL Configuration**:

Agrega las siguientes URLs permitidas:

```
https://control-gastos-mpc.vercel.app/dashboard.html
http://localhost:3000/dashboard.html (para desarrollo)
```

### 5. Configurar Row Level Security (RLS)

Para permitir que usuarios no confirmados accedan a sus datos:

```sql
-- Política para permitir acceso a usuarios autenticados (confirmados o no)
CREATE POLICY "Users can access their own data"
ON profiles
FOR ALL
USING (auth.uid() = user_id);

-- Política para transacciones
CREATE POLICY "Users can manage their transactions"
ON transactions
FOR ALL
USING (auth.uid() = user_id);
```

### 6. Verificar Configuración

Después de hacer los cambios:

1. Guarda todas las configuraciones
2. Prueba el registro con un email nuevo
3. Verifica que puedas acceder al dashboard sin confirmar
4. Confirma que el email de confirmación se envía correctamente

## Flujo de Usuario

### Registro
```
1. Usuario completa formulario
2. Click en "Crear Cuenta"
3. Supabase crea la cuenta
4. Se envía email de confirmación
5. Usuario es redirigido al dashboard INMEDIATAMENTE
6. Puede usar la app sin restricciones
```

### Confirmación (Opcional)
```
1. Usuario recibe email
2. Tiene tiempo ilimitado para confirmar
3. Click en enlace de confirmación
4. Email queda confirmado
5. No hay cambios en el acceso (ya tenía acceso)
```

## Ventajas de este Enfoque

✅ **Mejor UX**: Usuario puede usar la app inmediatamente
✅ **Menos fricción**: No hay que esperar confirmación
✅ **Seguridad**: El email se envía de todas formas
✅ **Flexibilidad**: Usuario confirma cuando quiera
✅ **Recuperación**: Si pierde acceso, puede recuperar con email confirmado

## Notas Importantes

- Los usuarios NO confirmados pueden usar toda la aplicación
- El email de confirmación se envía automáticamente
- La confirmación es opcional pero recomendada
- Si el usuario pierde la sesión, puede hacer login normalmente
- La confirmación de email es útil para recuperación de contraseña

## Alternativa: Grace Period con Recordatorios

Si quieres recordar al usuario que confirme su email:

1. Guarda en `user_metadata` la fecha de registro
2. Muestra un banner en el dashboard si no ha confirmado después de X días
3. Envía recordatorios por email después de 3, 7, 14 días

Esto se puede implementar con:
- Supabase Edge Functions
- Triggers en la base de datos
- Lógica en el frontend
