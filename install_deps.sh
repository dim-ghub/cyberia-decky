#!/bin/bash

cd "$(dirname "$0")"

# Check if Python3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed or not in PATH"
    exit 1
fi

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "Error: requirements.txt not found"
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

# Install dependencies in local venv
echo "Installing dependencies in local venv..."
if ! .venv/bin/pip install -r requirements.txt; then
    echo "Error: Failed to install dependencies in local venv"
    exit 1
fi
echo "Local venv dependencies installed successfully"

# Install dependencies in Millennium venv if it exists
MILLENNIUM_VENV="$HOME/.local/share/millennium/.venv"
if [ -d "$MILLENNIUM_VENV" ]; then
    echo "Installing dependencies in Millennium venv..."
    if ! "$MILLENNIUM_VENV/bin/pip" install -r requirements.txt; then
        echo "Warning: Failed to install dependencies in Millennium venv"
    else
        echo "Millennium venv dependencies installed successfully"
    fi
else
    echo "Note: Millennium venv not found at $MILLENNIUM_VENV, skipping"
fi

echo "Setup completed successfully!"
