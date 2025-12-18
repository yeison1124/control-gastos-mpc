# 🔐 Configuración de Autenticación con Facebook

## ✅ Código Ya Implementado

Ya he agregado todo el código necesario para que funcione el inicio de sesión con Facebook:

- ✅ Función `handleFacebookLogin()` en `auth.js`
- ✅ Botón conectado en `index.html` (Login)
- ✅ Botón conectado en `register.html` (Registro)
- ✅ Manejo automático de categorías predeterminadas para nuevos usuarios OAuth

---

## 🔵 Configurar Facebook OAuth

### PASO 1: Ir a Facebook Developers

1. Ve a: https://developers.facebook.com/
2. Inicia sesión con tu cuenta de Facebook
3. Haz clic en **My Apps** (Mis Apps)
4. Haz clic en **Create App** (Crear App)

### PASO 2: Crear la Aplicación

1. Selecciona **Consumer** como tipo de app
2. Haz clic en **Next** (Siguiente)
3. Completa la información:
   - **App name:** Control de Gastos
   - **App contact email:** tu@email.com
4. Haz clic en **Create App** (Crear App)

### PASO 3: Configurar Facebook Login

1. En el dashboard de tu app, busca **Add Product** (Agregar Producto)
2. Encuentra **Facebook Login** 
3. Haz clic en **Set Up** (Configurar)
4. Selecciona **Web** como plataforma

### PASO 4: Configurar URLs de Redirección

1. En el menú lateral, ve a **Facebook Login** → **Settings** (Configuración)
2. En **Valid OAuth Redirect URIs** (URIs de redirección OAuth válidas), agrega:

```
https://zczvobqrmucwrbrlksye.supabase.co/auth/v1/callback
```

3. Haz clic en **Save Changes** (Guardar Cambios)

### PASO 5: Obtener Credenciales

1. En el menú lateral, ve a **Settings** → **Basic** (Configuración → Básica)
2. Aquí encontrarás:
   - **App ID** (ID de la App)
   - **App Secret** (Secreto de la App)

3. Copia el **App ID**
4. Haz clic en **Show** (Mostrar) junto a **App Secret** y cópialo
   - Es posible que te pida tu contraseña de Facebook

### PASO 6: Configurar en Supabase

1. Ve a tu proyecto en Supabase:
   - https://app.supabase.com/project/zczvobqrmucwrbrlksye

2. En el menú lateral, haz clic en **Authentication** 🔐

3. Luego en **Providers** (Proveedores)

4. Busca **Facebook** en la lista y haz clic en él

5. Activa el toggle **"Enable Sign in with Facebook"**

6. Pega tus credenciales:
   - **Facebook client ID:** Pega el App ID que copiaste
   - **Facebook client secret:** Pega el App Secret que copiaste

7. Haz clic en **Save** (Guardar)

### PASO 7: Configurar el Modo de la App (Importante)

Para que funcione en producción:

1. Regresa a Facebook Developers
2. En el dashboard de tu app, ve a **Settings** → **Basic**
3. Desplázate hasta abajo
4. Cambia **App Mode** de **Development** a **Live**
   - Nota: Es posible que necesites completar información adicional como Privacy Policy URL

---

## 🧪 Probar la Autenticación

### En Desarrollo (Localhost)

1. Abre tu aplicación: `index.html`
2. Haz clic en **"Continuar con Facebook"**
3. Deberías ser redirigido a Facebook
4. Autoriza la aplicación
5. Serás redirigido automáticamente a `dashboard.html`

### Verificar en Supabase

1. Ve a **Authentication** → **Users**
2. Deberías ver tu nuevo usuario
3. En la columna **Provider** debería decir "facebook"

---

## ⚠️ Solución de Problemas Comunes

### Error: "URL Blocked: This redirect failed"

**Causa:** La URL de callback no está configurada correctamente en Facebook

