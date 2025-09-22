#!/bin/bash

# PostgreSQL Setup Script for Emirati Journey Platform
# This script installs and configures PostgreSQL for enhanced database performance

echo "🐘 Setting up PostgreSQL for Enhanced Database Performance"
echo "========================================================"

# Configuration variables
DB_NAME="emirati_journey"
DB_USER="emirati_user"
DB_PASSWORD="emirati_secure_$(openssl rand -hex 8)"

# Detect operating system
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux (Ubuntu/Debian)
    echo "📦 Installing PostgreSQL on Linux..."
    
    # Update package list
    sudo apt update
    
    # Install PostgreSQL and contrib package
    sudo apt install -y postgresql postgresql-contrib python3-psycopg2
    
    # Start and enable PostgreSQL service
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Check PostgreSQL status
    if sudo systemctl is-active --quiet postgresql; then
        echo "✅ PostgreSQL installed and running successfully"
    else
        echo "❌ PostgreSQL installation failed"
        exit 1
    fi
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📦 Installing PostgreSQL on macOS..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    # Install PostgreSQL
    brew install postgresql
    
    # Start PostgreSQL service
    brew services start postgresql
    
    # Install Python PostgreSQL adapter
    pip3 install psycopg2-binary
    
    echo "✅ PostgreSQL installed and running successfully"
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "Please install PostgreSQL manually or use Docker:"
    echo "   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password --name postgres postgres:13"
    exit 1
fi

# Create database and user
echo ""
echo "🗄️ Creating database and user..."

# Create SQL commands
SQL_COMMANDS="
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
"

# Execute SQL commands
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - use sudo to switch to postgres user
    echo "$SQL_COMMANDS" | sudo -u postgres psql
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - direct psql access
    echo "$SQL_COMMANDS" | psql postgres
fi

# Test database connection
echo ""
echo "🔍 Testing database connection..."
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME"

if python3 -c "
import psycopg2
try:
    conn = psycopg2.connect('$DATABASE_URL')
    conn.close()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"; then
    echo "✅ PostgreSQL database is ready"
else
    echo "❌ Database connection test failed"
    exit 1
fi

# Display database information
echo ""
echo "📊 Database Information:"
echo "• Database Name: $DB_NAME"
echo "• Username: $DB_USER"
echo "• Password: $DB_PASSWORD"
echo "• Connection URL: $DATABASE_URL"

# Create database configuration for the application
echo ""
echo "⚙️ Configuring PostgreSQL for Emirati Journey Platform..."

# Add PostgreSQL configuration to backend .env file
ENV_FILE="emirati_journey_api/.env"
if [ -f "$ENV_FILE" ]; then
    # Backup existing .env file
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Remove existing DATABASE_URL if present
    sed -i '/^DATABASE_URL=/d' "$ENV_FILE"
    sed -i '/^USE_POSTGRESQL=/d' "$ENV_FILE"
    
    # Add PostgreSQL configuration
    echo "" >> "$ENV_FILE"
    echo "# PostgreSQL Configuration (Added by setup script)" >> "$ENV_FILE"
    echo "DATABASE_URL=$DATABASE_URL" >> "$ENV_FILE"
    echo "USE_POSTGRESQL=true" >> "$ENV_FILE"
    echo "DB_POOL_SIZE=20" >> "$ENV_FILE"
    echo "DB_MAX_OVERFLOW=30" >> "$ENV_FILE"
    
    echo "✅ PostgreSQL configuration added to $ENV_FILE"
    echo "📝 Backup of original .env file created"
else
    echo "⚠️ Backend .env file not found. Please create it manually with:"
    echo "   DATABASE_URL=$DATABASE_URL"
    echo "   USE_POSTGRESQL=true"
fi

# Save credentials to a secure file
CREDS_FILE="postgresql_credentials.txt"
cat > "$CREDS_FILE" << EOF
PostgreSQL Database Credentials for Emirati Journey Platform
===========================================================

Database Name: $DB_NAME
Username: $DB_USER
Password: $DB_PASSWORD
Host: localhost
Port: 5432

Connection URL: $DATABASE_URL

Created on: $(date)

IMPORTANT: Keep this file secure and do not commit it to version control!
EOF

echo "🔐 Database credentials saved to: $CREDS_FILE"

# Performance optimization
echo ""
echo "🚀 Applying performance optimizations..."

