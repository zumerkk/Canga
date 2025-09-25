import { createTheme } from '@mui/material/styles';

// 🎨 MODERN DESIGN SYSTEM - 2024 TRENDS
// Inspired by: Figma, Linear, Notion, Stripe design systems

// 🎯 Color Palette - Professional & Accessible
const colors = {
  // Primary Brand Colors - Modern Blue Spectrum
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main brand color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },

  // Secondary Colors - Elegant Purple
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff', 
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Main secondary
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764'
  },

  // Semantic Colors - Status & Feedback
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main success
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },

  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main info
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e'
  },

  // Neutral Colors - Sophisticated Gray Scale
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b', // Main neutral
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },

  // Glass & Backdrop Effects
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    heavy: 'rgba(255, 255, 255, 0.3)',
    dark: 'rgba(0, 0, 0, 0.1)',
    blur: 'backdrop-filter: blur(20px)',
  }
};

// 🔤 Typography System - Modern Font Stack
const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont', 
    '"Segoe UI"',
    'Roboto',
    '"Inter"',
    '"San Francisco"',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"'
  ].join(','),

  // Modern Font Weights
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  fontWeightBold: 700,
  fontWeightExtraBold: 800,

  // Typography Scale - Perfect Ratios
  h1: {
    fontSize: '3.5rem', // 56px
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2.5rem', // 40px
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '2rem', // 32px
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
  },
  h4: {
    fontSize: '1.5rem', // 24px
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h5: {
    fontSize: '1.25rem', // 20px
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1.125rem', // 18px
    fontWeight: 600,
    lineHeight: 1.4,
  },
  
  // Body Text
  body1: {
    fontSize: '1rem', // 16px
    fontWeight: 400,
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem', // 14px
    fontWeight: 400,
    lineHeight: 1.5,
  },
  
  // UI Text
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.4,
    textTransform: 'none', // Modern approach - no uppercase
  },
  caption: {
    fontSize: '0.75rem', // 12px
    fontWeight: 400,
    lineHeight: 1.4,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }
};

// 📏 Spacing System - 8px Grid
const spacing = {
  0: 0,
  1: '0.25rem', // 4px
  2: '0.5rem',  // 8px
  3: '0.75rem', // 12px
  4: '1rem',    // 16px
  5: '1.25rem', // 20px
  6: '1.5rem',  // 24px
  8: '2rem',    // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
  20: '5rem',   // 80px
  24: '6rem',   // 96px
  32: '8rem',   // 128px
};

// 🎭 Shadows - Layered & Realistic
const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Colored Shadows
  primary: '0 10px 25px -5px rgba(14, 165, 233, 0.3)',
  secondary: '0 10px 25px -5px rgba(168, 85, 247, 0.3)',
  success: '0 10px 25px -5px rgba(34, 197, 94, 0.3)',
  error: '0 10px 25px -5px rgba(239, 68, 68, 0.3)',
};

// 🎨 Border Radius - Modern & Consistent  
const borderRadius = {
  none: '0',
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
};

// ⚡ Animations - Smooth & Natural
const animations = {
  // Easing Functions
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Duration
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  }
};

// 🌙 Dark Theme Support
const createMode = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light' ? {
      // Light Theme
      primary: {
        main: colors.primary[500],
        light: colors.primary[400],
        dark: colors.primary[600],
        contrastText: '#ffffff',
      },
      secondary: {
        main: colors.secondary[500],
        light: colors.secondary[400],
        dark: colors.secondary[600],
        contrastText: '#ffffff',
      },
      background: {
        default: colors.neutral[50],
        paper: colors.neutral[0],
        glass: 'rgba(255, 255, 255, 0.7)',
      },
      text: {
        primary: colors.neutral[900],
        secondary: colors.neutral[600],
        disabled: colors.neutral[400],
      },
      divider: colors.neutral[200],
      action: {
        active: colors.neutral[600],
        hover: colors.neutral[100],
        selected: colors.neutral[200],
        disabled: colors.neutral[300],
        disabledBackground: colors.neutral[100],
      },
    } : {
      // Dark Theme
      primary: {
        main: colors.primary[400],
        light: colors.primary[300],
        dark: colors.primary[500],
        contrastText: colors.neutral[900],
      },
      secondary: {
        main: colors.secondary[400],
        light: colors.secondary[300],
        dark: colors.secondary[500],
        contrastText: colors.neutral[900],
      },
      background: {
        default: colors.neutral[950],
        paper: colors.neutral[900],
        glass: 'rgba(0, 0, 0, 0.7)',
      },
      text: {
        primary: colors.neutral[50],
        secondary: colors.neutral[300],
        disabled: colors.neutral[500],
      },
      divider: colors.neutral[700],
      action: {
        active: colors.neutral[300],
        hover: colors.neutral[800],
        selected: colors.neutral[700],
        disabled: colors.neutral[600],
        disabledBackground: colors.neutral[800],
      },
    }),
    
    // Semantic Colors (Same for both themes)
    success: {
      main: colors.success[500],
      light: colors.success[400],
      dark: colors.success[600],
      contrastText: '#ffffff',
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[400],
      dark: colors.warning[600],
      contrastText: '#ffffff',
    },
    error: {
      main: colors.error[500],
      light: colors.error[400],
      dark: colors.error[600],
      contrastText: '#ffffff',
    },
    info: {
      main: colors.info[500],
      light: colors.info[400],
      dark: colors.info[600],
      contrastText: '#ffffff',
    },
  },
});

