# 🚀 Emirati Journey Platform - Quick Start Guide

## ⚡ Get Started in 5 Minutes

This guide will get your Emirati Journey Platform up and running quickly on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have:
- **Python 3.8+** installed
- **Node.js 16+** installed  
- **PostgreSQL 12+** installed
- **Git** installed

## 🎯 Option 1: Automated Setup (Recommended)

### Step 1: Run the Installer
```bash
# Navigate to the deployment package
cd emirati-journey-deployment-package

# Run the automated installer
./deployment/install.sh
```

### Step 2: Setup Database
```bash
# Run the database setup script
./database/create_database.sh
```

### Step 3: Start the Platform
```bash
# Start both backend and frontend
./start_platform.sh
```

### Step 4: Access the Platform
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5003
- **Admin Dashboard**: http://localhost:8080/admin

## 🔧 Option 2: Manual Setup

### Step 1: Backend Setup
```bash
cd backend/

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database (follow prompts)
python setup_database.py

# Start backend
python app.py
```

### Step 2: Frontend Setup (New Terminal)
```bash
cd frontend/

# Install dependencies
npm install

# Start frontend
npm run dev
```

## 🎪 Demo Accounts

### Admin Account
- **Email**: admin@emiratijourney.ae
- **Password**: Password123!

### Recruiter Account
- **Email**: hr.manager@enoc.com
- **Password**: Password123!

### Candidate Account
- **Email**: ahmed.almansouri@gmail.com
- **Password**: Password123!

## 🎯 Key Features to Test

### 1. User Registration & Login
- Visit http://localhost:8080
- Click "Sign Up" to create a new account
- Use UAE-specific fields (Emirates, phone number)
- Test different user roles

### 2. Job Management
- Login as recruiter/employer
- Navigate to Jobs section
- Create a new job posting
- Test UAE-specific features (Emiratization requirements)

### 3. Application Process
- Login as candidate
- Browse available jobs
- Apply for positions
- Track application status

### 4. Messaging System
- Test communication between candidates and recruiters
- Send messages from application pages
- Check real-time message delivery

### 5. Admin Dashboard
- Login as admin
- View platform analytics
- Monitor UAE Vision 2071 compliance
- Manage users and content

## 🔍 Health Checks

### Backend Health
```bash
curl http://localhost:5003/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "features": {
    "authentication": true,
    "job_management": true,
    "messaging": true,
    "analytics": true
  }
}
```

### Frontend Health
- Visit http://localhost:8080
- Should load the platform homepage
- Check browser console for any errors

## 🚨 Common Issues

### Port Already in Use
```bash
# Find and kill process using port 5003
lsof -i :5003
kill -9 <PID>

# Or use different port
export API_PORT=5004
python app.py
```

### Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL if stopped
sudo systemctl start postgresql

# Recreate database
./database/create_database.sh
```

### Node.js Module Errors
```bash
# Clear cache and reinstall
cd frontend/
rm -rf node_modules package-lock.json
npm install
```

### Python Virtual Environment Issues
```bash
# Recreate virtual environment
cd backend/
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 📊 Sample Data

The platform comes with sample data including:
- **8 UAE Companies** (ENOC, DIB, Etisalat, DHA, etc.)
- **8 Candidate Profiles** (UAE nationals with various skills)
- **5 Recruiter/Employer Accounts**
- **8 Active Job Postings** (various industries and levels)
- **7 Job Applications** (different statuses)
- **Sample Messages** and conversations

## 🎯 Showcase Demonstration

### 25-Minute Demo Flow
1. **Platform Overview** (5 min) - UAE Vision 2071 alignment
2. **User Registration** (3 min) - UAE-specific registration
3. **Job Creation** (5 min) - Recruiter posting with Emiratization
4. **Application Process** (5 min) - Candidate applying and tracking
5. **Messaging** (3 min) - Real-time communication
6. **Admin Dashboard** (4 min) - Platform oversight and analytics

### Key Metrics to Highlight
- ✅ **15.5% - 45.2%** Emiratization rates across companies
- ✅ **8 Active Jobs** across major UAE industries
- ✅ **85-95%** Skills matching accuracy
- ✅ **Real-time** messaging and notifications
- ✅ **100%** UAE Vision 2071 compliance

## 🔗 Important URLs

### Development URLs
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5003
- **API Documentation**: http://localhost:5003/docs (if available)
- **Health Check**: http://localhost:5003/health

### Key Pages
- **Homepage**: http://localhost:8080
- **Login**: http://localhost:8080/login
- **Register**: http://localhost:8080/register
- **Jobs**: http://localhost:8080/jobs
- **Applications**: http://localhost:8080/applications
- **Messages**: http://localhost:8080/messages
- **Admin**: http://localhost:8080/admin

## 📞 Support

### Documentation
- **Full Deployment Guide**: `documentation/DEPLOYMENT_GUIDE.md`
- **Troubleshooting**: `documentation/TROUBLESHOOTING.md`
- **API Documentation**: Check backend routes files

### Quick Commands
```bash
# View logs
tail -f backend/logs/app.log

# Check running processes
ps aux | grep python
ps aux | grep node

# Database backup
./backup_database.sh

# Restart services
./start_platform.sh
```

## 🎉 Success!

If you can access http://localhost:8080 and see the Emirati Journey Platform homepage, you're ready to go!

**Next Steps:**
1. Explore the platform features
2. Test the demonstration flow
3. Customize for your specific needs
4. Prepare for your showcase presentation

---

**Need Help?** Check the troubleshooting guide or contact support.

**Ready for Production?** See the full deployment guide for production setup instructions.

