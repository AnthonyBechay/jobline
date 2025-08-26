#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing deployment issues...\n');

// Fix 1: Update frontend package.json to add missing dependencies
console.log('📦 Adding missing dependencies to frontend...');
const frontendPackageJsonPath = path.join(__dirname, 'packages', 'frontend', 'package.json');
const frontendPackageJson = JSON.parse(fs.readFileSync(frontendPackageJsonPath, 'utf8'));

// Add missing dependencies
frontendPackageJson.dependencies = {
  ...frontendPackageJson.dependencies,
  "class-variance-authority": "^0.7.0",
  "tailwind-merge": "^2.2.0",
  "@radix-ui/react-slot": "^1.1.1",
  "lucide-react": "^0.468.0",
  "clsx": "^2.1.1"
};

fs.writeFileSync(frontendPackageJsonPath, JSON.stringify(frontendPackageJson, null, 2));

// Fix 2: Fix imports in frontend components
console.log('🔄 Fixing imports in frontend components...');

// Fix AuthContext imports
const authContextPath = path.join(__dirname, 'packages', 'frontend', 'src', 'contexts', 'AuthContext.tsx');
let authContextContent = fs.readFileSync(authContextPath, 'utf8');
authContextContent = authContextContent.replace(
  "import { User, LoginRequest, LoginResponse } from '@jobline/shared'",
  "import { User, LoginRequest, LoginResponse } from '../shared/types'"
);
fs.writeFileSync(authContextPath, authContextContent);

// Fix ProtectedRoute imports
const protectedRoutePath = path.join(__dirname, 'packages', 'frontend', 'src', 'components', 'ProtectedRoute.tsx');
let protectedRouteContent = fs.readFileSync(protectedRoutePath, 'utf8');
protectedRouteContent = protectedRouteContent.replace(
  "import { UserRole } from '@jobline/shared'",
  "import { UserRole } from '../shared/types'"
);
fs.writeFileSync(protectedRoutePath, protectedRouteContent);

// Fix App.tsx to use proper UserRole enum
const appPath = path.join(__dirname, 'packages', 'frontend', 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = `import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { UserRole } from './shared/types'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import Clients from './pages/Clients'
import Applications from './pages/Applications'
import Financial from './pages/Financial'
import Settings from './pages/Settings'
import Users from './pages/Users'
import Agents from './pages/Agents'
import Brokers from './pages/Brokers'
import ClientStatus from './pages/ClientStatus'

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/status/:shareableLink" element={<ClientStatus />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/candidates/*" element={<Candidates />} />
          <Route path="/clients/*" element={<Clients />} />
          <Route path="/applications/*" element={<Applications />} />
          
          {/* Super Admin only routes */}
          <Route path="/financial/*" element={
            <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
              <Financial />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/agents" element={
            <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
              <Agents />
            </ProtectedRoute>
          } />
          <Route path="/brokers" element={
            <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
              <Brokers />
            </ProtectedRoute>
          } />
        </Route>
      </Route>
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App`;
fs.writeFileSync(appPath, appContent);

// Fix 3: Fix button component imports
const buttonPath = path.join(__dirname, 'packages', 'frontend', 'src', 'components', 'ui', 'button.tsx');
const buttonContent = `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`;
fs.writeFileSync(buttonPath, buttonContent);

// Fix 4: Create proper utils file
const utilsPath = path.join(__dirname, 'packages', 'frontend', 'src', 'lib', 'utils.ts');
const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
fs.writeFileSync(utilsPath, utilsContent);

console.log('✅ Fixed all import and dependency issues!\n');
console.log('📦 Now installing missing dependencies...\n');

// Install dependencies
try {
  console.log('Installing frontend dependencies...');
  execSync('cd packages/frontend && npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully!\n');
} catch (error) {
  console.error('⚠️ Failed to install dependencies automatically. Please run: cd packages/frontend && npm install');
}

console.log('🎉 Deployment fixes complete! You can now deploy to Vercel.');
console.log('\nNext steps:');
console.log('1. Commit the changes: git add -A && git commit -m "Fix deployment issues"');
console.log('2. Push to GitHub: git push');
console.log('3. Vercel will automatically deploy the changes');
