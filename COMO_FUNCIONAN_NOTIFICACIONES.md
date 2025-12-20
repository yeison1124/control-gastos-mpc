# 📱 CÓMO FUNCIONAN LAS NOTIFICACIONES

## 🎯 RESUMEN EJECUTIVO

El sistema de notificaciones es **completamente automático** e inteligente. Analiza tus datos financieros en tiempo real y te avisa de:
- ⚠️ Presupuestos cercanos a excederse
- 💰 Gastos inusuales
- ⏰ Recordatorios de pagos
- 💡 Patrones y oportunidades de ahorro

---

## 🔄 FLUJO GENERAL

```
1. Usuario usa la app normalmente
   ↓
2. Sistema analiza transacciones/presupuestos AUTOMÁTICAMENTE
   ↓
3. Detecta situaciones importantes (gastos altos, presupuestos, etc.)
   ↓
4. CREA NOTIFICACIÓN automáticamente
   ↓
5. Notificación aparece en Centro de Notificaciones
   ↓
6. Usuario la ve y toma acción
```

---

## 🤖 TIPOS DE NOTIFICACIONES Y CÓMO SE GENERAN

### **1. ALERTAS DE PRESUPUESTO** 💸

#### **¿Cuándo se generan?**
Automáticamente cuando:
- Usas **80%** de tu presupuesto → Alerta amarilla
- Usas **90%** de tu presupuesto → Alerta naranja  
- Usas **100%** de tu presupuesto → Alerta roja

#### **¿Cómo funciona?**
```javascript
// El sistema calcula automáticamente:
1. Suma todos tus gastos del mes en cada categoría
2. Compara con el presupuesto de esa categoría
3. Calcula el porcentaje: (gastos / presupuesto) * 100
4. Si pasa el threshold (80%, 90%, 100%):
   → CREA NOTIFICACIÓN
```

#### **Ejemplo Real:**
```
Presupuesto Restaurantes: $500
Gastos hasta ahora: $450
Porcentaje: 90%

→ GENERA NOTIFICACIÓN:
"⚠️ Presupuesto Casi Agotado
Has usado el 90% de tu presupuesto de Restaurantes"
```

#### **Protección Anti-Spam:**
- Solo crea UNA notificación por threshold
- Cooldown de 24 horas
- No te molesta constantemente

---

### **2. GASTOS INUSUALES** 📊

#### **¿Cuándo se generan?**
Cuando gastas significativamente más de lo normal

#### **¿Cómo funciona?**
```javascript
// Análisis estadístico automático:
1. Calcula tu gasto PROMEDIO
2. Calcula la DESVIACIÓN ESTÁNDAR
3. Si un gasto es > Promedio + (2 × Desviación):
   → Es INUSUAL
   → CREA NOTIFICACIÓN
```

#### **Ejemplo Real:**
```
Tus gastos normales en Transporte: $20-$50
Promedio: $35
Desviación estándar: $15

Hoy gastas: $120 en Uber

$120 > $35 + (2 × $15) = $65
→ ¡GASTO INUSUAL!

→ GENERA NOTIFICACIÓN:
"📈 Gasto Inusual Detectado
Gastaste $120 en Transporte, 243% más que tu promedio"
```

---

### **3. RECORDATORIOS** ⏰

#### **¿Cuándo se generan?**
- **Manuales**: Tú los creas
- **Automáticos**: El día indicado

#### **¿Cómo funcionan?**

**A. Crear Recordatorio:**
```
1. Vas a Centro de Notificaciones
2. Click "Crear Recordatorio"
3. Completas:
   - Título: "Pagar Luz"
   - Fecha: 25 de cada mes
   - Recurrente: SÍ
4. SE GUARDA
```

**B. Notificación Automática:**
```javascript
// Cada vez que cargas la app o cada 5 min:
1. Sistema revisa la fecha de hoy
2. Compara con todos los recordatorios
3. Si algún recordatorio.fecha === hoy:
   → CREA NOTIFICACIÓN
   → "⏰ Recordatorio: Pagar Luz"
```

**C. Recordatorios Recurrentes:**
```javascript
Si es recurrente:
1. Notificación se crea HOY
2. Automáticamente crea próximo para: próximo mes
3. Nunca tienes que recrearlo
```

---

### **4. INSIGHTS (PATRONES Y TENDENCIAS)** 💡

