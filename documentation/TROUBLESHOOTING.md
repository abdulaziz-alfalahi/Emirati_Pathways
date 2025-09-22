# 🔧 Emirati Journey Platform - Troubleshooting Guide

## 🎯 Quick Diagnosis

### Platform Not Starting?
1. **Check Prerequisites**: Python 3.8+, Node.js 16+, PostgreSQL 12+
2. **Check Ports**: Ensure ports 5003 and 8080 are available
3. **Check Database**: Verify PostgreSQL is running and accessible
4. **Check Environment**: Verify .env files are configured correctly

### Can't Access the Platform?
1. **Backend**: Check http://localhost:5003/health
2. **Frontend**: Check http://localhost:8080
3. **Firewall**: Ensure ports are not blocked
4. **Browser**: Try different browser or incognito mode

## 🚨 Common Issues and Solutions

### 1. Installation Issues

#### Python Virtual Environment Creation Fails
```bash
# Error: python3: command not found
# Solution: Install Python 3
sudo apt install python3 python3-pip python3-venv

# Error: venv module not found
# Solution: Install python3-venv
sudo apt install python3-venv

# Error: Permission denied
# Solution: Check directory permissions
chmod 755 $(pwd)
```

#### Node.js Installation Issues
```bash
# Error: node: command not found
# Solution: Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Error: npm WARN deprecated
# Solution: Update npm
npm install -g npm@latest

# Error: EACCES permission denied
# Solution: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 2. Database Issues

#### PostgreSQL Connection Failed
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if stopped
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check PostgreSQL version
psql --version

# Test connection
sudo -u postgres psql -c "SELECT version();"
```

#### Database Does Not Exist
```bash
# Connect as postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE emirati_journey;
CREATE USER emirati_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE emirati_journey TO emirati_user;
\q

# Test connection with new user
psql -h localhost -U emirati_user -d emirati_journey
```

#### Database Migration Errors
```bash
# Check database connection in .env file
cat backend/.env | grep DATABASE

# Run database setup manually
cd backend
source venv/bin/activate
python -c "from app import db; db.create_all()"

# Check tables created
psql -h localhost -U emirati_user -d emirati_journey -c "\dt"
```

### 3. Backend Issues

#### Backend Won't Start
```bash
# Check Python virtual environment
cd backend
source venv/bin/activate
which python

# Check dependencies
pip list | grep -E "(flask|sqlalchemy|jwt)"

# Check for missing dependencies
pip install -r requirements.txt

# Check for syntax errors
python -m py_compile app.py
```

#### Port 5003 Already in Use
```bash
# Find process using port 5003
lsof -i :5003
netstat -tlnp | grep :5003

# Kill process using port
kill -9 <PID>

# Or use different port
export API_PORT=5004
python app.py
```

#### Import Errors
```bash
# Error: ModuleNotFoundError
# Solution: Ensure virtual environment is activated
source venv/bin/activate

# Error: No module named 'flask'
# Solution: Install missing packages
pip install flask flask-sqlalchemy flask-jwt-extended

# Error: Cannot import name 'app'
# Solution: Check PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

#### Database Connection Errors
```bash
# Error: FATAL: password authentication failed
# Solution: Check credentials in .env
nano .env

# Error: FATAL: database "emirati_journey" does not exist
# Solution: Create database
sudo -u postgres createdb emirati_journey

# Error: could not connect to server
# Solution: Start PostgreSQL
sudo systemctl start postgresql
```

### 4. Frontend Issues

#### Frontend Won't Start
```bash
# Check Node.js and npm versions
node --version
npm --version

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -i :8080
```

#### Build Errors
```bash
# Error: Module not found
# Solution: Install missing dependencies
npm install

# Error: TypeScript errors
# Solution: Check TypeScript configuration
npx tsc --noEmit

# Error: Vite build failed
# Solution: Check Vite configuration
npm run build -- --debug
```

#### API Connection Issues
```bash
# Check API URL in .env
cat .env | grep VITE_API_BASE_URL

# Test API connection
curl http://localhost:5003/health

# Check CORS configuration
# Ensure backend allows frontend origin
```

### 5. Authentication Issues

#### JWT Token Errors
```bash
# Error: JWT decode error
# Solution: Check JWT secret key in backend .env
grep JWT_SECRET_KEY backend/.env

# Error: Token expired
# Solution: Clear browser storage and login again
# Or increase token expiration time in backend
```

#### Login/Registration Fails
```bash
# Check user table exists
psql -h localhost -U emirati_user -d emirati_journey -c "\d users"

# Check password hashing
python -c "from werkzeug.security import check_password_hash, generate_password_hash; print(generate_password_hash('test123'))"

# Check email validation
# Ensure email format is correct and domain exists
```

### 6. File Upload Issues

#### Upload Directory Permissions
```bash
# Create upload directory
mkdir -p backend/uploads