// 🎛️ Component Customizations
const components = (mode) => ({
  // Global Styles
  MuiCssBaseline: {
    styleOverrides: {
      '*': {
        boxSizing: 'border-box',
      },
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        scrollBehavior: 'smooth',
      },
      body: {
        backgroundColor: mode === 'light' ? colors.neutral[50] : colors.neutral[950],
        fontFamily: typography.fontFamily,
      },
      // Custom Scrollbar
      '*::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '*::-webkit-scrollbar-track': {
        backgroundColor: mode === 'light' ? colors.neutral[100] : colors.neutral[800],
        borderRadius: '4px',
      },
      '*::-webkit-scrollbar-thumb': {
        backgroundColor: mode === 'light' ? colors.neutral[300] : colors.neutral[600],
        borderRadius: '4px',
        '&:hover': {
          backgroundColor: mode === 'light' ? colors.neutral[400] : colors.neutral[500],
        },
      },
    },
  },

  // Button Styling
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: borderRadius.lg,
        textTransform: 'none',
        fontWeight: 600,
        padding: '12px 24px',
        fontSize: '0.875rem',
        minHeight: '44px', // Touch-friendly
        position: 'relative',
        overflow: 'hidden',
        transition: `all ${animations.duration.standard}ms ${animations.easeInOut}`,
        
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          transition: `left ${animations.duration.complex}ms ${animations.easeInOut}`,
        },
        
        '&:hover::before': {
          left: '100%',
        },
      },
      contained: {
        boxShadow: shadows.md,
        '&:hover': {
          boxShadow: shadows.lg,
          transform: 'translateY(-2px)',
        },
        '&:active': {
          transform: 'translateY(0)',
          boxShadow: shadows.sm,
        },
      },
      outlined: {
        borderWidth: '2px',
        '&:hover': {
          borderWidth: '2px',
          backgroundColor: mode === 'light' ? colors.neutral[50] : colors.neutral[800],
        },
      },
    },
  },

  // Paper/Card Styling
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: borderRadius.xl,
        background: mode === 'light' 
          ? 'rgba(255, 255, 255, 0.8)' 
          : 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${mode === 'light' ? colors.neutral[200] : colors.neutral[700]}`,
        transition: `all ${animations.duration.standard}ms ${animations.easeInOut}`,
      },
      elevation1: {
        boxShadow: shadows.sm,
      },
      elevation2: {
        boxShadow: shadows.md,
      },
      elevation3: {
        boxShadow: shadows.lg,
      },
      elevation4: {
        boxShadow: shadows.xl,
      },
    },
  },

  // Card Enhancements
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: borderRadius.xl,
        transition: `all ${animations.duration.standard}ms ${animations.easeInOut}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: shadows.xl,
        },
      },
    },
  },

  // TextField Styling
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: borderRadius.lg,
          backgroundColor: mode === 'light' 
            ? 'rgba(255, 255, 255, 0.8)' 
            : 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)',
          transition: `all ${animations.duration.short}ms ${animations.easeInOut}`,
          
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: shadows.md,
          },
          
          '&.Mui-focused': {
            transform: 'translateY(-2px)',
            boxShadow: shadows.lg,
          },
        },
      },
    },
  },

  // Chip Styling
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: borderRadius.full,
        fontWeight: 500,
        backdropFilter: 'blur(10px)',
      },
      filled: {
        '&.MuiChip-colorPrimary': {
          background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
          color: 'white',
        },
        '&.MuiChip-colorSecondary': {
          background: `linear-gradient(135deg, ${colors.secondary[500]}, ${colors.secondary[600]})`,
          color: 'white',
        },
      },
    },
  },

  // Table Enhancements
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          backgroundColor: mode === 'light' 
            ? 'rgba(248, 250, 252, 0.8)' 
            : 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(10px)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: '0.75rem',
        },
      },
    },
  },

  // Dialog Styling
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: borderRadius['2xl'],
        backdropFilter: 'blur(20px)',
        border: `1px solid ${mode === 'light' ? colors.neutral[200] : colors.neutral[700]}`,
      },
    },
  },

  // AppBar Styling
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: mode === 'light' 
          ? 'rgba(255, 255, 255, 0.8)' 
          : 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${mode === 'light' ? colors.neutral[200] : colors.neutral[700]}`,
        boxShadow: shadows.sm,
      },
    },
  },
});

// 🎨 Main Theme Factory
export const createModernTheme = (mode = 'light') => createTheme({
  ...createMode(mode),
  typography,
  spacing: (factor) => `${0.25 * factor}rem`,
  shape: {
    borderRadius: parseInt(borderRadius.lg),
  },
  transitions: {
    duration: animations.duration,
    easing: {
      easeInOut: animations.easeInOut,
      easeOut: animations.easeOut,
      easeIn: animations.easeIn,
      sharp: animations.sharp,
    },
  },
  components: components(mode),
  
  // Custom Properties
  custom: {
    colors,
    spacing,
    shadows,
    borderRadius,
    animations,
    glass: colors.glass,
  },
});

// 🎭 Export ready-to-use themes
export const lightTheme = createModernTheme('light');
export const darkTheme = createModernTheme('dark');

export default lightTheme;
