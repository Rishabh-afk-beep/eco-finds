#!/bin/bash

echo "🌱 EcoFinds Backend Setup Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -c 2- | cut -d. -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Create backend directory if it doesn't exist
mkdir -p backend
cd backend

echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update JWT_SECRET and other values."
else
    echo "✅ .env file already exists"
fi

# Create uploads directory
mkdir -p uploads
echo "✅ Uploads directory created"

# Initialize database
echo "🗄️ Initializing database..."
npm run init-db

echo ""
echo "🎉 EcoFinds Backend Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Update your .env file with secure values"
echo "2. Start development server: npm run dev"
echo "3. API will be available at: http://localhost:5000"
echo "4. Health check: curl http://localhost:5000/api/health"
echo ""
echo "Happy hacking! 🚀"