**Solución:**
1. Ve a Facebook Developers → Tu App → Facebook Login → Settings
2. Verifica que la URL sea exactamente:
   ```
   https://zczvobqrmucwrbrlksye.supabase.co/auth/v1/callback
   ```
3. Asegúrate de hacer clic en "Save Changes"

### Error: "App Not Setup: This app is still in development mode"

**Causa:** La app de Facebook está en modo desarrollo

**Solución:**
1. Ve a Settings → Basic
2. Cambia **App Mode** a **Live**
3. Completa los requisitos necesarios (Privacy Policy, etc.)

### Error: "Invalid OAuth redirect URI"

**Causa:** La URL no coincide exactamente

**Solución:**
- Copia y pega la URL exacta sin espacios extra
- Debe incluir `https://` al inicio
- No debe tener `/` al final

### Error: "Provider not enabled"

**Causa:** Facebook no está habilitado en Supabase

**Solución:**
1. Ve a Supabase → Authentication → Providers
2. Asegúrate de que el toggle de Facebook esté activado (verde)
3. Verifica que hayas guardado los cambios

### Los usuarios no tienen categorías

**Solución:**
- El código ya maneja esto automáticamente
- Las categorías se crean la primera vez que el usuario inicia sesión
- Verifica en la consola del navegador (F12) si hay errores

---

## 📝 Información Adicional

### Permisos que Facebook Comparte

Por defecto, Facebook comparte:
- ✅ Email del usuario
- ✅ Nombre completo
- ✅ Foto de perfil (opcional)

**NO se comparte:**
- ❌ Contraseña de Facebook
- ❌ Lista de amigos
- ❌ Publicaciones
- ❌ Mensajes

### URLs Importantes

**Facebook Developers Dashboard:**
```
https://developers.facebook.com/apps/
```

**Supabase Authentication:**
```
https://app.supabase.com/project/zczvobqrmucwrbrlksye/auth/providers
```

**Callback URL (para copiar):**
```
https://zczvobqrmucwrbrlksye.supabase.co/auth/v1/callback
```

---

## 🔒 Seguridad y Privacidad

### Datos Almacenados

En tu base de datos se guarda:
- Email del usuario
- Nombre completo
- ID único de Supabase
- Provider: "facebook"

### Datos NO Almacenados

- Contraseña de Facebook
- Token de acceso de Facebook (solo en Supabase)
- Información privada de Facebook

### Mejores Prácticas

1. **No compartas** el App Secret públicamente
2. **Usa HTTPS** en producción
3. **Configura** una Privacy Policy URL
4. **Revisa** los permisos regularmente

---

## ✅ Checklist de Configuración

- [ ] Crear cuenta en Facebook Developers
- [ ] Crear nueva app en Facebook
- [ ] Configurar Facebook Login
- [ ] Agregar Valid OAuth Redirect URI
- [ ] Copiar App ID
- [ ] Copiar App Secret
- [ ] Ir a Supabase → Authentication → Providers
- [ ] Habilitar Facebook
- [ ] Pegar App ID en Supabase
- [ ] Pegar App Secret en Supabase
- [ ] Guardar cambios en Supabase
- [ ] Cambiar app a modo Live (para producción)
- [ ] Probar login con Facebook
- [ ] Verificar que se crean las categorías

---

## 🎉 ¡Listo para Usar!

Una vez completados estos pasos, tus usuarios podrán:
- ✅ Iniciar sesión con Facebook en 1 clic
- ✅ Registrarse con Facebook sin crear contraseña
- ✅ Obtener categorías predeterminadas automáticamente
- ✅ Empezar a usar la app inmediatamente

**Tiempo estimado:** 20-30 minutos
**Dificultad:** Media (siguiendo esta guía)

---

## 💡 Tips Finales

1. **Prueba primero en desarrollo** antes de hacer la app Live
2. **Guarda** el App ID y Secret en un lugar seguro
3. **No compartas** el App Secret en repositorios públicos
4. **Configura** una Privacy Policy si vas a publicar la app

¿Necesitas ayuda con algún paso? 🚀
