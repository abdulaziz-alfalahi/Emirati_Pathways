#!/bin/bash

# 🚀 Emirati Journey Platform - Automated Installation Script
# This script sets up the complete platform on your system

set -e  # Exit on any error

echo "🚀 Starting Emirati Journey Platform Installation..."
echo "=================================================="

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_status "Project root: $PROJECT_ROOT"

# Step 1: Check Prerequisites
print_status "Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
print_success "Python $PYTHON_VERSION found"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm $NPM_VERSION found"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL client not found. You may need to install PostgreSQL."
    print_warning "On Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    print_warning "On macOS: brew install postgresql"
    print_warning "On Windows: Download from https://www.postgresql.org/download/"
fi

# Step 2: Setup Backend
print_status "Setting up backend..."

cd "$PROJECT_ROOT/backend"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

print_success "Backend dependencies installed"

# Step 3: Setup Frontend
print_status "Setting up frontend..."

cd "$PROJECT_ROOT/frontend"

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

print_success "Frontend dependencies installed"

# Step 4: Environment Configuration
print_status "Setting up environment configuration..."

cd "$PROJECT_ROOT"

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    print_status "Creating backend environment file..."
    cp backend/.env.template backend/.env
    print_warning "Please edit backend/.env with your database credentials"
fi

if [ ! -f "frontend/.env" ]; then
    print_status "Creating frontend environment file..."
    cat > frontend/.env << EOF
VITE_API_BASE_URL=http://localhost:5003
VITE_APP_NAME=Emirati Journey Platform
VITE_APP_VERSION=1.0.0
EOF
fi

# Step 5: Database Setup
print_status "Setting up database..."

cd "$PROJECT_ROOT/backend"

# Check if database configuration exists
if [ -f ".env" ]; then
    print_status "Database configuration found. Setting up database..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Run database setup
    python setup_database.py
    
    print_success "Database setup completed"
else
    print_warning "Database configuration not found. Please configure .env file first."
fi

# Step 6: Create startup scripts
print_status "Creating startup scripts..."

cd "$PROJECT_ROOT"

# Backend startup script
cat > start_backend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
echo "🚀 Starting Emirati Journey Platform Backend..."
echo "Backend will be available at: http://localhost:5003"
echo "Health check: http://localhost:5003/health"
echo "Press Ctrl+C to stop"
python app.py
EOF

chmod +x start_backend.sh

# Frontend startup script
cat > start_frontend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "🚀 Starting Emirati Journey Platform Frontend..."
echo "Frontend will be available at: http://localhost:8080"
echo "Press Ctrl+C to stop"
npm run dev
EOF

chmod +x start_frontend.sh

# Combined startup script
cat > start_platform.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Complete Emirati Journey Platform..."
echo "=================================================="

# Function to cleanup background processes
cleanup() {
    echo "Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting backend..."
./start_backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Start frontend in background
echo "Starting frontend..."
./start_frontend.sh &
FRONTEND_PID=$!

echo ""
echo "✅ Platform started successfully!"
echo "📱 Frontend: http://localhost:8080"
echo "🔧 Backend API: http://localhost:5003"
echo "🛡️ Admin Dashboard: http://localhost:8080/admin"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
EOF

chmod +x start_platform.sh

print_success "Startup scripts created"

# Step 7: Final Instructions
echo ""
echo "🎉 Installation completed successfully!"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your database credentials in backend/.env"
echo "2. Run the database setup: cd backend && python setup_database.py"
echo "3. Start the platform: ./start_platform.sh"
echo ""
echo "🔗 Access URLs:"
echo "   Frontend: http://localhost:8080"
echo "   Backend API: http://localhost:5003"
echo "   Admin Dashboard: http://localhost:8080/admin"
echo ""
echo "📚 Documentation:"
echo "   See documentation/ folder for detailed guides"
echo ""
echo "🆘 Need Help?"
echo "   Check the troubleshooting guide in documentation/TROUBLESHOOTING.md"
echo ""

print_success "Emirati Journey Platform is ready to use!"

