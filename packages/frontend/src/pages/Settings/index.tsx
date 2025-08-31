import { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Description as TemplatesIcon,
  List as ListIcon,
  NotificationsActive as RemindersIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../shared/types'

// Import sub-components
import UserManagement from './UserManagement'
import CompanyManagement from './CompanyManagement'
import Templates from './Templates'
import ListOfValues from './ListOfValues'
import RemindersSettings from './RemindersSettings'

type SettingsSection = 'main' | 'users' | 'company' | 'templates' | 'lists' | 'reminders'

interface SettingsCard {
  id: SettingsSection
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const Settings = () => {
  const { user } = useAuth()
  const [currentSection, setCurrentSection] = useState<SettingsSection>('main')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Check permissions
  if (user?.role !== UserRole.SUPER_ADMIN) {
    return (
      <Box>
        <Alert severity="error">
          You don't have permission to access this page. Only Super Admins can manage settings.
        </Alert>
      </Box>
    )
  }

  const settingsCards: SettingsCard[] = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      id: 'company',
      title: 'Company Management',
      description: 'Update company profile, logo, and contact details',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      id: 'templates',
      title: 'Templates',
      description: 'Configure fee templates and document templates',
      icon: <TemplatesIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      id: 'lists',
      title: 'List of Values',
      description: 'Manage service types, cost types, and nationalities',
      icon: <ListIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
    {
      id: 'reminders',
      title: 'Reminders',
      description: 'Configure system reminders and notifications',
      icon: <RemindersIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
  ]

  const handleCardClick = (section: SettingsSection) => {
    setCurrentSection(section)
    setError('')
    setSuccess('')
  }

  const handleBack = () => {
    setCurrentSection('main')
    setError('')
    setSuccess('')
  }

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      <Link
        key="settings"
        underline="hover"
        color="inherit"
        href="#"
        onClick={(e: React.MouseEvent) => {
          e.preventDefault()
          setCurrentSection('main')
        }}
        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
      >
        <SettingsIcon sx={{ mr: 0.5 }} fontSize="small" />
        Settings
      </Link>,
    ]

    if (currentSection !== 'main') {
      const currentCard = settingsCards.find(card => card.id === currentSection)
      if (currentCard) {
        breadcrumbs.push(
          <Typography key={currentSection} color="text.primary">
            {currentCard.title}
          </Typography>
        )
      }
    }

    return breadcrumbs
  }

  return (
    <Box>
      {/* Header with Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          {getBreadcrumbs()}
        </Breadcrumbs>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Main Settings Grid */}
      {currentSection === 'main' && (
        <Grid container spacing={3}>
          {settingsCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardActionArea 
                  onClick={() => handleCardClick(card.id)}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: `${card.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Sub-sections */}
      {currentSection === 'users' && (
        <UserManagement 
          onBack={handleBack}
          onError={setError}
          onSuccess={setSuccess}
        />
      )}

      {currentSection === 'company' && (
        <CompanyManagement 
          onBack={handleBack}
          onError={setError}
          onSuccess={setSuccess}
        />
      )}

      {currentSection === 'templates' && (
        <Templates 
          onBack={handleBack}
          onError={setError}
          onSuccess={setSuccess}
        />
      )}

      {currentSection === 'lists' && (
        <ListOfValues 
          onBack={handleBack}
          onError={setError}
          onSuccess={setSuccess}
        />
      )}

      {currentSection === 'reminders' && (
        <RemindersSettings 
          onBack={handleBack}
          onError={setError}
          onSuccess={setSuccess}
        />
      )}
    </Box>
  )
}

export default Settings
