import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
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
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Jobline
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {filteredMenuItems.find(item => location.pathname.startsWith(item.path))?.text || 'Jobline'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user?.name}</Typography>
            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountIcon />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="body2">{user?.email}</Typography>
        </MenuItem>
        <MenuItem disabled>
          <Typography variant="caption">{user?.role.replace('_', ' ')}</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout
