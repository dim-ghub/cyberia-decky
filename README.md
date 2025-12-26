# Cyberia - Decky Plugin

Cyberia is a Decky Loader plugin that enhances your Steam Deck gaming experience by adding custom download and installation capabilities directly to Steam store and community pages.

## Overview

This plugin integrates seamlessly with Steam's interface on Steam Deck, adding an "Enter Cyberia" button. When clicked, it initiates a streamlined download and installation process for games through configurable API endpoints.

## Features

- **One-Click Game Management**: Adds an "Enter Cyberia" button directly on Steam app pages
- **Multiple API Support**: Configure and manage multiple download APIs simultaneously
- **Real-Time Progress Tracking**: Visual progress bar with status updates during downloads
- **Steam Deck Optimized**: Full functionality on Steam Deck with ACCELA integration
- **Custom UI**: Modern React-based interface with smooth animations and feedback
- **Settings Management**: Easy-to-use settings modal for configuration
- **Anti-Spam Protection**: Built-in mechanisms to prevent multiple simultaneous operations

## Technical Details

### Architecture

The plugin consists of:
- **Frontend** (`src/index.tsx`): React component that injects UI elements and handles user interactions
- **Backend** (`main.py`): Python backend that processes download requests and manages API communications
- **Backend Modules** (`backend/`): Existing Python modules for downloads, settings, and utilities
- **Configuration** (`backend/settings.json`): Stores API endpoints and settings

### API Configuration

Supports multiple API endpoints with individual configuration:
- **Name**: Identifier for the API
- **URL**: Endpoint template (e.g., `https://api.example.com/manifest/<appid>`)
- **API Key**: Authentication token (optional)
- **Enabled**: Toggle for selective API usage

### UI Components

- **Main Button**: "Enter Cyberia" - initiates game download/installation
- **Settings Button**: Access configuration panel
- **Progress Modal**: Real-time status with:
  - Current operation status
  - Download progress bar
  - Cancel/Hide controls
  - Success/error feedback

## Credits & Inspiration

This plugin was initially inspired by the **LuaTools** plugin for Steam. While LuaTools served as a conceptual foundation and starting point, **nearly all functionality has been completely rewritten** from scratch to create Cyberia for Decky Loader.

## Installation

This plugin is designed to work with **Decky Loader** on Steam Deck. 

### Prerequisites

- Steam Deck with Decky Loader installed
- Node.js and npm (for building)

### Installation Steps

1. **Install the plugin:**
   ```bash
   # Clone or download the plugin
   cd /home/dim/cyberia-decky
   ./install_deps.sh
   ```

2. **Package for Decky:**
   ```bash
   # Create a zip file for installation
   cd /home/dim
   zip -r cyberia-v1.0.0.zip cyberia-decky/
   ```

3. **Install via Decky Loader:**
   - Open Decky Loader settings
   - Go to "Plugins" → "Install from file"
   - Select the `cyberia-v2.2.0.zip` file
   - Restart Steam if prompted

### Manual Installation

Alternatively, you can copy the entire `cyberia-decky` folder to:
```
/home/decky/plugins/
```

## Configuration

1. Navigate to any Steam app page
2. Click the "Settings" button next to "Enter Cyberia"
3. Configure your API endpoints:
   - Add API name, URL template, and optional API key
   - Enable/disable specific APIs
4. Set ACCELA executable path if needed
5. Save settings

## Usage

1. Navigate to any Steam app page on your Steam Deck
2. Click "Enter Cyberia" to start the download process
3. Monitor progress in the modal popup
4. Game will be automatically added to your Steam library when complete

## Development

### Building the Plugin

To rebuild the frontend after making changes:

```bash
cd cyberia-decky
npm run build
```

### Development Mode

To watch for changes during development:

```bash
npm run watch
```

## License

This project is provided as-is for educational and personal use. Please ensure compliance with Steam's Terms of Service and applicable laws when using this plugin.



