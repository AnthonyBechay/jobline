@echo off
echo Checking TypeScript compilation...
cd packages\frontend
npx tsc --noEmit
echo TypeScript check completed
