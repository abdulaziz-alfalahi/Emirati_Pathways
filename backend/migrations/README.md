# Database Migrations

This directory contains database migration scripts for the Emirati Pathways platform.

## How to Run Migrations

### Windows

1. Open Command Prompt or PowerShell
2. Navigate to the migrations directory:
   ```powershell
   cd C:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\backend\migrations
   ```

3. Run the migration script:
   ```powershell
   python add_reject_columns_to_job_offers.py
   ```

   Or double-click `run_migration.bat`

### Linux/Mac

```bash
cd backend/migrations
python3 add_reject_columns_to_job_offers.py
```

## Available Migrations

### add_reject_columns_to_job_offers.py

**Date:** 2025-01-07

**Description:** Adds support for offer rejection by adding three new columns to the `job_offers` table:
- `rejected_by` (VARCHAR(50)) - ID of the user who rejected the offer
- `rejection_date` (TIMESTAMP) - Date and time when the offer was rejected
- `rejection_reason` (TEXT) - Reason for rejecting the offer

**Required:** Yes, if you want to use the offer rejection feature

**Safe to run multiple times:** Yes, the script checks if columns already exist before adding them

## Troubleshooting

### Error: "relation 'job_offers' does not exist"

The `job_offers` table hasn't been created yet. Start the backend server first to create the table, then run the migration.

### Error: "column already exists"

This is normal if you've already run the migration. The script will skip existing columns.

### Database Connection Error

Make sure your `.env` file has the correct database credentials:
```
DB_HOST=localhost
DB_NAME=emirati_pathways
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
```

