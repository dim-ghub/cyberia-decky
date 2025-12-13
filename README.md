# Cyberia - Steam Plugin

Cyberia is a Steam client plugin that enhances your gaming experience by adding custom download and installation capabilities directly to Steam store and community pages.

## Overview

This plugin integrates seamlessly with Steam's interface, adding an "Enter Cyberia". When clicked, it initiates a streamlined download and installation process for games through configurable API endpoints.

## Features

- **One-Click Game Management**: Adds an "Enter Cyberia" button directly on Steam app pages
- **Multiple API Support**: Configure and manage multiple download APIs simultaneously
- **Real-Time Progress Tracking**: Visual progress bar with status updates during downloads
- **Cross-Platform Support**: Full functionality on Windows or Linux with ACCELA integration
- **Custom UI**: Themed interface with smooth animations and feedback
- **Settings Management**: Easy-to-use settings modal for configuration
- **Anti-Spam Protection**: Built-in mechanisms to prevent multiple simultaneous operations

## Technical Details

### Architecture

The plugin consists of:
- **Frontend Script** (`public/cyberia.js`): Injects UI elements and handles user interactions
- **Backend Handler** (Python): Processes download requests and manages API communications
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

This plugin was initially inspired by the **LuaTools** plugin for Steam. While LuaTools served as a conceptual foundation and starting point, **nearly all functionality has been completely rewritten** from scratch to create Cyberia.

### Key Differences from LuaTools

- **Complete Code Rewrite**: The entire codebase has been reimplemented with modern JavaScript practices
- **Enhanced UI/UX**: Redesigned interface with custom theming and animations
- **Improved Architecture**: Better separation of concerns between frontend and backend
- **Extended Functionality**: Added features like multi-API support and real-time progress tracking
- **Modern JavaScript**: Uses contemporary ES6+ features and async/await patterns

## Installation

This plugin is designed to work with the **Millennium** Steam client framework. Place the plugin files in the appropriate Millennium plugins directory.

## Configuration

1. Click the "Settings" button next to "Enter Cyberia"
2. Configure your API endpoints:
   - Add API name, URL template, and optional API key
   - Enable/disable specific APIs
3. (Windows only) Set ACCELA executable path if needed
4. Save settings

## Usage

1. Navigate to any Steam app page
2. Click "Enter Cyberia" to start the download process
3. Monitor progress in the modal popup
4. Game will be automatically added to your Steam library when complete

## License

This project is provided as-is for educational and personal use. Please ensure compliance with Steam's Terms of Service and applicable laws when using this plugin.
