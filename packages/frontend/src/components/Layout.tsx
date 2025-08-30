import { useState } from 'react'
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
    handleMenuClose()
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
      <Toolbar sx={{ minHeight: '56px !important', px: 2 }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Jobline
        </Typography>
        {mobileOpen && (
          <IconButton onClick={handleDrawerToggle} sx={{ ml: 'auto', display: { sm: 'none' } }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      
      {/* User info at top */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
          }}
          onClick={handleMenuOpen}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" fontWeight="600">{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role?.replace('_', ' ')}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Divider />
      
      {/* Menu items with reduced spacing */}
      <List sx={{ flexGrow: 1, py: 0.5 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ my: 0 }}>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => {
                navigate(item.path)
                if (mobileOpen) setMobileOpen(false)
              }}
              sx={{
                py: 0.8,
                minHeight: 42,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: location.pathname.startsWith(item.path) ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: location.pathname.startsWith(item.path) ? 'medium' : 'regular'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* User menu dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem disabled>
          <Typography variant="body2">{user?.email}</Typography>
        </MenuItem>
        {user?.company?.name && (
          <MenuItem disabled>
            <Typography variant="caption" color="text.secondary">
              {user.company.name}
            </Typography>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'grey.50' }}>
      {/* Mobile menu button */}
      <IconButton
        color="inherit"
        aria-label="open drawer"
        onClick={handleDrawerToggle}
        sx={{ 
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1200,
          display: { sm: 'none' },
          bgcolor: 'background.paper',
          boxShadow: 2,
          '&:hover': {
            bgcolor: 'background.paper',
            boxShadow: 3,
          }
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
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
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
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          overflow: 'auto',
          bgcolor: 'grey.50',
        }}
      >
        <Box sx={{ pt: { xs: 7, sm: 0 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout
