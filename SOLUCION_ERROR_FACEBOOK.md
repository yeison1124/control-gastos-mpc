# 🔧 Solución: "Identificador de la app no válido" - Facebook OAuth

## 🚨 Error Actual

```
Identificador de la app no válido
El identificador indicado no parece un identificador de la app válido.
```

---

## 🔍 Causas Posibles

1. ❌ App ID incorrecto en Supabase
2. ❌ App de Facebook en modo Development
3. ❌ Redirect URI no configurado correctamente
4. ❌ App de Facebook no publicada

---

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Verificar App ID en Facebook Developers

1. Ve a: https://developers.facebook.com/apps/
2. Haz clic en tu app "Control de Gastos"
3. Ve a **Settings** → **Basic** (Configuración → Básica)
4. Copia el **App ID** (debe ser un número de 15-16 dígitos)
   - Ejemplo: `123456789012345`

### PASO 2: Verificar Configuración en Supabase

1. Ve a: https://app.supabase.com/project/zczvobqrmucwrbrlksye/auth/providers
2. Haz clic en **Facebook**
3. Verifica que:
   - ✅ El toggle "Enable Sign in with Facebook" esté ACTIVADO (verde)
   - ✅ El **Facebook client ID** sea exactamente el App ID de Facebook
   - ✅ El **Facebook client secret** esté correcto

### PASO 3: Configurar Redirect URI en Facebook

1. En Facebook Developers, ve a **Facebook Login** → **Settings**
2. En **Valid OAuth Redirect URIs**, asegúrate de tener:

```
https://zczvobqrmucwrbrlksye.supabase.co/auth/v1/callback
```

3. **IMPORTANTE:** Haz clic en **Save Changes** (abajo a la derecha)

### PASO 4: Cambiar App a Modo Live (CRÍTICO)

Este es probablemente el problema principal:

1. En Facebook Developers, ve a la parte superior
2. Verás un toggle que dice **"Development"** o **"Live"**
3. Si dice **Development**, haz lo siguiente:

   **A. Completar Información Requerida:**
   - Ve a **Settings** → **Basic**
   - Completa:
     - **Privacy Policy URL:** Puedes usar: `https://tudominio.com/privacy` (temporal)
     - **Category:** Selecciona "Business and Pages"
     - **App Icon:** Sube un icono (mínimo 1024x1024px)

   **B. Cambiar a Live:**
   - En la parte superior, cambia el toggle de **Development** a **Live**
   - Confirma el cambio

### PASO 5: Agregar Dominio de la App

1. En Facebook Developers, ve a **Settings** → **Basic**
2. Busca **App Domains**
3. Agrega:
```
zczvobqrmucwrbrlksye.supabase.co
```
4. Guarda los cambios

---

## 🧪 PRUEBA RÁPIDA

### Opción 1: Usar la Consola de Facebook

1. Ve a: https://developers.facebook.com/tools/debug/accesstoken/
2. Pega tu App ID
3. Si es válido, te mostrará información de la app

### Opción 2: Verificar en Supabase

1. Ve a Supabase → Authentication → Providers → Facebook
2. Haz clic en **Save** nuevamente (aunque no hayas cambiado nada)
3. Espera 30 segundos
4. Intenta el login de nuevo

---

## 📋 CHECKLIST DE VERIFICACIÓN

Marca cada item:

- [ ] App ID copiado correctamente (sin espacios)
- [ ] App Secret copiado correctamente
- [ ] Redirect URI configurado: `https://zczvobqrmucwrbrlksye.supabase.co/auth/v1/callback`
- [ ] Facebook Login habilitado en la app
- [ ] App en modo **Live** (no Development)
- [ ] Privacy Policy URL configurada
- [ ] App Domains configurado
- [ ] Cambios guardados en Facebook
- [ ] Cambios guardados en Supabase
- [ ] Esperado 30 segundos después de guardar

---

## 🔄 SI AÚN NO FUNCIONA

### Solución Alternativa: Recrear la Configuración

1. **En Supabase:**
   - Desactiva Facebook (toggle OFF)
   - Guarda
   - Espera 10 segundos
   - Activa Facebook (toggle ON)
   - Pega App ID y Secret nuevamente
   - Guarda

2. **En Facebook:**
   - Ve a Facebook Login → Settings
   - Elimina el Redirect URI
   - Guarda
   - Agrégalo de nuevo
   - Guarda

3. **Limpia caché del navegador:**
   - Presiona `Ctrl + Shift + Delete`
   - Selecciona "Cookies y otros datos de sitios"
   - Limpia
   - Cierra y abre el navegador

---

## 🎯 CONFIGURACIÓN CORRECTA FINAL

### En Facebook Developers:

```
App ID: [Tu número de 15 dígitos]
App Secret: [Tu clave secreta]
App Mode: Live ✅
Privacy Policy URL: https://tudominio.com/privacy
App Domains: zczvobqrmucwrbrlksye.supabase.co

Facebook Login → Settings:
Valid OAuth Redirect URIs:
  https://zczvobqrmucwrbrlksye.supabase.co/auth/v1/callback
```

### En Supabase:

```
Provider: Facebook
Enabled: ✅ ON
Facebook client ID: [Tu App ID]
Facebook client secret: [Tu App Secret]
```

---

## 🖼️ CAPTURAS DE PANTALLA DE REFERENCIA

### Cómo debe verse en Facebook:

**Settings → Basic:**
```
App ID: 123456789012345
App Secret: ••••••••••••••••
App Domains: zczvobqrmucwrbrlksye.supabase.co
Privacy Policy URL: https://tudominio.com/privacy
```

**Facebook Login → Settings:**
```
Valid OAuth Redirect URIs:
https://zczvobqrmucwrbrlksye.supabase.co/auth/v1/callback
```

**Modo de la App (arriba):**
```
[Switch] Live ← Debe estar en Live, no Development
```

---

## ⚠️ ERRORES COMUNES

### Error 1: Espacios en el App ID
```
❌ " 123456789012345"
❌ "123456789012345 "
✅ "123456789012345"
```

### Error 2: App en Development
```
❌ Mode: Development
✅ Mode: Live
```

### Error 3: Redirect URI incorrecto
```
❌ https://zczvobqrmucwrbrlksye.supabase.co/auth/v1/callback/
❌ http://zczvobqrmucwrbrlksye.supabase.co/auth/v1/callback
✅ https://zczvobqrmucwrbrlksye.supabase.co/auth/v1/callback
```

---

## 📞 SI NECESITAS AYUDA

Dime:
1. ¿Tu app de Facebook está en modo "Live" o "Development"?
2. ¿Cuántos dígitos tiene tu App ID?
3. ¿Guardaste los cambios en Facebook después de agregar el Redirect URI?

---

## 🎉 DESPUÉS DE SOLUCIONAR

Una vez que funcione:

1. Prueba el login con Facebook
2. Verifica que se cree el usuario en Supabase
3. Verifica que se creen las categorías automáticamente
4. ¡Disfruta de tu autenticación OAuth! 🚀

---

**Tiempo estimado de solución:** 10-15 minutos  
**Dificultad:** Media

¿En qué paso específico necesitas ayuda? 🔧
