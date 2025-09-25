import React from 'react';
import { Button, useTheme, alpha } from '@mui/material';

// 🎨 Modern Button Component with Advanced Interactions
const ModernButton = React.forwardRef(({
  children,
  variant = 'primary', // primary, secondary, ghost, gradient, glass, outlined
  size = 'medium', // small, medium, large, xl
  glow = false,
  ripple = true,
  loading = false,
  iconPosition = 'left', // left, right, only
  gradient,
  sx = {},
  ...props
}, ref) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Size Configurations
  const sizes = {
    small: {
      height: 36,
      px: 3,
      fontSize: '0.875rem',
      borderRadius: 2,
    },
    medium: {
      height: 44,
      px: 4,
      fontSize: '0.875rem',
      borderRadius: 2.5,
    },
    large: {
      height: 52,
      px: 5,
      fontSize: '1rem',
      borderRadius: 3,
    },
    xl: {
      height: 60,
      px: 6,
      fontSize: '1.125rem',
      borderRadius: 3,
    }
  };

  // Variant Styles
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
      color: theme.palette.primary.contrastText,
      border: 'none',
      boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
      '&:hover': {
        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
        transform: 'translateY(-2px)',
      },
    },
    secondary: {
      background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
      color: theme.palette.secondary.contrastText,
      border: 'none',
      boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.3)}`,
      '&:hover': {
        background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
        boxShadow: `0 8px 32px ${alpha(theme.palette.secondary.main, 0.4)}`,
        transform: 'translateY(-2px)',
      },
    },
    ghost: {
      background: 'transparent',
      color: theme.palette.primary.main,
      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      '&:hover': {
        background: alpha(theme.palette.primary.main, 0.05),
        borderColor: theme.palette.primary.main,
        transform: 'translateY(-1px)',
      },
    },
    outlined: {
      background: 'transparent',
      color: theme.palette.primary.main,
      border: `2px solid ${theme.palette.primary.main}`,
      '&:hover': {
        background: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
      },
    },
    gradient: {
      background: gradient || `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      color: 'white',
      border: 'none',
      boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        transition: 'left 0.6s ease',
      },
      '&:hover::before': {
        left: '100%',
      },
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
      },
    },
    glass: {
      background: isDark 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(20px)',
      color: isDark ? 'white' : theme.palette.text.primary,
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
      '&:hover': {
        background: isDark 
          ? 'rgba(255, 255, 255, 0.2)' 
          : 'rgba(255, 255, 255, 0.3)',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      },
    },
  };

  // Glow Effect
  const glowStyles = glow ? {
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: -4,
      left: -4,
      right: -4,
      bottom: -4,
      background: variants[variant]?.background || theme.palette.primary.main,
      borderRadius: 'inherit',
      zIndex: -1,
      filter: 'blur(12px)',
      opacity: 0.4,
      transition: 'opacity 0.3s ease',
    },
    '&:hover::after': {
      opacity: 0.6,
      filter: 'blur(16px)',
    }
  } : {};

  // Loading Styles
  const loadingStyles = loading ? {
    position: 'relative',
    color: 'transparent',
    '&::after': {
      content: '""',
      position: 'absolute',
      width: 20,
      height: 20,
      top: '50%',
      left: '50%',
      marginLeft: -10,
      marginTop: -10,
      border: `2px solid ${alpha(theme.palette.common.white, 0.2)}`,
      borderTopColor: theme.palette.common.white,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    }
  } : {};

  return (
    <Button
      ref={ref}
      disabled={loading}
      {...props}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...sizes[size],
        ...variants[variant],
        ...glowStyles,
        ...loadingStyles,
        
        // Ripple Effect
        ...ripple && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 0,
            height: 0,
            borderRadius: '50%',
            background: alpha(theme.palette.common.white, 0.3),
            transform: 'translate(-50%, -50%)',
            transition: 'width 0.6s, height 0.6s',
          },
          '&:active::before': {
            width: '300px',
            height: '300px',
            transition: 'width 0s, height 0s',
          },
        },
        
        // Disabled State
        '&.Mui-disabled': {
          opacity: 0.6,
          transform: 'none',
          cursor: 'not-allowed',
        },
        
        ...sx
      }}
    >
      {loading ? '' : children}
    </Button>
  );
});

ModernButton.displayName = 'ModernButton';

export default ModernButton;