#### **A. Patrón de Día de la Semana**

**¿Cómo funciona?**
```javascript
1. Agrupa TODOS tus gastos por día de la semana
2. Suma totales de cada día
3. Encuentra el día con MÁS gastos
4. → GENERA NOTIFICACIÓN
```

**Ejemplo:**
```
Lunes: $150
Martes: $80
Miércoles: $90
Jueves: $100
Viernes: $200  ← MÁXIMO
Sábado: $350   ← MÁXIMO
Domingo: $120

→ GENERA NOTIFICACIÓN:
"📅 Patrón Identificado
Tiendes a gastar más los Sábados ($350 total)"
```

---

#### **B. Tendencias de Categorías**

**¿Cómo funciona?**
```javascript
1. Compara últimos 30 días vs anteriores 30 días
2. Por cada categoría, calcula % de cambio
3. Si aumento > 50% o reducción > 30%:
   → GENERA NOTIFICACIÓN
```

**Ejemplo:**
```
Restaurantes hace 30-60 días: $400
Restaurantes últimos 30 días: $700

Aumento: (700-400)/400 × 100 = 75%

→ GENERA NOTIFICACIÓN:
"📈 Aumento en Categoría
Tus gastos en Restaurantes aumentaron 75% este mes"
```

---

#### **C. Oportunidades de Ahorro**

**¿Cómo funciona?**
```javascript
1. Busca transacciones con descripción similar
2. Cuenta cuántas veces aparece
3. Suma el total gastado
4. Si aparece ≥4 veces Y total > $100:
   → OPORTUNIDAD DE AHORRO
   → GENERA NOTIFICACIÓN
```

**Ejemplo:**
```
Encontradas:
- "Café Starbucks" - $4.50 (8 veces)
- Total: $36

→ GENERA NOTIFICACIÓN:
"💰 Oportunidad de Ahorro
Gastas frecuentemente en 'Café Starbucks' (8 veces, $36 total). 
¿Podrías reducirlo?"
```

---

## 💾 ¿DÓNDE SE GUARDAN?

### **Storage Utilizado:**

```javascript
// LocalStorage (navegador)
"notifications_[tu_user_id]" → Todas tus notificaciones
"reminders_[tu_user_id]" → Tus recordatorios

// Supabase (servidor)
- transactions → Para análisis
- budgets → Para alertas
- categories → Para clasificación
```

### **Estructura de una Notificación:**

```javascript
{
  id: "1703098765432",
  type: "warning",           // danger, warning, info, success
  icon: "exclamation-circle", 
  title: "Alerta de Presupuesto",
  description: "Has usado el 90% de tu presupuesto...",
  category: "budget",        // budget, reminder, unusual, etc.
  createdAt: "2024-12-20T21:30:00Z",
  read: false,              // true cuando la lees
  referenceId: "budget-90-123" // Para evitar duplicados
}
```

---

## ⏰ ¿CUÁNDO SE REVISAN/GENERAN?

### **Automáticamente en:**

1. **Al abrir la app** ✅
   - Revisa TODO
   - Genera notificaciones nuevas
   
2. **Cada 5 minutos** ✅ (background)
   - Mientras tengas la app abierta
   - No necesitas refrescar
   
3. **Al crear/editar transacción** ✅
   - Recalcula presupuestos
   - Detecta gastos inusuales
   
4. **Al cambiar de fecha** ✅
   - Revisa recordatorios del día

### **Código que lo hace:**

```javascript
// Al cargar página
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData(); // Genera notificaciones
});

// Cada 5 minutos
setInterval(async () => {
    await checkBudgetAlerts();
    await loadReminders();
    await generateInsights();
}, 5 * 60 * 1000); // 5 minutos = 300,000 ms
```

---

## 🎯 EJEMPLO COMPLETO DE USO

### **Escenario: María usa la app**

**Lunes 18 de Diciembre:**

```
09:00 AM - María abre la app
→ Sistema revisa automáticamente
→ Detecta: Presupuesto Restaurantes al 85%
→ CREA NOTIFICACIÓN: "⚠️ Has usado 85% de tu presupuesto"

11:30 AM - María gasta $150 en Mecánico
→ Sistema detecta: Gasto mucho mayor que promedio ($35)
→ CREA NOTIFICACIÓN: "📈 Gasto inusual: $150, 329% sobre promedio"

14:00 PM - Recordatorio programado para hoy
→ Sistema ve: Recordatorio "Pagar Internet" fecha=18/12
→ CREA NOTIFICACIÓN: "⏰ Recordatorio: Pagar Internet"

17:00 PM - María revisa notificaciones
→ Ve 3 notificaciones nuevas
→ Click en cada una
→ Se marcan como "leídas"
```

