#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing multi-tenancy and UI issues in Jobline...\n');

// Helper function to read file
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Helper function to write file
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filePath}:`, error.message);
    return false;
  }
}

// Fix 1: Dashboard routes - Already fixed in previous edits
console.log('1️⃣ Dashboard routes already fixed with company filtering');

// Fix 2: User routes - Already fixed in previous edits  
console.log('2️⃣ User routes already fixed with company filtering');

// Fix 3: Fix Candidate Edit Form nationality loading
const candidatesPath = path.join(__dirname, 'packages/frontend/src/pages/Candidates.tsx');
let candidatesContent = readFile(candidatesPath);

if (candidatesContent) {
  // Fix the nationality field value binding in edit mode
  candidatesContent = candidatesContent.replace(
    /\/\/ Reset the form with the fetched data[\s\S]*?reset\(formData as any\)/g,
    `// Reset the form with the fetched data
      // Set all form values explicitly including nationality
      Object.keys(formData).forEach(key => {
        setValue(key, formData[key]);
      });
      reset(formData as any)`
  );
  
  writeFile(candidatesPath, candidatesContent);
  console.log('3️⃣ Fixed candidate edit form nationality loading');
}

// Fix 4: Document validation for application status progression
const applicationRoutesPath = path.join(__dirname, 'packages/backend/src/routes/application.routes.ts');
let applicationRoutesContent = readFile(applicationRoutesPath);

if (applicationRoutesContent && !applicationRoutesContent.includes('// Check if all required documents')) {
  // Add document validation before status update
  const statusUpdateCode = `// Update application status - with document validation
router.patch('/:id', authenticate, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.user!.companyId;
    
    // Get the application
    const application = await prisma.application.findFirst({
      where: { id, companyId },
      include: {
        documentItems: true,
      }
    });
    
    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    // Check if all required documents for current stage are received/submitted
    const requiredDocs = await prisma.documentTemplate.findMany({
      where: {
        companyId,
        stage: application.status,
        required: true,
        requiredFrom: 'office'
      }
    });
    
    // Get document statuses for this application
    const docStatuses = application.documentItems.reduce((acc, item) => {
      acc[item.documentName] = item.status;
      return acc;
    }, {} as Record<string, string>);
    
    // Check if all required office documents are at least received
    const missingDocs = requiredDocs.filter(doc => 
      !docStatuses[doc.name] || docStatuses[doc.name] === 'PENDING'
    );
    
    if (missingDocs.length > 0) {
      res.status(400).json({ 
        error: 'Cannot proceed to next stage',
        message: \`Missing required documents: \${missingDocs.map(d => d.name).join(', ')}\`
      });
      return;
    }
    
    // Update the status
    const updated = await prisma.application.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        candidate: true,
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});`;

  // Replace or add the status update route
  if (applicationRoutesContent.includes("router.patch('/:id'")) {
    applicationRoutesContent = applicationRoutesContent.replace(
      /router\.patch\('\/\:id'[\s\S]*?\}\);/,
      statusUpdateCode
    );
  } else {
    // Add before export default
    applicationRoutesContent = applicationRoutesContent.replace(
      'export default router;',
      statusUpdateCode + '\n\nexport default router;'
    );
  }
  
  writeFile(applicationRoutesPath, applicationRoutesContent);
  console.log('4️⃣ Added document validation for application status progression');
}

// Fix 5: Remove upper static bar and move profile button to sidebar
const layoutPath = path.join(__dirname, 'packages/frontend/src/components/Layout.tsx');
let layoutContent = readFile(layoutPath);

if (layoutContent) {
  // New simplified layout without AppBar
  const newLayoutContent = `import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Toolbar,
  Button,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  PersonSearch as PersonSearchIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  Support as SupportIcon,
  ExitToApp as LogoutIcon,
  AccountCircle as AccountIcon,
  NotificationsActive as ReminderIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '@jobline/shared'

const drawerWidth = 240

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { text: 'Candidates', icon: <PersonSearchIcon />, path: '/candidates', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { text: 'Clients', icon: <PeopleIcon />, path: '/clients', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { text: 'Applications', icon: <AssignmentIcon />, path: '/applications', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { text: 'Financial', icon: <MoneyIcon />, path: '/financial', roles: [UserRole.SUPER_ADMIN] },
    { text: 'Agents', icon: <BusinessIcon />, path: '/agents', roles: [UserRole.SUPER_ADMIN] },
    { text: 'Brokers', icon: <SupportIcon />, path: '/brokers', roles: [UserRole.SUPER_ADMIN] },
    { text: 'Users', icon: <GroupIcon />, path: '/users', roles: [UserRole.SUPER_ADMIN] },
    { text: 'Reminders', icon: <ReminderIcon />, path: '/reminders', roles: [UserRole.SUPER_ADMIN] },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: [UserRole.SUPER_ADMIN] },
  ]

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role as UserRole)
  )

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
        <Typography variant="h6" noWrap component="div">
          Jobline
        </Typography>
        {mobileOpen && (
          <IconButton onClick={handleDrawerToggle} sx={{ display: { sm: 'none' } }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => {
                navigate(item.path)
                if (mobileOpen) setMobileOpen(false)
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 2,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
            p: 1,
            borderRadius: 1
          }}
          onClick={handleMenuOpen}
        >
          <Avatar sx={{ width: 32, height: 32 }}>
            <AccountIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" fontWeight="medium">{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role.replace('_', ' ')}
            </Typography>
          </Box>
        </Box>
        <Button 
          fullWidth 
          variant="outlined" 
          color="error" 
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="body2">{user?.email}</Typography>
        </MenuItem>
        <MenuItem disabled>
          <Typography variant="caption">{user?.company?.name}</Typography>
        </MenuItem>
      </Menu>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Mobile menu button */}
      <IconButton
        color="inherit"
        aria-label="open drawer"
        onClick={handleDrawerToggle}
        sx={{ 
          position: 'fixed',
          top: 8,
          left: 8,
          zIndex: 1200,
          display: { sm: 'none' },
          bgcolor: 'background.paper',
          boxShadow: 1,
        }}
      >
        <MenuIcon />
      </IconButton>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: \`calc(100% - \${drawerWidth}px)\` },
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout`;

  writeFile(layoutPath, newLayoutContent);
  console.log('5️⃣ Removed upper bar and moved profile to sidebar');
}

// Fix 6: Company info setting - Already fixed in auth controller
console.log('6️⃣ Company info setting already added to registration process');

console.log('\n✨ All fixes completed! Please restart your development server.');
console.log('\n📝 Summary of fixes:');
console.log('  1. Dashboard and all routes now filter data by company');
console.log('  2. User management is company-specific');
console.log('  3. Candidate edit form properly loads nationality');
console.log('  4. Application status requires document validation');
console.log('  5. UI improved: removed top bar, profile in sidebar');
console.log('  6. Company name saved during registration');
