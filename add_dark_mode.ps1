# Script PowerShell para agregar dark mode a todas las páginas HTML

$files = @(
    "accounts.html",
    "analytics.html",
    "budgets.html",
    "categories.html",
    "expenses.html",
    "export.html",
    "goals.html",
    "help.html",
    "income.html",
    "index.html",
    "new-transaction.html",
    "notifications.html",
    "profile.html",
    "register.html",
    "reports.html",
    "transactions.html"
)

$cssLine = '    <link rel="stylesheet" href="assets/css/dark-mode.css">'
$jsLine = '    <script src="assets/js/dark-mode.js"></script>'

$updated = 0
$skipped = 0

Write-Host "🌙 Agregando Modo Oscuro a todas las páginas..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "📄 Procesando $file..." -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw -Encoding UTF8
        $modified = $false
        
        # Agregar CSS si no existe
        if ($content -notmatch "dark-mode\.css") {
            # Buscar sidebar.css o main.css y agregar después
            if ($content -match '(.*sidebar\.css">\r?\n)') {
                $content = $content -replace '(.*sidebar\.css">\r?\n)', "`$1$cssLine`r`n"
                Write-Host "  ✅ CSS agregado" -ForegroundColor Green
                $modified = $true
            }
            elseif ($content -match '(.*main\.css">\r?\n)') {
                $content = $content -replace '(.*main\.css">\r?\n)', "`$1$cssLine`r`n"
                Write-Host "  ✅ CSS agregado" -ForegroundColor Green
                $modified = $true
            }
        }
        else {
            Write-Host "  ⏭️  Ya tiene dark-mode.css" -ForegroundColor Gray
        }
        
        # Agregar JS si no existe
        if ($content -notmatch "dark-mode\.js") {
            # Buscar auth.js y agregar después
            if ($content -match '(.*auth\.js"><\/script>\r?\n)') {
                $content = $content -replace '(.*auth\.js"><\/script>\r?\n)', "`$1$jsLine`r`n"
                Write-Host "  ✅ JS agregado" -ForegroundColor Green
                $modified = $true
            }
            # Si no hay auth.js, buscar utils.js
            elseif ($content -match '(.*utils\.js"><\/script>\r?\n)') {
                $content = $content -replace '(.*utils\.js"><\/script>\r?\n)', "`$1$jsLine`r`n"
                Write-Host "  ✅ JS agregado" -ForegroundColor Green
                $modified = $true
            }
            # Si no, buscar cualquier script y agregar antes de </body>
            elseif ($content -match '(<\/body>)') {
                $content = $content -replace '(<\/body>)', "$jsLine`r`n`$1"
                Write-Host "  ✅ JS agregado (antes de </body>)" -ForegroundColor Green
                $modified = $true
            }
        }
        else {
            Write-Host "  ⏭️  Ya tiene dark-mode.js" -ForegroundColor Gray
        }
        
        # Guardar si hubo cambios
        if ($modified) {
            $content | Out-File -FilePath $file -Encoding UTF8 -NoNewline
            $updated++
        }
        else {
            $skipped++
        }
        
        Write-Host ""
    }
    else {
        Write-Host "⚠️  $file no encontrado" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "✅ Archivos actualizados: $updated" -ForegroundColor Green
Write-Host "⏭️  Archivos omitidos: $skipped" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 ¡Modo oscuro agregado a todas las páginas!" -ForegroundColor Green
