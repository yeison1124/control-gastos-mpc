# Script para actualizar el menú del sidebar en todos los archivos HTML

## Archivos actualizados manualmente:
✅ dashboard.html
✅ transactions.html

## Patron a reemplazar en los archivos restantes:

**BUSCAR:**
```html
<li><a href="analytics.html"><i class="bi bi-graph-up"></i> Análisis</a></li>
<li><a href="export.html"><i class="bi bi-download"></i> Exportar</a></li>
<li><a href="notifications.html"><i class="bi bi-bell"></i> Notificaciones</a></li>
<li><a href="settings.html"><i class="bi bi-gear"></i> Configuración</a></li>
<li><a href="help.html"><i class="bi bi-question-circle"></i> Ayuda</a></li>
```

**REEMPLAZAR CON:**
```html
<li><a href="analytics.html"><i class="bi bi-graph-up"></i> Análisis</a></li>
<li><a href="reports.html"><i class="bi bi-bar-chart"></i> Reportes</a></li>
<li><a href="export.html"><i class="bi bi-download"></i> Exportar</a></li>
<li><a href="notifications.html"><i class="bi bi-bell"></i> Notificaciones</a></li>
<li><a href="settings.html"><i class="bi bi-gear"></i> Configuración</a></li>
<li><a href="profile.html"><i class="bi bi-person"></i> Perfil</a></li>
<li><a href="help.html"><i class="bi bi-question-circle"></i> Ayuda</a></li>
```

## Archivos que necesitan actualización:
1. new-transaction.html
2. expenses.html
3. categories.html
4. budgets.html
5. goals.html
6. accounts.html
7. analytics.html
8. export.html
9. notifications.html
10. settings.html
11. help.html
12. profile.html
13. reports.html

## Cómo actualizar manualmente:

1. Abre cada archivo HTML en un editor de texto (VS Code, Notepad++, etc.)
2. Usa Ctrl+F para buscar: `<li><a href="analytics.html"`
3. Selecciona desde esa línea hasta `<li><a href="help.html"` (incluida)
4. Reemplaza con el bloque completo que incluye Reportes y Perfil (ver arriba)
5. Guarda el archivo

## Atajo rápido con buscar y reemplazar (Ctrl+H en VS Code):

**Buscar (modo regex activado):**
```
<li><a href="analytics\.html"><i class="bi bi-graph-up"></i> Análisis</a></li>\s*<li><a href="export\.html"><i class="bi bi-download"></i> Exportar</a></li>\s*<li><a href="notifications\.html"><i class="bi bi-bell"></i> Notificaciones</a></li>\s*<li><a href="settings\.html"><i class="bi bi-gear"></i> Configuración</a></li>\s*<li><a href="help\.html"><i class="bi bi-question-circle"></i> Ayuda</a></li>
```

**Reemplazar con:**
```
<li><a href="analytics.html"><i class="bi bi-graph-up"></i> Análisis</a></li>
                <li><a href="reports.html"><i class="bi bi-bar-chart"></i> Reportes</a></li>
                <li><a href="export.html"><i class="bi bi-download"></i> Exportar</a></li>
                <li><a href="notifications.html"><i class="bi bi-bell"></i> Notificaciones</a></li>
                <li><a href="settings.html"><i class="bi bi-gear"></i> Configuración</a></li>
                <li><a href="profile.html"><i class="bi bi-person"></i> Perfil</a></li>
                <li><a href="help.html"><i class="bi bi-question-circle"></i> Ayuda</a></li>
```
