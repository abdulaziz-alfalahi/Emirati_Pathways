@echo off
echo Running migration: Add reject columns to job_offers table
echo.

cd /d "%~dp0"
python add_reject_columns_to_job_offers.py

echo.
echo Press any key to exit...
pause > nul

