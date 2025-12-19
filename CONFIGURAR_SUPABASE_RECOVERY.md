# 🔧 CONFIGURAR SUPABASE PARA RECUPERACIÓN DE CONTRASEÑA

## ⚠️ PROBLEMA

Los links de recuperación apuntan a `localhost:3000` en vez de Vercel.

**CAUSA:** Supabase Dashboard tiene configurada la URL de redirect a localhost.

---

## ✅ SOLUCIÓN: Configurar Supabase

### **PASO 1: Abrir Supabase Dashboard**

1. Ve a: https://app.supabase.com
2. Inicia sesión
3. Selecciona tu proyecto: `zczvobqrmucwrbrlksye`

### **PASO 2: Ir a Authentication Settings**

1. En el menú izquierdo, click en **"Authentication"**
2. Click en la pestaña **"URL Configuration"**

### **PASO 3: Configurar Site URL**

Busca **"Site URL"** y cambia a:

```
https://control-gastos-mpc.vercel.app
```

### **PASO 4: Configurar Redirect URLs**

Busca **"Redirect URLs"** y agrega estas URLs:

```
https://control-gastos-mpc.vercel.app/**
https://control-gastos-mpc.vercel.app/reset-password.html
https://control-gastos-mpc.vercel.app/dashboard.html
http://localhost:*/**
```

**Importante:** 
- Una URL por línea
- El `**` al final permite todas las rutas
- Incluir localhost para desarrollo local

### **PASO 5: Guardar Cambios**

1. Scroll hasta abajo
2. Click en **"Save"**
3. Espera confirmación

---

## 🧪 PROBAR DESPUÉS DE CONFIGURAR

### **PASO 1: Solicitar NUEVO Link**

1. Ve a: https://control-gastos-mpc.vercel.app
2. Click "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Click "Enviar enlace"

### **PASO 2: Revisar Email NUEVO**

1. Revisa tu bandeja de entrada
2. Busca el email MÁS RECIENTE de Supabase
3. **IMPORTANTE:** Usa el link del email NUEVO (no el viejo)

### **PASO 3: El Link Ahora Debería Decir:**

```
https://control-gastos-mpc.vercel.app/reset-password.html#access_token=...
```

**NO debería decir:**
```
http://localhost:3000/...
```

---

## 📸 CAPTURAS DE PANTALLA

### **Dónde está "URL Configuration":**

```
Supabase Dashboard
└── Authentication (menú izquierdo)
    └── URL Configuration (pestaña superior)
        ├── Site URL: https://control-gastos-mpc.vercel.app
        └── Redirect URLs:
            ├── https://control-gastos-mpc.vercel.app/**
            ├── https://control-gastos-mpc.vercel.app/reset-password.html
            ├── https://control-gastos-mpc.vercel.app/dashboard.html
            └── http://localhost:*/**
```

---

## ⚡ ALTERNATIVA RÁPIDA (SI NO PUEDES CONFIGURAR SUPABASE)

Si no puedes acceder al dashboard de Supabase, puedo crear una página alternativa que:
1. Pida el email
2. Genere un código de recuperación temporal
3. Envíe el código por email
4. Usuario ingresa código + nueva contraseña

**¿Prefieres esta alternativa?**

---

## 🎯 RESUMEN

**Problema:** Supabase Dashboard tiene configurado localhost  
**Solución:** Cambiar Site URL y Redirect URLs en Supabase  
**Después:** Solicitar NUEVO link de recuperación  

**¿Puedes acceder al dashboard de Supabase para hacer estos cambios?**

O si prefieres, puedo crear el sistema alternativo de recuperación.
