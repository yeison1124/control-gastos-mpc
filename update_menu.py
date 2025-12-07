import os
import re

# Directorio del proyecto
project_dir = r"c:\Users\Usuario\Downloads\Wed Control de Gastos"

# Lista de archivos HTML a actualizar (excluyendo dashboard.html que ya actualizamos e index.html que no tiene sidebar)
html_files = [
    "transactions.html",
    "new-transaction.html",
    "expenses.html",
    "categories.html",
    "budgets.html",
    "goals.html",
    "accounts.html",
    "analytics.html",
    "export.html",
    "notifications.html",
    "settings.html",
    "help.html",
    "profile.html",
    "reports.html"
]

# Patrón a buscar (el menú antiguo)
old_pattern = r'(<li><a href="analytics\.html"><i class="bi bi-graph-up"></i> Análisis</a></li>\s*' \
              r'<li><a href="export\.html"><i class="bi bi-download"></i> Exportar</a></li>\s*' \
              r'<li><a href="notifications\.html"><i class="bi bi-bell"></i> Notificaciones</a></li>\s*' \
              r'<li><a href="settings\.html"><i class="bi bi-gear"></i> Configuración</a></li>\s*' \
              r'<li><a href="help\.html"><i class="bi bi-question-circle"></i> Ayuda</a></li>)'

# Nuevo contenido del menú
new_menu = '''<li><a href="analytics.html"><i class="bi bi-graph-up"></i> Análisis</a></li>
                <li><a href="reports.html"><i class="bi bi-bar-chart"></i> Reportes</a></li>
                <li><a href="export.html"><i class="bi bi-download"></i> Exportar</a></li>
                <li><a href="notifications.html"><i class="bi bi-bell"></i> Notificaciones</a></li>
                <li><a href="settings.html"><i class="bi bi-gear"></i> Configuración</a></li>
                <li><a href="profile.html"><i class="bi bi-person"></i> Perfil</a></li>
                <li><a href="help.html"><i class="bi bi-question-circle"></i> Ayuda</a></li>'''

# Contador de archivos actualizados
updated_count = 0

for html_file in html_files:
    file_path = os.path.join(project_dir, html_file)
    
    if not os.path.exists(file_path):
        print(f"⚠️  Archivo no encontrado: {html_file}")
        continue
    
    try:
        # Leer contenido del archivo
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Reemplazar el patrón
        new_content = re.sub(old_pattern, new_menu, content, flags=re.DOTALL)
        
        # Verificar si hubo cambios
        if new_content != content:
            # Guardar archivo actualizado
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Actualizado: {html_file}")
            updated_count += 1
        else:
            print(f"ℹ️  Sin cambios: {html_file}")
    
    except Exception as e:
        print(f"❌ Error en {html_file}: {str(e)}")

print(f"\n🎉 Proceso completado: {updated_count} archivos actualizados")
