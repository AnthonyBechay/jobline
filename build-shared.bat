@echo off
echo Building shared types...
cd packages\shared
call npm run build
echo Shared types built successfully!
cd ..\..\
