@echo off
echo ===================================================
echo   INICIANDO MODO COMPARTIDO (NGROK TUNNELING)
echo ===================================================
echo.
echo 1. Iniciando servidor local en el puerto 8080...
start "Servidor Local" cmd /k "npx http-server -p 8080 -c-1"

echo.
echo 2. Creando tunel publico con ngrok...
echo    Espere a que aparezca la linea "Forwarding: ..."
echo.

:: La ejecucion de ngrok ahora es posible porque ngrok.exe esta en la misma carpeta
start "Tunel Publico" cmd /k "ngrok http 8080"

echo ===================================================
echo   INSTRUCCIONES:
echo   - Se han abierto dos ventanas nuevas.
echo   - La ventana de NGROK mostrara un link "Forwarding".
echo   - ESE es el link que debes compartir (no pedira IP).
echo   - Para detenerlo, simplemente cierra las ventanas.
echo ===================================================
pause