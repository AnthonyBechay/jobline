#!/bin/bash

echo "Installing backend dependencies for PDF and file improvements..."
cd packages/backend
npm install node-fetch@2.7.0 @types/node-fetch@2.6.11

echo "Backend dependencies installed successfully!"
echo ""
echo "Please restart your development server for changes to take effect."