# Set correct permissions
chmod 755 backend/uploads
chown $(whoami):$(whoami) backend/uploads

# Check disk space
df -h
```

#### File Size Limits
```bash
# Check max file size in backend configuration
grep MAX_CONTENT_LENGTH backend/.env

# Increase if needed (16MB = 16777216 bytes)
echo "MAX_CONTENT_LENGTH=16777216" >> backend/.env
```

### 7. Performance Issues

#### Slow Database Queries
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Add indexes for common queries
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_applications_status ON applications(status);
```

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart services if needed
sudo systemctl restart postgresql
```

#### Slow Frontend Loading
```bash
# Build production version
npm run build

# Check bundle size
npm run analyze

# Enable gzip compression in Nginx
# Add to nginx config:
# gzip on;
# gzip_types text/css application/javascript application/json;
```

### 8. Network Issues

#### CORS Errors
```bash
# Check CORS configuration in backend
grep CORS_ORIGINS backend/.env

# Add frontend URL to CORS origins
echo "CORS_ORIGINS=http://localhost:8080,http://localhost:3000" >> backend/.env
```

#### Firewall Blocking Connections
```bash
# Check firewall status
sudo ufw status

# Allow necessary ports
sudo ufw allow 5003
sudo ufw allow 8080

# For production, allow only 80 and 443
sudo ufw allow 80
sudo ufw allow 443
```

### 9. SSL/HTTPS Issues

#### SSL Certificate Errors
```bash
# Check certificate validity
openssl x509 -in /path/to/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew

# Test SSL configuration
curl -I https://your-domain.com
```

### 10. Production Deployment Issues

#### Nginx Configuration Errors
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### PM2 Process Management
```bash
# Check PM2 processes
pm2 list

# Restart all processes
pm2 restart all

# Check PM2 logs
pm2 logs

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🔍 Diagnostic Commands

### System Health Check
```bash
#!/bin/bash
echo "=== System Health Check ==="

# Check system resources
echo "Memory usage:"
free -h

echo "Disk usage:"
df -h

echo "CPU usage:"
top -bn1 | grep "Cpu(s)"

# Check services
echo "PostgreSQL status:"
sudo systemctl is-active postgresql

echo "Redis status (if installed):"
sudo systemctl is-active redis-server

echo "Nginx status (if installed):"
sudo systemctl is-active nginx

# Check ports
echo "Port 5003 (Backend):"
netstat -tlnp | grep :5003

echo "Port 8080 (Frontend):"
netstat -tlnp | grep :8080

# Check database connection
echo "Database connection:"
psql -h localhost -U emirati_user -d emirati_journey -c "SELECT 1;" 2>/dev/null && echo "OK" || echo "FAILED"

# Check API health
echo "API health:"
curl -s http://localhost:5003/health | grep -q "healthy" && echo "OK" || echo "FAILED"
```

### Log Analysis
```bash
# Backend logs
tail -f backend/logs/app.log

# System logs
sudo journalctl -u postgresql -f
sudo journalctl -u nginx -f

# Check for errors in logs
grep -i error backend/logs/app.log
grep -i error /var/log/nginx/error.log
```

### Performance Monitoring
```bash
# Monitor system resources
htop

# Monitor network connections
netstat -tuln

# Monitor database connections
psql -h localhost -U emirati_user -d emirati_journey -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor disk I/O
iostat -x 1
```

## 🆘 Getting Help

### Before Asking for Help
1. **Check this troubleshooting guide**
2. **Check the deployment guide**
3. **Search for similar issues online**
4. **Gather relevant information**:
   - Error messages (full text)
   - System information (OS, versions)
   - Steps to reproduce the issue
   - Log files

### Information to Provide
```bash
# System information
uname -a
python3 --version
node --version
npm --version
psql --version

# Error logs
tail -n 50 backend/logs/app.log
sudo journalctl -u postgresql --since "1 hour ago"

# Configuration
cat backend/.env | grep -v PASSWORD | grep -v SECRET
cat frontend/.env
```

### Contact Information
- **Documentation**: Check the main README.md
- **Issue Tracker**: [Your issue tracker URL]
- **Support Email**: [Your support email]
- **Community Forum**: [Your forum URL]

## 📚 Additional Resources

### Official Documentation
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://reactjs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Useful Tools
- **Database GUI**: pgAdmin, DBeaver
- **API Testing**: Postman, Insomnia
- **Log Monitoring**: Grafana, ELK Stack
- **Performance Monitoring**: New Relic, DataDog

### Community Resources
- **Stack Overflow**: Search for specific error messages
- **GitHub Issues**: Check similar projects
- **Reddit**: r/flask, r/reactjs, r/PostgreSQL

---

**Remember**: Most issues can be resolved by carefully reading error messages and checking configuration files. Take your time and follow the steps systematically.

**Last Updated**: September 15, 2024
**Version**: 1.0.0

