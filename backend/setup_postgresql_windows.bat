@echo off
echo 🇦🇪 EMIRATI JOURNEY PLATFORM - POSTGRESQL SETUP
echo =====================================================
echo.
echo Setting up test user accounts for PostgreSQL database...
echo.
echo 💡 Make sure PostgreSQL is running and accessible
echo    Default connection: localhost:5432/emirati_platform
echo.

python setup_postgresql_users.py

echo.
echo Setup completed! You can now log in to the platform.
echo.
pause
