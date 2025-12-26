#!/bin/bash

cd "$(dirname "$0")"

# Install Python dependencies for Decky backend in virtual environment
echo "Setting up Python virtual environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    if [ $? -eq 0 ]; then
        echo "Virtual environment created successfully"
    else
        echo "Error: Failed to create virtual environment"
        exit 1
    fi
fi

echo "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    source .venv/bin/activate
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo "Python dependencies installed successfully"
    else
        echo "Warning: Failed to install Python dependencies"
    fi
    deactivate
else
    echo "Note: requirements.txt not found, skipping Python dependencies"
fi

# Install Node.js dependencies for frontend
echo "Installing Node.js dependencies..."
if command -v npm &> /dev/null; then
    npm install
    if [ $? -eq 0 ]; then
        echo "Node.js dependencies installed successfully"
        
        # Build the frontend
        echo "Building frontend..."
        npm run build
        if [ $? -eq 0 ]; then
            echo "Frontend built successfully"
        else
            echo "Warning: Failed to build frontend"
        fi
    else
        echo "Error: Failed to install Node.js dependencies"
        exit 1
    fi
else
    echo "Error: npm is not installed or not in PATH"
    echo "Please install Node.js and npm first"
    exit 1
fi

echo "Setup completed successfully!"