# Create performance tuning SQL
PERF_SQL="
-- Performance optimizations for analytics workload
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
"

# Apply performance settings
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "$PERF_SQL" | sudo -u postgres psql
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "$PERF_SQL" | psql postgres
fi

echo "✅ Performance optimizations applied"

# Create analytics tables
echo ""
echo "📊 Creating analytics tables..."

ANALYTICS_SQL="
-- Connect to the application database
\c $DB_NAME

-- Create enhanced analytics tables
CREATE TABLE IF NOT EXISTS enhanced_analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    user_id UUID,
    timestamp TIMESTAMPTZ NOT NULL,
    data JSONB,
    uae_metrics JSONB,
    performance_metrics JSONB,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS real_time_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    aggregation_type VARCHAR(20) NOT NULL,
    time_window VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    dimensions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_journey_analytics (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    journey_stage VARCHAR(50) NOT NULL,
    entry_timestamp TIMESTAMPTZ NOT NULL,
    exit_timestamp TIMESTAMPTZ,
    duration_seconds INTEGER,
    actions_count INTEGER DEFAULT 0,
    conversion_achieved BOOLEAN DEFAULT FALSE,
    drop_off_point VARCHAR(100),
    journey_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uae_analytics_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_category VARCHAR(50) NOT NULL,
    emirate VARCHAR(50),
    sector VARCHAR(50),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    benchmark_value DECIMAL(15,4),
    performance_indicator VARCHAR(20),
    timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_events_timestamp ON enhanced_analytics_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_enhanced_events_user_id ON enhanced_analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_events_type_category ON enhanced_analytics_events (event_type, category);
CREATE INDEX IF NOT EXISTS idx_enhanced_events_uae_metrics ON enhanced_analytics_events USING GIN (uae_metrics);

CREATE INDEX IF NOT EXISTS idx_real_time_metrics_name_time ON real_time_metrics (metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_real_time_metrics_category ON real_time_metrics (metric_category);

CREATE INDEX IF NOT EXISTS idx_user_journey_user_stage ON user_journey_analytics (user_id, journey_stage);
CREATE INDEX IF NOT EXISTS idx_user_journey_timestamp ON user_journey_analytics (entry_timestamp);

CREATE INDEX IF NOT EXISTS idx_uae_metrics_category_emirate ON uae_analytics_metrics (metric_category, emirate);
CREATE INDEX IF NOT EXISTS idx_uae_metrics_timestamp ON uae_analytics_metrics (timestamp);

-- Grant permissions to application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
"

# Create analytics tables
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "$ANALYTICS_SQL" | sudo -u postgres psql
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "$ANALYTICS_SQL" | psql postgres
fi

echo "✅ Analytics tables created successfully"

# Security recommendations
echo ""
echo "🔒 Security Recommendations:"
echo "1. Change the default PostgreSQL password"
echo "2. Configure pg_hba.conf for proper authentication"
echo "3. Enable SSL connections for production"
echo "4. Regular security updates"

# Backup recommendations
echo ""
echo "💾 Backup Recommendations:"
echo "• Create regular backups: pg_dump $DB_NAME > backup.sql"
echo "• Set up automated backup scripts"
echo "• Test backup restoration procedures"

# Monitoring commands
echo ""
echo "📊 Useful PostgreSQL Monitoring Commands:"
echo "• Check PostgreSQL status: sudo systemctl status postgresql"
echo "• Connect to database: psql $DATABASE_URL"
echo "• View database size: psql -c \"SELECT pg_size_pretty(pg_database_size('$DB_NAME'));\""
echo "• Monitor active connections: psql -c \"SELECT count(*) FROM pg_stat_activity;\""

# Restart instructions
echo ""
echo "🔄 To restart the backend with PostgreSQL support:"
echo "1. Stop the current backend process"
echo "2. Navigate to emirati_journey_api directory"
echo "3. Install psycopg2: pip install psycopg2-binary"
echo "4. Run: PORT=5003 python app.py"
echo "5. The backend will automatically detect and use PostgreSQL"

echo ""
echo "✅ PostgreSQL setup completed successfully!"
echo "🎉 Your Emirati Journey Platform now has enhanced database performance!"
echo ""
echo "⚠️ IMPORTANT: Save the credentials file ($CREDS_FILE) in a secure location!"

