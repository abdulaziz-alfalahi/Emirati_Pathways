#!/bin/bash

# Redis Setup Script for Emirati Journey Platform
# This script installs and configures Redis for improved analytics performance

echo "🚀 Setting up Redis for Enhanced Analytics Performance"
echo "=================================================="

# Detect operating system
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux (Ubuntu/Debian)
    echo "📦 Installing Redis on Linux..."
    
    # Update package list
    sudo apt update
    
    # Install Redis
    sudo apt install -y redis-server
    
    # Configure Redis to start on boot
    sudo systemctl enable redis-server
    
    # Start Redis service
    sudo systemctl start redis-server
    
    # Check Redis status
    if sudo systemctl is-active --quiet redis-server; then
        echo "✅ Redis installed and running successfully"
    else
        echo "❌ Redis installation failed"
        exit 1
    fi
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📦 Installing Redis on macOS..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    # Install Redis
    brew install redis
    
    # Start Redis service
    brew services start redis
    
    echo "✅ Redis installed and running successfully"
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "Please install Redis manually or use Docker:"
    echo "   docker run -d -p 6379:6379 --name redis redis:alpine"
    exit 1
fi

# Test Redis connection
echo ""
echo "🔍 Testing Redis connection..."
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is responding correctly"
else
    echo "❌ Redis is not responding. Please check the installation."
    exit 1
fi

# Display Redis info
echo ""
echo "📊 Redis Information:"
redis-cli info server | grep -E "(redis_version|os|arch|process_id)"

# Create Redis configuration for the application
echo ""
echo "⚙️ Configuring Redis for Emirati Journey Platform..."

# Add Redis configuration to backend .env file
ENV_FILE="emirati_journey_api/.env"
if [ -f "$ENV_FILE" ]; then
    # Check if Redis configuration already exists
    if grep -q "REDIS_URL" "$ENV_FILE"; then
        echo "📝 Redis configuration already exists in $ENV_FILE"
    else
        echo "" >> "$ENV_FILE"
        echo "# Redis Configuration (Added by setup script)" >> "$ENV_FILE"
        echo "REDIS_URL=redis://localhost:6379" >> "$ENV_FILE"
        echo "USE_REDIS=true" >> "$ENV_FILE"
        echo "✅ Redis configuration added to $ENV_FILE"
    fi
else
    echo "⚠️ Backend .env file not found. Please create it manually with:"
    echo "   REDIS_URL=redis://localhost:6379"
    echo "   USE_REDIS=true"
fi

# Performance recommendations
echo ""
echo "🚀 Performance Recommendations:"
echo "1. Redis is now configured for caching analytics data"
echo "2. Real-time metrics will be cached for faster access"
echo "3. Job matching results will be cached to improve response times"
echo "4. User session data will be stored in Redis for better performance"

# Security recommendations
echo ""
echo "🔒 Security Recommendations:"
echo "1. Configure Redis password: redis-cli CONFIG SET requirepass 'your-secure-password'"
echo "2. Bind Redis to localhost only (default configuration)"
echo "3. Enable Redis persistence if needed: redis-cli CONFIG SET save '900 1'"

# Monitoring commands
echo ""
echo "📊 Useful Redis Monitoring Commands:"
echo "• Check Redis status: redis-cli ping"
echo "• Monitor Redis activity: redis-cli monitor"
echo "• View Redis info: redis-cli info"
echo "• Check memory usage: redis-cli info memory"
echo "• List all keys: redis-cli keys '*'"

# Restart instructions
echo ""
echo "🔄 To restart the backend with Redis support:"
echo "1. Stop the current backend process"
echo "2. Navigate to emirati_journey_api directory"
echo "3. Run: PORT=5003 python app.py"
echo "4. The backend will automatically detect and use Redis"

echo ""
echo "✅ Redis setup completed successfully!"
echo "🎉 Your Emirati Journey Platform now has enhanced caching capabilities!"

