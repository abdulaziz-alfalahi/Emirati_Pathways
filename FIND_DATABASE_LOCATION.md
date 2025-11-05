# Find PostgreSQL Database Location on Windows

## Quick Commands to Find Your Database

### Method 1: Using psql (Recommended)

Open **PowerShell** or **Command Prompt** and run:

```powershell
psql -U postgres -c "SHOW data_directory;"
```

**Expected output**:
```
           data_directory            
------------------------------------
 C:/Program Files/PostgreSQL/14/data
(1 row)
```

This shows the exact location of your PostgreSQL data directory!

---

### Method 2: Check PostgreSQL Configuration File

```powershell
psql -U postgres -c "SHOW config_file;"
```

**Expected output**:
```
                    config_file                     
---------------------------------------------------
 C:/Program Files/PostgreSQL/14/data/postgresql.conf
(1 row)
```

The data directory is in the same folder as `postgresql.conf`.

---

### Method 3: Using Windows Services

```powershell
# Get PostgreSQL service details
sc qc postgresql-x64-14
```

**Look for the line**: `BINARY_PATH_NAME`

Example output:
```
BINARY_PATH_NAME   : "C:\Program Files\PostgreSQL\14\bin\pg_ctl.exe" 
                      runservice -N "postgresql-x64-14" 
                      -D "C:\Program Files\PostgreSQL\14\data"
```

The `-D` parameter shows the data directory!

---

### Method 4: Check Environment Variables

```powershell
# Check if PGDATA is set
echo $env:PGDATA
```

If set, this shows your PostgreSQL data directory.

---

### Method 5: Search Registry (Advanced)

```powershell
# Query Windows Registry for PostgreSQL installation
reg query "HKLM\SOFTWARE\PostgreSQL\Installations" /s
```

Look for `Data Directory` entries.

---

### Method 6: Common Default Locations

Try these common paths:

```powershell
# Check if PostgreSQL 14 exists
Test-Path "C:\Program Files\PostgreSQL\14\data"

# Check PostgreSQL 15
Test-Path "C:\Program Files\PostgreSQL\15\data"

# Check PostgreSQL 16
Test-Path "C:\Program Files\PostgreSQL\16\data"

# Check alternative installation
Test-Path "C:\PostgreSQL\14\data"

# Check user-specific installation
Test-Path "$env:USERPROFILE\PostgreSQL\14\data"
```

---

## Find All PostgreSQL Installations

```powershell
# Search for all PostgreSQL installations
Get-ChildItem "C:\Program Files" -Recurse -Filter "postgresql.conf" -ErrorAction SilentlyContinue | Select-Object FullName
```

---

## Find Database Name

Once you know the data directory, find your database name:

```powershell
# List all databases
psql -U postgres -l

# Or
psql -U postgres -c "\l"
```

**Look for databases** related to your project:
- `emirati_journey`
- `emirati_pathways`
- `recruiter_db`
- `recruiter_management`

---

## Complete Database Information

Run this command to get all details:

```powershell
psql -U postgres -c "SELECT name, setting FROM pg_settings WHERE name IN ('data_directory', 'config_file', 'hba_file', 'port');"
```

**Expected output**:
```
      name       |                    setting                     
-----------------+-----------------------------------------------
 config_file     | C:/Program Files/PostgreSQL/14/data/postgresql.conf
 data_directory  | C:/Program Files/PostgreSQL/14/data
 hba_file        | C:/Program Files/PostgreSQL/14/data/pg_hba.conf
 port            | 5432
(4 rows)
```

---

## If PostgreSQL is Not Running

If you get "connection refused" errors, PostgreSQL is not running. Find the installation first:

```powershell
# Find PostgreSQL installation directory
Get-ChildItem "C:\Program Files" -Directory -Filter "PostgreSQL*"

# Or search for pg_ctl.exe
Get-ChildItem "C:\Program Files" -Recurse -Filter "pg_ctl.exe" -ErrorAction SilentlyContinue | Select-Object FullName
```

Once found, start PostgreSQL:

```powershell
# Replace with your actual path
"C:\Program Files\PostgreSQL\14\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\14\data"
```

---

## Summary Command (Run This First!)

```powershell
# This single command gives you everything you need:
psql -U postgres -c "SELECT current_database() as database, pg_database.datname, pg_database_size(pg_database.datname) as size, (SELECT setting FROM pg_settings WHERE name = 'data_directory') as data_directory FROM pg_database WHERE datname = current_database();"
```

---

## What to Share With Me

After running the commands above, share:

1. **Data directory location**: From `SHOW data_directory;`
2. **Database name**: From `psql -U postgres -l`
3. **PostgreSQL version**: From `psql --version`
4. **Port number**: Usually 5432

**Example**:
```
Data directory: C:/Program Files/PostgreSQL/14/data
Database name: emirati_journey
PostgreSQL version: 14.8
Port: 5432
```

Then I can help you configure the test data script correctly!

---

## Quick Start (Copy-Paste This)

```powershell
# Run all checks at once:
Write-Host "=== PostgreSQL Version ===" -ForegroundColor Green
psql --version

Write-Host "`n=== Data Directory ===" -ForegroundColor Green
psql -U postgres -c "SHOW data_directory;"

Write-Host "`n=== Config File ===" -ForegroundColor Green
psql -U postgres -c "SHOW config_file;"

Write-Host "`n=== Available Databases ===" -ForegroundColor Green
psql -U postgres -l

Write-Host "`n=== Port ===" -ForegroundColor Green
psql -U postgres -c "SHOW port;"
```

Copy all the output and share it with me!