**Viernes 22 de Diciembre:**

```
Sistema analiza últimos 30 días vs anteriores
→ Detecta: Gastos Entretenimiento -40%
→ CREA NOTIFICACIÓN: "🎉 ¡Redujiste gastos en Entretenimiento 40%!"

→ Detecta: 6 compras "Café" = $42
→ CREA NOTIFICACIÓN: "💡 Oportunidad: gastas $42 en café frecuentemente"
```

---

## 📱 CÓMO VERLAS

### **Opción 1: Centro de Notificaciones**
```
1. Click en menú lateral → "Notificaciones"
2. O ve directamente a: notifications-center.html
3. Ve todas en tab "Todas"
```

### **Opción 2: Badge en el Menú** (Próximamente)
```
Sidebar mostrará:
🔔 Notificaciones (3) ← Counter de no leídas
```

### **Opción 3: Toast Popups**
```
Cuando se crea notificación crítica:
→ Toast aparece automáticamente
→ Esquina superior derecha
→ Desaparece en 5 segundos
```

---

## 🔕 ¿SE PUEDEN DESACTIVAR?

**Actualmente:** Todas están activas por defecto

**Próximamente en Settings:**
```
□ Alertas de Presupuesto
□ Gastos Inusuales  
□ Recordatorios
□ Insights y Patrones
```

Podrás elegir cuáles quieres.

---

## ❓ PREGUNTAS FRECUENTES

### **P: ¿Me llegan al correo electrónico?**
**R:** No actualmente. Solo se muestran en la app. Próximamente se puede agregar email/SMS.

### **P: ¿Las notificaciones se sincronizan entre dispositivos?**
**R:** Actualmente están en LocalStorage (solo tu navegador). Para sincronizar necesitaríamos guardarlas en Supabase.

### **P: ¿Puedo crear notificaciones personalizadas?**
**R:** Solo puedes crear Recordatorios manualmente. Las demás son automáticas.

### **P: ¿Se borran automáticamente?**
**R:** No, se quedan hasta que las leas o refresques datos. Puedes implementar auto-borrado después de 30 días.

### **P: ¿Funcionan sin internet?**
**R:** Las que ya se crearon SÍ (están en LocalStorage). Pero para generar nuevas necesitas internet para consultar Supabase.

### **P: ¿Pueden molestar mucho (spam)?**
**R:** No, tienen protección:
- Cooldown de 24h entre notificaciones similares
- Solo una por threshold
- Solo insights relevantes

---

## 🚀 PRÓXIMAS MEJORAS POSIBLES

1. **Notificaciones Push**
   - Funciona incluso con app cerrada
   - Permisos del navegador

2. **Email Digest**
   - Resumen semanal por email
   - "Esta semana gastaste..."

3. **Configuración Granular**
   - Activar/desactivar por tipo
   - Personalizar thresholds

4. **Sincronización**
   - Guardar en Supabase
   - Ver en cualquier dispositivo

5. **Smart Timing**
   - Enviar a mejor hora del día
   - Basado en tu comportamiento

---

## 📊 RESUMEN TÉCNICO

```
NOTIFICACIONES = f(Datos Financieros)

Inputs:
- Transacciones
- Presupuestos  
- Recordatorios manuales

Procesamiento:
- Análisis estadístico
- Detección de patrones
- Comparación de períodos
- Reglas de negocio

Outputs:
- Notificaciones categorizadas
- Almacenadas en LocalStorage
- Mostradas en UI
- Opcionales: Toasts en tiempo real
```

---

## ✅ EN RESUMEN

**Las notificaciones son 100% AUTOMÁTICAS:**

1. ✅ Analizan tu actividad financiera
2. ✅ Detectan situaciones importantes
3. ✅ Te avisan proactivamente
4. ✅ Te ayudan a tomar mejores decisiones
5. ✅ Todo sin que tengas que hacer nada

**Es como tener un asistente financiero personal trabajando 24/7 para ti** 🤖💰

---

¿Necesitas más detalles sobre algún tipo específico de notificación? 😊
