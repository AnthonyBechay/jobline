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
  alpha,
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

const drawerWidth = 260

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
    { text: 'Applications', icon: <AssignmentIcon />, path: '/applications', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { text: 'Clients', icon: <PeopleIcon />, path: '/clients', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { text: 'Candidates', icon: <PersonSearchIcon />, path: '/candidates', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { text: 'Financial', icon: <MoneyIcon />, path: '/financial', roles: [UserRole.SUPER_ADMIN] },
    { text: 'Agents', icon: <BusinessIcon />, path: '/agents', roles: [UserRole.SUPER_ADMIN] },
    { text: 'Brokers', icon: <SupportIcon />, path: '/brokers', roles: [UserRole.SUPER_ADMIN] },
    { text: 'Users', icon: <GroupIcon />, path: '/users', roles: [UserRole.SUPER_ADMIN] },
    { text: 'Reminders', icon: <ReminderIcon />, path: '/reminders', roles: [UserRole.SUPER_ADMIN] },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  ]

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role as UserRole)
  )

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1e3a5f 0%, #2c5282 100%)',
    }}>
      <Toolbar sx={{ 
        minHeight: '64px !important', 
        px: 2,
        background: 'transparent',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography 
            variant="h5" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#ffffff',
              letterSpacing: '0.5px',
              flexGrow: 1,
            }}
          >
            JOBLINE
          </Typography>
          {mobileOpen && (
            <IconButton 
              onClick={handleDrawerToggle} 
              sx={{ 
                ml: 'auto', 
                display: { sm: 'none' },
                color: '#ffffff'
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>
      
      {/* User info section */}
      <Box sx={{ 
        px: 2, 
        py: 2,
        background: alpha('#000000', 0.1),
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: alpha('#ffffff', 0.1),
      }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            cursor: 'pointer',
            borderRadius: 2,
            p: 1,
            transition: 'all 0.3s',
            '&:hover': { 
              bgcolor: alpha('#ffffff', 0.05),
            },
          }}
          onClick={handleMenuOpen}
        >
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: '#ffffff',
              color: '#1e3a5f',
              fontWeight: 'bold',
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="body1" 
              fontWeight="600" 
              sx={{ color: '#ffffff', lineHeight: 1.2 }}
            >
              {user?.name}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: alpha('#ffffff', 0.7),
                textTransform: 'capitalize',
              }}
            >
              {user?.role?.replace('_', ' ').toLowerCase()}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Menu items */}
      <List sx={{ 
        flexGrow: 1, 
        py: 1,
        px: 1,
      }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ my: 0.5 }}>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => {
                navigate(item.path)
                if (mobileOpen) setMobileOpen(false)
              }}
              sx={{
                py: 1.2,
                px: 2,
                borderRadius: 2,
                transition: 'all 0.3s',
                color: alpha('#ffffff', 0.9),
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.1),
                  transform: 'translateX(4px)',
                },
                '&.Mui-selected': {
                  backgroundColor: alpha('#ffffff', 0.15),
                  color: '#ffffff',
                  '& .MuiListItemIcon-root': {
                    color: '#ffffff',
                  },
                  '&:hover': {
                    backgroundColor: alpha('#ffffff', 0.2),
                  },
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40, 
                color: location.pathname.startsWith(item.path) 
                  ? '#ffffff' 
                  : alpha('#ffffff', 0.7)
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: location.pathname.startsWith(item.path) ? 600 : 400,
                  letterSpacing: '0.3px',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* Company info at bottom */}
      {user?.company?.name && (
        <Box sx={{ 
          px: 2, 
          py: 1.5,
          borderTop: '1px solid',
          borderColor: alpha('#ffffff', 0.1),
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: alpha('#ffffff', 0.5),
              display: 'block',
              textAlign: 'center',
            }}
          >
            {user.company.name}
          </Typography>
        </Box>
      )}
      
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
        sx={{
          '& .MuiPaper-root': {
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
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
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      bgcolor: '#e8edf3',
    }}>
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
          bgcolor: '#1e3a5f',
          color: '#ffffff',
          boxShadow: 3,
          '&:hover': {
            bgcolor: '#2c5282',
            boxShadow: 4,
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
              border: 'none',
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
              border: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
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
          p: { xs: 2, sm: 3, md: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          overflow: 'auto',
          bgcolor: '#e8edf3',
        }}
      >
        <Box sx={{ 
          pt: { xs: 7, sm: 0 },
          maxWidth: '1600px',
          mx: 'auto',
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout
