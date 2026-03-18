@echo off
echo Starting PHP built-in server...
cd /d "C:\Users\mencke\Documents\Projekte\Umfrage"
php -S localhost:8080 > nul 2>&1 &
echo Server started on http://localhost:8080
timeout /t 3 > nul
echo Running database setup...
curl -s http://localhost:8080/setup_db.php
echo.
echo Setup complete. Press any key to stop server...
pause > nul
taskkill /F /IM php.exe > nul 2>&1