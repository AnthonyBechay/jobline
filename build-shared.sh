#!/bin/bash
echo "Building shared types..."
cd packages/shared
npm run build
cd ../..
echo "Shared types built successfully!"
