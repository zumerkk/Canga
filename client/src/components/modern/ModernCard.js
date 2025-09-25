import React from 'react';
import { Card, useTheme } from '@mui/material';

// 🎨 Modern Card Component with Glassmorphism
const ModernCard = React.forwardRef(({
  children,
  variant = 'glass', // glass, solid, gradient, neumorphic
  elevation = 'medium', // low, medium, high, floating
  hover = true,
  glow = false,
  gradient,
  sx = {},
  ...props
}, ref) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Variant Styles
  const variants = {
    glass: {
      background: isDark 
        ? 'rgba(15, 23, 42, 0.4)' 
        : 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      boxShadow: isDark
        ? '0 8px 32px rgba(0, 0, 0, 0.3)'
        : '0 8px 32px rgba(0, 0, 0, 0.1)',
    },
    solid: {
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: theme.shadows[2],
    },
    gradient: {
      background: gradient || `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${theme.palette.primary.main}30`,
      boxShadow: `0 8px 32px ${theme.palette.primary.main}20`,
    },
    neumorphic: {
      background: theme.palette.background.paper,
      boxShadow: isDark
        ? 'inset 5px 5px 10px rgba(0, 0, 0, 0.2), inset -5px -5px 10px rgba(255, 255, 255, 0.05)'
        : 'inset 5px 5px 10px rgba(0, 0, 0, 0.1), inset -5px -5px 10px rgba(255, 255, 255, 0.8)',
      border: 'none',
    }
  };

  // Elevation Styles
  const elevations = {
    low: '0 2px 8px rgba(0, 0, 0, 0.1)',
    medium: '0 8px 24px rgba(0, 0, 0, 0.15)',
    high: '0 16px 48px rgba(0, 0, 0, 0.2)',
    floating: '0 24px 64px rgba(0, 0, 0, 0.25)',
  };

  // Glow Effect
  const glowStyles = glow ? {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      borderRadius: 'inherit',
      zIndex: -1,
      filter: 'blur(8px)',
      opacity: 0.6,
    }
  } : {};

  // Hover Animations
  const hoverStyles = hover ? {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px) scale(1.02)',
      boxShadow: elevations.floating,
      ...glow && {
        '&::before': {
          filter: 'blur(12px)',
          opacity: 0.8,
        }
      }
    }
  } : {};

  return (
    <Card
      ref={ref}
      {...props}
      sx={{
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        ...variants[variant],
        boxShadow: elevations[elevation],
        ...glowStyles,
        ...hoverStyles,
        ...sx
      }}
    >
      {children}
    </Card>
  );
});

ModernCard.displayName = 'ModernCard';

export default ModernCard;
