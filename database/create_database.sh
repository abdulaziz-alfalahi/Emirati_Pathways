#!/bin/bash

# 🗄️ Emirati Journey Platform - Database Creation Script
# This script creates the PostgreSQL database and user for the platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🗄️ Emirati Journey Platform - Database Setup"
echo "============================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL first."
    echo ""
    echo "Installation commands:"
    echo "Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "macOS: brew install postgresql"
    echo "Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

print_success "PostgreSQL found"

# Check if PostgreSQL service is running
if ! sudo systemctl is-active --quiet postgresql 2>/dev/null && ! brew services list | grep postgresql | grep started &>/dev/null; then
    print_warning "PostgreSQL service is not running. Attempting to start..."
    
    # Try to start PostgreSQL (Linux)
    if command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
        print_success "PostgreSQL service started"
    # Try to start PostgreSQL (macOS)
    elif command -v brew &> /dev/null; then
        brew services start postgresql
        print_success "PostgreSQL service started"
    else
        print_error "Could not start PostgreSQL service. Please start it manually."
        exit 1
    fi
fi

# Get database configuration
print_status "Setting up database configuration..."

# Default values
DEFAULT_DB_NAME="emirati_journey"
DEFAULT_DB_USER="emirati_user"
DEFAULT_DB_HOST="localhost"
DEFAULT_DB_PORT="5432"

# Prompt for database details
echo ""
echo "📋 Database Configuration"
echo "========================"

read -p "Database name [$DEFAULT_DB_NAME]: " DB_NAME
DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}

read -p "Database user [$DEFAULT_DB_USER]: " DB_USER
DB_USER=${DB_USER:-$DEFAULT_DB_USER}

read -p "Database host [$DEFAULT_DB_HOST]: " DB_HOST
DB_HOST=${DB_HOST:-$DEFAULT_DB_HOST}

read -p "Database port [$DEFAULT_DB_PORT]: " DB_PORT
DB_PORT=${DB_PORT:-$DEFAULT_DB_PORT}

# Generate a secure password
print_status "Generating secure password..."
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo ""
echo "📝 Database Configuration Summary"
echo "================================"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"
echo "Database Password: $DB_PASSWORD"
echo ""

read -p "Proceed with database creation? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    print_warning "Database creation cancelled"
    exit 0
fi

# Create database and user
print_status "Creating database and user..."

# Check if we can connect as postgres user
if sudo -u postgres psql -c "SELECT 1;" &>/dev/null; then
    POSTGRES_USER="postgres"
    SUDO_PREFIX="sudo -u postgres"
elif psql -U postgres -c "SELECT 1;" &>/dev/null; then
    POSTGRES_USER="postgres"
    SUDO_PREFIX=""
else
    print_error "Cannot connect to PostgreSQL as postgres user"
    print_error "Please ensure PostgreSQL is properly installed and configured"
    exit 1
fi

# Create database
print_status "Creating database '$DB_NAME'..."
$SUDO_PREFIX psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    print_warning "Database '$DB_NAME' may already exist"
}

# Create user
print_status "Creating user '$DB_USER'..."
$SUDO_PREFIX psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || {
    print_warning "User '$DB_USER' may already exist"
    print_status "Updating password for existing user..."
    $SUDO_PREFIX psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
}

# Grant privileges
print_status "Granting privileges..."
$SUDO_PREFIX psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
$SUDO_PREFIX psql -c "ALTER USER $DB_USER CREATEDB;"

print_success "Database and user created successfully"

# Test connection
print_status "Testing database connection..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &>/dev/null; then
    print_success "Database connection test successful"
else
    print_error "Database connection test failed"
    print_error "Please check your PostgreSQL configuration"
    exit 1
fi

# Create schema
print_status "Creating database schema..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

if [ -f "$SCRIPT_DIR/setup_database.sql" ]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/setup_database.sql"
    print_success "Database schema created successfully"
else
    print_warning "Database schema file not found. You'll need to run setup_database.sql manually"
fi

