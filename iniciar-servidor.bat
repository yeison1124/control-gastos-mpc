@echo off
echo ========================================
echo   SERVIDOR LOCAL - Control de Gastos
echo ========================================
echo.
echo Iniciando servidor en http://localhost:8000
echo.
echo IMPORTANTE:
echo - NO cierres esta ventana
echo - Abre tu navegador en: http://localhost:8000
echo - Para detener el servidor: Ctrl + C
echo.
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 8000

pause
