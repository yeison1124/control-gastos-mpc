@echo off
echo ===================================================
echo   INICIANDO MODO COMPARTIDO (TUNNELING)
echo ===================================================
echo.
echo 1. Iniciando servidor local en el puerto 8080...
start "Servidor Local" cmd /k "npx http-server -p 8080 -c-1"

echo.
echo 2. Creando tunel publico...
echo    Espere a que aparezca el link "your url is: ..."
echo.
start "Tunel Publico" cmd /k "npx localtunnel --port 8080"

echo ===================================================
echo   INSTRUCCIONES:
echo   - Se han abierto dos ventanas nuevas.
echo   - Una es el servidor local (no la cierres).
echo   - La otra mostrara un link como https://algo-random.loca.lt
echo   - ESE es el link que debes compartir.
echo   - Para detenerlo, simplemente cierra las ventanas.
echo ===================================================
pause
