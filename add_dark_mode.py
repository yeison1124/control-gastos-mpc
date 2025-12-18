import os
import re

# Lista de archivos HTML a actualizar
html_files = [
    'accounts.html',
    'analytics.html',
    'budgets.html',
    'categories.html',
    'dashboard.html',
    'expenses.html',
    'export.html',
    'goals.html',
    'help.html',
    'income.html',
    'index.html',
    'new-transaction.html',
    'notifications.html',
    'profile.html',
    'register.html',
    'reports.html',
    'transactions.html',
    'test_supabase.html'
]

# Directorio base
base_dir = r'C:\Users\Usuario\Downloads\Wed Control de Gastos'

# CSS a agregar
dark_mode_css = '    <link rel="stylesheet" href="assets/css/dark-mode.css">'

# JS a agregar
dark_mode_js = '    <script src="assets/js/dark-mode.js"></script>'

def add_dark_mode_to_file(filepath):
    """Agrega dark mode CSS y JS a un archivo HTML"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # Verificar si ya tiene dark-mode.css
        if 'dark-mode.css' not in content:
            # Buscar el último <link> en el <head>
            # Patrón: buscar la última línea que contenga <link
            last_link_pattern = r'(.*<link[^>]*>)'
            matches = list(re.finditer(last_link_pattern, content, re.DOTALL))
            
            if matches:
                last_match = matches[-1]
                insert_pos = last_match.end()
                content = content[:insert_pos] + '\n' + dark_mode_css + content[insert_pos:]
                modified = True
                print(f"  ✅ CSS agregado a {os.path.basename(filepath)}")
            else:
                # Si no hay links, buscar </head>
                head_pattern = r'(</head>)'
                match = re.search(head_pattern, content)
                if match:
                    insert_pos = match.start()
                    content = content[:insert_pos] + dark_mode_css + '\n' + content[insert_pos:]
                    modified = True
                    print(f"  ✅ CSS agregado a {os.path.basename(filepath)} (antes de </head>)")
        else:
            print(f"  ⏭️  {os.path.basename(filepath)} ya tiene dark-mode.css")
        
        # Verificar si ya tiene dark-mode.js
        if 'dark-mode.js' not in content:
            # Buscar el último <script> antes de </body>
            # Patrón: buscar la última línea que contenga <script src=
            last_script_pattern = r'(.*<script src=[^>]*></script>)'
            matches = list(re.finditer(last_script_pattern, content, re.DOTALL))
            
            if matches:
                last_match = matches[-1]
                insert_pos = last_match.end()
                content = content[:insert_pos] + '\n' + dark_mode_js + content[insert_pos:]
                modified = True
                print(f"  ✅ JS agregado a {os.path.basename(filepath)}")
            else:
                # Si no hay scripts, buscar </body>
                body_pattern = r'(</body>)'
                match = re.search(body_pattern, content)
                if match:
                    insert_pos = match.start()
                    content = content[:insert_pos] + '    ' + dark_mode_js + '\n' + content[insert_pos:]
                    modified = True
                    print(f"  ✅ JS agregado a {os.path.basename(filepath)} (antes de </body>)")
        else:
            print(f"  ⏭️  {os.path.basename(filepath)} ya tiene dark-mode.js")
        
        # Guardar si hubo cambios
        if modified and content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
        
    except Exception as e:
        print(f"  ❌ Error en {os.path.basename(filepath)}: {str(e)}")
        return False

def main():
    print("🌙 Agregando Modo Oscuro a todas las páginas...\n")
    
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for html_file in html_files:
        filepath = os.path.join(base_dir, html_file)
        
        if not os.path.exists(filepath):
            print(f"  ⚠️  {html_file} no encontrado")
            error_count += 1
            continue
        
        print(f"📄 Procesando {html_file}...")
        result = add_dark_mode_to_file(filepath)
        
        if result:
            updated_count += 1
        else:
            skipped_count += 1
        
        print()
    
    print("=" * 50)
    print(f"✅ Archivos actualizados: {updated_count}")
    print(f"⏭️  Archivos omitidos: {skipped_count}")
    print(f"❌ Errores: {error_count}")
    print("=" * 50)
    print("\n🎉 ¡Modo oscuro agregado a todas las páginas!")

if __name__ == "__main__":
    main()
