# 📚 Emirati Journey Platform - Complete Deployment Guide

## 🎯 Overview
This guide provides step-by-step instructions to deploy the Emirati Journey Platform on your development or production environment.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Manual Installation](#manual-installation)
4. [Database Configuration](#database-configuration)
5. [Environment Configuration](#environment-configuration)
6. [Running the Platform](#running-the-platform)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- **Operating System**: Linux, macOS, or Windows
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 2GB free space
- **Network**: Internet connection for initial setup

### Software Requirements
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **PostgreSQL 12+** database server
- **Redis** (optional, for caching and performance)
- **Git** (for version control)

### Installation Commands

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3 python3-pip python3-venv -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis (optional)
sudo apt install redis-server -y

# Install Git
sudo apt install git -y
```

#### macOS (using Homebrew)
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install requirements
brew install python@3.11 node postgresql redis git
```

#### Windows
1. Download and install Python from https://python.org
2. Download and install Node.js from https://nodejs.org
3. Download and install PostgreSQL from https://postgresql.org
4. Install Git from https://git-scm.com

## 🚀 Quick Start

### Option 1: Automated Installation (Recommended)
```bash
# Navigate to the deployment package
cd emirati-journey-deployment-package

# Run the automated installer
./deployment/install.sh

# Follow the prompts and configure your database
# Then start the platform
./start_platform.sh
```

### Option 2: Docker Deployment (Coming Soon)
```bash
# Using Docker Compose
docker-compose up -d
```

## 🔧 Manual Installation

### Step 1: Backend Setup

#### 1.1 Navigate to Backend Directory
```bash
cd emirati-journey-deployment-package/backend
```

#### 1.2 Create Virtual Environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

#### 1.3 Install Dependencies
```bash
# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

### Step 2: Frontend Setup

#### 2.1 Navigate to Frontend Directory
```bash
cd ../frontend
```

#### 2.2 Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Optional: Install globally for better performance
npm install -g @vitejs/plugin-react
```

### Step 3: Database Setup

#### 3.1 Create PostgreSQL Database
```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE emirati_journey;
CREATE USER emirati_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE emirati_journey TO emirati_user;
\q
```

#### 3.2 Configure Database Connection
```bash
# Copy environment template
cp backend/.env.template backend/.env

# Edit the .env file with your database credentials
nano backend/.env
```

#### 3.3 Initialize Database
```bash
cd backend
source venv/bin/activate
python setup_database.py
```

## ⚙️ Environment Configuration

### Backend Configuration (.env)
```bash
# Database Configuration
DATABASE_URL=postgresql://emirati_user:your_secure_password@localhost:5432/emirati_journey
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emirati_journey
DB_USER=emirati_user
DB_PASSWORD=your_secure_password

# Application Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your_super_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here

# API Configuration
API_HOST=0.0.0.0
API_PORT=5003

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379/0

# Email Configuration (for notifications)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# File Upload Configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216  # 16MB

# Security Configuration
CORS_ORIGINS=http://localhost:8080,http://localhost:3000
RATE_LIMIT_ENABLED=True
RATE_LIMIT_DEFAULT=100 per hour

# UAE-specific Configuration
DEFAULT_TIMEZONE=Asia/Dubai
DEFAULT_CURRENCY=AED
DEFAULT_LANGUAGE=en

# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend Configuration (.env)
```bash
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

# External Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_ANALYTICS_ID=your_analytics_id
```

## 🏃‍♂️ Running the Platform

### Development Mode

#### Start Backend
```bash
cd backend
source venv/bin/activate
python app.py
```
Backend will be available at: http://localhost:5003

#### Start Frontend (in a new terminal)
```bash
cd frontend
npm run dev
```
Frontend will be available at: http://localhost:8080

#### Start Both (using provided script)
```bash
./start_platform.sh
```

### Production Mode

#### Backend Production
```bash
cd backend
source venv/bin/activate
gunicorn --bind 0.0.0.0:5003 --workers 4 app:app
```

#### Frontend Production
```bash
cd frontend
npm run build
npm run preview
```

## 🌐 Production Deployment

### Using Nginx (Recommended)

#### 1. Install Nginx
```bash
sudo apt install nginx -y
```

#### 2. Configure Nginx
```nginx
# /etc/nginx/sites-available/emirati-journey
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for real-time features
    location /socket.io/ {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/emirati-journey /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Using PM2 for Process Management

#### 1. Install PM2
```bash
npm install -g pm2
```

#### 2. Create PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'emirati-journey-backend',
      script: 'app.py',
      cwd: './backend',
      interpreter: './venv/bin/python',
      env: {
        FLASK_ENV: 'production'
      },
      instances: 4,
      exec_mode: 'cluster'
    },
    {
      name: 'emirati-journey-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

#### 3. Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### SSL Configuration (Let's Encrypt)

#### 1. Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### 2. Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

## 🔍 Health Checks

### Backend Health Check
```bash
curl http://localhost:5003/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected",
  "features": {
    "authentication": true,
    "job_management": true,
    "messaging": true,
    "analytics": true
  }
}
```

### Frontend Health Check
```bash
curl http://localhost:8080
```

Should return the main HTML page.

## 📊 Monitoring and Logging

### Application Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend logs (in browser console)
# Check browser developer tools
```

### System Monitoring
```bash
# Check running processes
ps aux | grep python
ps aux | grep node

# Check port usage
netstat -tlnp | grep :5003
netstat -tlnp | grep :8080

# Check system resources
htop
df -h
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check database exists
sudo -u postgres psql -l | grep emirati_journey
```

#### 2. Port Already in Use
```bash
# Find process using port
lsof -i :5003
lsof -i :8080

# Kill process
kill -9 <PID>
```

#### 3. Permission Errors
```bash
# Fix file permissions
chmod +x start_platform.sh
chmod +x deployment/install.sh

# Fix directory permissions
chmod -R 755 backend/
chmod -R 755 frontend/
```

#### 4. Node.js Module Errors
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf frontend/node_modules
cd frontend && npm install
```

#### 5. Python Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf backend/venv
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

#### 2. Redis Caching
```bash
# Install and configure Redis
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### 3. Frontend Optimization
```bash
# Build optimized production version
cd frontend
npm run build

# Analyze bundle size
npm run analyze
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique passwords
- Rotate API keys regularly

### 2. Database Security
```sql
-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
```

### 3. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 4. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Python packages
pip list --outdated
pip install --upgrade package_name

# Update Node.js packages
npm outdated
npm update
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancers (Nginx, HAProxy)
- Deploy multiple backend instances
- Use Redis for session storage
- Implement database read replicas

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries
- Use CDN for static assets
- Implement caching strategies

## 🆘 Support and Maintenance

### Regular Maintenance Tasks
1. **Daily**: Check logs and system health
2. **Weekly**: Update dependencies and security patches
3. **Monthly**: Database maintenance and optimization
4. **Quarterly**: Security audit and performance review

### Backup Strategy
```bash
# Database backup
pg_dump emirati_journey > backup_$(date +%Y%m%d).sql

# File backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/

# Automated backup script
# Add to crontab: 0 2 * * * /path/to/backup_script.sh
```

### Contact Information
- **Technical Support**: [Your support email]
- **Documentation**: [Your documentation URL]
- **Issue Tracking**: [Your issue tracker URL]

---

**Last Updated**: September 15, 2024
**Version**: 1.0.0
**Status**: Production Ready ✅

