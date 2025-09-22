# Setup Scripts for Enhanced Analytics

This directory contains setup scripts to configure optional services for the Emirati Journey Platform's enhanced analytics features.

## Scripts Overview

### 1. setup_redis.sh
**Purpose**: Installs and configures Redis for improved caching performance.

**What it does**:
- Installs Redis on Linux (Ubuntu/Debian) or macOS
- Configures Redis to start automatically
- Tests the Redis connection
- Updates the backend `.env` file with Redis configuration
- Provides monitoring and security recommendations

**Usage**:
```bash
cd emirati_journey_api/scripts
./setup_redis.sh
```

**Benefits**:
- Faster API response times through caching
- Improved real-time metrics performance
- Better job matching result caching
- Enhanced user session management

### 2. setup_postgresql.sh
**Purpose**: Installs and configures PostgreSQL for enhanced database performance.

**What it does**:
- Installs PostgreSQL on Linux (Ubuntu/Debian) or macOS
- Creates a dedicated database and user for the application
- Applies performance optimizations for analytics workloads
- Creates analytics tables with proper indexes
- Updates the backend `.env` file with PostgreSQL configuration
- Generates secure credentials

**Usage**:
```bash
cd emirati_journey_api/scripts
./setup_postgresql.sh
```

**Benefits**:
- Better performance for large datasets
- Robust data persistence
- Advanced analytics capabilities
- Scalable database architecture

## Prerequisites

### For Redis Setup
- Linux (Ubuntu/Debian) or macOS
- sudo privileges (for Linux)
- Homebrew (for macOS)

### For PostgreSQL Setup
- Linux (Ubuntu/Debian) or macOS
- sudo privileges (for Linux)
- Homebrew (for macOS)
- Python 3 with pip

## Installation Order

1. **Start with the basic setup** (no scripts needed):
   ```bash
   cd emirati_journey_api
   pip install -r requirements.txt
   PORT=5003 python app.py
   ```

2. **Add Redis for improved performance** (optional):
   ```bash
   cd scripts
   ./setup_redis.sh
   ```

3. **Add PostgreSQL for production database** (optional):
   ```bash
   cd scripts
   ./setup_postgresql.sh
   ```

4. **Restart the backend** to use the new services:
   ```bash
   cd ..
   PORT=5003 python app.py
   ```

## Configuration Files

After running the scripts, your `.env` file will be updated with the appropriate configuration:

### With Redis only:
```bash
REDIS_URL=redis://localhost:6379
USE_REDIS=true
```

### With PostgreSQL only:
```bash
DATABASE_URL=postgresql://emirati_user:password@localhost/emirati_journey
USE_POSTGRESQL=true
```

### With both Redis and PostgreSQL:
```bash
DATABASE_URL=postgresql://emirati_user:password@localhost/emirati_journey
USE_POSTGRESQL=true
REDIS_URL=redis://localhost:6379
USE_REDIS=true
```

## Troubleshooting

### Redis Issues
```bash
# Check if Redis is running
redis-cli ping

# Start Redis service (Linux)
sudo systemctl start redis-server

# Start Redis service (macOS)
brew services start redis
```

### PostgreSQL Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Connect to database
psql postgresql://emirati_user:password@localhost/emirati_journey
```

### Backend Issues
```bash
# Check environment variables
env | grep -E "(REDIS|DATABASE|POSTGRESQL)"

# Check backend logs
tail -f /var/log/emirati-journey/app.log
```

## Security Notes

1. **Database Credentials**: The PostgreSQL setup script generates secure credentials and saves them to `postgresql_credentials.txt`. Keep this file secure and do not commit it to version control.

2. **Redis Security**: Consider setting a Redis password for production:
   ```bash
   redis-cli CONFIG SET requirepass 'your-secure-password'
   ```

3. **Environment Variables**: Never commit `.env` files with real credentials to version control.

## Performance Benefits

### Without Optional Services (Basic Setup)
- ✅ Works out of the box
- ✅ No external dependencies
- ⚠️ Limited to in-memory storage
- ⚠️ Data lost on restart

### With Redis
- ✅ Faster API responses (caching)
- ✅ Persistent session data
- ✅ Improved real-time metrics
- ✅ Better job matching performance

### With PostgreSQL
- ✅ Persistent data storage
- ✅ Better performance for large datasets
- ✅ Advanced analytics capabilities
- ✅ Production-ready database

### With Both Redis and PostgreSQL
- ✅ Maximum performance
- ✅ Production-ready setup
- ✅ Scalable architecture
- ✅ Full analytics capabilities

## Support

If you encounter issues with these scripts:

1. Check the script output for error messages
2. Verify prerequisites are installed
3. Check system logs for service-specific errors
4. Refer to the main documentation in `step7_production_setup_guide.md`

For additional help, refer to the comprehensive setup guide in the project root directory.

