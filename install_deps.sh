#!/bin/bash

cd "$(dirname "$0")"

# Check if Python3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed or not in PATH"
    exit 1
fi

# Check if requirements.txt exists
if [ ! -f "backend/requirements.txt" ]; then
    echo "Error: backend/requirements.txt not found"
    exit 1
fi

# Remove existing virtual environment if it exists
if [ -d ".venv" ]; then
    echo "Removing existing virtual environment..."
    if ! rm -rf .venv; then
        echo "Error: Failed to remove existing virtual environment"
        exit 1
    fi
fi

# Create new virtual environment
echo "Creating virtual environment..."
if ! python3 -m venv .venv; then
    echo "Error: Failed to create virtual environment"
    exit 1
fi
echo "Virtual environment created successfully"

# Install dependencies
echo "Installing dependencies..."
if ! .venv/bin/pip install -r backend/requirements.txt; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo "Setup completed successfully!"
