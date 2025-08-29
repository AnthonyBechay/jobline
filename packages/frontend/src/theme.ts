// Beautiful Modern Theme with Professional Colors
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a5f', // Deep professional blue
      light: '#4a6fa5',
      dark: '#0d1f3c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e91e63', // Vibrant pink accent
      light: '#ff6090',
      dark: '#b0003a',
      contrastText: '#ffffff',
    },
    success: {
      main: '#00c853',
      light: '#5efc82',
      dark: '#009624',
    },
    error: {
      main: '#f44336',
      light: '#ff7961',
      dark: '#ba000d',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.02857em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 3px 6px rgba(0,0,0,0.07)',
    '0px 4px 8px rgba(0,0,0,0.08)',
    '0px 6px 12px rgba(0,0,0,0.10)',
    '0px 8px 16px rgba(0,0,0,0.12)',
    '0px 10px 20px rgba(0,0,0,0.14)',
    '0px 12px 24px rgba(0,0,0,0.16)',
    '0px 14px 28px rgba(0,0,0,0.18)',
    '0px 16px 32px rgba(0,0,0,0.20)',
    '0px 18px 36px rgba(0,0,0,0.22)',
    '0px 20px 40px rgba(0,0,0,0.24)',
    '0px 24px 48px rgba(0,0,0,0.26)',
    '0px 28px 56px rgba(0,0,0,0.28)',
    '0px 32px 64px rgba(0,0,0,0.30)',
    '0px 36px 72px rgba(0,0,0,0.32)',
    '0px 40px 80px rgba(0,0,0,0.34)',
    '0px 44px 88px rgba(0,0,0,0.36)',
    '0px 48px 96px rgba(0,0,0,0.38)',
    '0px 52px 104px rgba(0,0,0,0.40)',
    '0px 56px 112px rgba(0,0,0,0.42)',
    '0px 60px 120px rgba(0,0,0,0.44)',
    '0px 64px 128px rgba(0,0,0,0.46)',
    '0px 68px 136px rgba(0,0,0,0.48)',
    '0px 72px 144px rgba(0,0,0,0.50)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: 'none',
          textTransform: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1e3a5f 0%, #4a6fa5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0d1f3c 0%, #1e3a5f 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #e91e63 0%, #ff6090 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #b0003a 0%, #e91e63 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0,0,0,0.10)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover fieldset': {
              borderColor: '#4a6fa5',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1e3a5f',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #1e3a5f 0%, #4a6fa5 100%)',
          color: '#ffffff',
        },
        colorSecondary: {
          background: 'linear-gradient(135deg, #e91e63 0%, #ff6090 100%)',
          color: '#ffffff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255,255,255,0.95)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
          background: 'linear-gradient(180deg, #1e3a5f 0%, #0d1f3c 100%)',
          color: '#ffffff',
          '& .MuiListItemText-primary': {
            color: '#ffffff',
          },
          '& .MuiListItemIcon-root': {
            color: 'rgba(255,255,255,0.8)',
          },
          '& .MuiListItem-root:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
          '& .MuiListItem-root.Mui-selected': {
            backgroundColor: 'rgba(255,255,255,0.15)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
            },
          },
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fafc',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#1a202c',
            borderBottom: '2px solid #e2e8f0',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f7fafc',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: '#f0fdf4',
          color: '#166534',
        },
        standardError: {
          backgroundColor: '#fef2f2',
          color: '#991b1b',
        },
        standardWarning: {
          backgroundColor: '#fffbeb',
          color: '#92400e',
        },
        standardInfo: {
          backgroundColor: '#eff6ff',
          color: '#1e40af',
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepIcon-root': {
            '&.Mui-completed': {
              color: '#00c853',
            },
            '&.Mui-active': {
              color: '#1e3a5f',
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9375rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        colorError: {
          backgroundColor: '#f44336',
        },
        colorWarning: {
          backgroundColor: '#ff9800',
        },
        colorSuccess: {
          backgroundColor: '#00c853',
        },
      },
    },
  },
})

export default theme