# Insert sample data
read -p "Insert sample data for demonstration? (y/N): " INSERT_SAMPLE
if [[ $INSERT_SAMPLE =~ ^[Yy]$ ]]; then
    if [ -f "$SCRIPT_DIR/sample_data.sql" ]; then
        print_status "Inserting sample data..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/sample_data.sql"
        print_success "Sample data inserted successfully"
    else
        print_warning "Sample data file not found"
    fi
fi

# Create .env file
print_status "Creating environment configuration file..."
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cat > "$PROJECT_ROOT/backend/.env" << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Application Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=$(openssl rand -base64 32)
JWT_SECRET_KEY=$(openssl rand -base64 32)

# API Configuration
API_HOST=0.0.0.0
API_PORT=5003

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379/0

# Email Configuration (update with your SMTP settings)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# File Upload Configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216

# Security Configuration
CORS_ORIGINS=http://localhost:8080,http://localhost:3000
RATE_LIMIT_ENABLED=True
RATE_LIMIT_DEFAULT=100 per hour

# UAE-specific Configuration
DEFAULT_TIMEZONE=Asia/Dubai
DEFAULT_CURRENCY=AED
DEFAULT_LANGUAGE=en

# AI Configuration (update with your API keys)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
EOF

print_success "Environment configuration file created at backend/.env"

# Create frontend .env file
cat > "$PROJECT_ROOT/frontend/.env" << EOF
# API Configuration
VITE_API_BASE_URL=http://localhost:5003

# Application Configuration
VITE_APP_NAME=Emirati Journey Platform
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Comprehensive platform for Emirati career development

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_CHAT=true

# UAE-specific Configuration
VITE_DEFAULT_EMIRATE=Dubai
VITE_SUPPORTED_LANGUAGES=en,ar
VITE_DEFAULT_CURRENCY=AED
EOF

print_success "Frontend environment configuration file created at frontend/.env"

# Create database backup script
cat > "$PROJECT_ROOT/backup_database.sh" << EOF
#!/bin/bash
# Database backup script for Emirati Journey Platform

BACKUP_DIR="backups"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\$BACKUP_DIR/emirati_journey_backup_\$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p \$BACKUP_DIR

# Create backup
echo "Creating database backup..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > \$BACKUP_FILE

if [ \$? -eq 0 ]; then
    echo "✅ Backup created successfully: \$BACKUP_FILE"
    
    # Compress backup
    gzip \$BACKUP_FILE
    echo "✅ Backup compressed: \$BACKUP_FILE.gz"
    
    # Remove backups older than 30 days
    find \$BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
    echo "✅ Old backups cleaned up"
else
    echo "❌ Backup failed"
    exit 1
fi
EOF

chmod +x "$PROJECT_ROOT/backup_database.sh"
print_success "Database backup script created"

# Final summary
echo ""
echo "🎉 Database Setup Complete!"
echo "==========================="
echo ""
echo "📋 Summary:"
echo "  ✅ Database '$DB_NAME' created"
echo "  ✅ User '$DB_USER' created with secure password"
echo "  ✅ Database schema installed"
if [[ $INSERT_SAMPLE =~ ^[Yy]$ ]]; then
echo "  ✅ Sample data inserted"
fi
echo "  ✅ Environment files created"
echo "  ✅ Backup script created"
echo ""
echo "🔗 Connection Details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "📁 Configuration Files:"
echo "  Backend: backend/.env"
echo "  Frontend: frontend/.env"
echo ""
echo "🔧 Next Steps:"
echo "  1. Review and update the .env files with your specific settings"
echo "  2. Update email configuration in backend/.env"
echo "  3. Add your AI API keys in backend/.env"
echo "  4. Run the platform: ./start_platform.sh"
echo ""
echo "💾 Backup:"
echo "  Run ./backup_database.sh to create database backups"
echo ""

print_success "Database setup completed successfully!"

# Save connection details to a file for reference
cat > "$PROJECT_ROOT/database_connection_info.txt" << EOF
Emirati Journey Platform - Database Connection Information
=========================================================

Host: $DB_HOST
Port: $DB_PORT
Database: $DB_NAME
User: $DB_USER
Password: $DB_PASSWORD

Connection String: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME

Created: $(date)

IMPORTANT: Keep this information secure and do not share it publicly.
EOF

print_status "Connection details saved to database_connection_info.txt"

