import React, { useState } from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  Box, 
  Typography, 
  useTheme, 
  alpha,
  Fade 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// 🎨 Modern Input Component with Advanced Features
const ModernInput = React.forwardRef(({
  label,
  helperText,
  error,
  success,
  variant = 'glass', // glass, solid, outlined, floating
  size = 'medium', // small, medium, large
  type = 'text',
  startIcon,
  endIcon,
  loading = false,
  showPasswordToggle = false,
  characterCount = false,
  maxLength,
  sx = {},
  ...props
}, ref) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(props.value || props.defaultValue || '');

  // Handle value changes for character count
  const handleChange = (e) => {
    setValue(e.target.value);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  // Size Configurations
  const sizes = {
    small: {
      '& .MuiInputBase-root': {
        height: 40,
        fontSize: '0.875rem',
      },
      '& .MuiInputLabel-root': {
        fontSize: '0.875rem',
      },
    },
    medium: {
      '& .MuiInputBase-root': {
        height: 48,
        fontSize: '1rem',
      },
    },
    large: {
      '& .MuiInputBase-root': {
        height: 56,
        fontSize: '1.125rem',
      },
      '& .MuiInputLabel-root': {
        fontSize: '1.125rem',
      },
    }
  };

  // Variant Styles
  const variants = {
    glass: {
      '& .MuiOutlinedInput-root': {
        background: isDark 
          ? 'rgba(15, 23, 42, 0.4)' 
          : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        
        '&:hover': {
          background: isDark 
            ? 'rgba(15, 23, 42, 0.6)' 
            : 'rgba(255, 255, 255, 0.8)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          borderColor: theme.palette.primary.main,
        },
        
        '&.Mui-focused': {
          background: isDark 
            ? 'rgba(15, 23, 42, 0.8)' 
            : 'rgba(255, 255, 255, 0.9)',
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.25)}`,
          borderColor: theme.palette.primary.main,
          borderWidth: '2px',
        },
        
        '& fieldset': {
          border: 'none',
        },
      },
    },
    solid: {
      '& .MuiOutlinedInput-root': {
        background: theme.palette.background.paper,
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: theme.shadows[2],
        },
        
        '&.Mui-focused': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      },
    },
    outlined: {
      '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        
        '&:hover': {
          transform: 'translateY(-1px)',
          '& fieldset': {
            borderColor: theme.palette.primary.main,
            borderWidth: '2px',
          },
        },
        
        '&.Mui-focused': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      },
    },
    floating: {
      '& .MuiOutlinedInput-root': {
        background: 'transparent',
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: `2px solid ${theme.palette.divider}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        
        '&:hover': {
          borderBottomColor: theme.palette.primary.main,
        },
        
        '&.Mui-focused': {
          borderBottomColor: theme.palette.primary.main,
          borderBottomWidth: '3px',
        },
        
        '& fieldset': {
          border: 'none',
        },
      },
    },
  };

  // State-based Styles
  const stateStyles = {
    ...(error && {
      '& .MuiOutlinedInput-root': {
        borderColor: theme.palette.error.main,
        '&:hover': {
          borderColor: theme.palette.error.main,
        },
        '&.Mui-focused': {
          boxShadow: `0 8px 32px ${alpha(theme.palette.error.main, 0.25)}`,
        },
      },
    }),
    ...(success && {
      '& .MuiOutlinedInput-root': {
        borderColor: theme.palette.success.main,
        '&:hover': {
          borderColor: theme.palette.success.main,
        },
        '&.Mui-focused': {
          boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.25)}`,
        },
      },
    }),
  };

  // Loading Spinner
  const LoadingSpinner = () => (
    <Box
      sx={{
        width: 16,
        height: 16,
        border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        borderTopColor: theme.palette.primary.main,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }}
    />
  );

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        ref={ref}
        {...props}
        type={showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={handleChange}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        label={label}
        error={error}
        helperText={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{helperText}</span>
            {characterCount && maxLength && (
              <Typography 
                variant="caption" 
                color={value.length > maxLength ? 'error' : 'text.secondary'}
                sx={{ ml: 1 }}
              >
                {value.length}/{maxLength}
              </Typography>
            )}
          </Box>
        }
        InputProps={{
          startAdornment: (startIcon || loading) && (
            <InputAdornment position="start">
              {loading ? <LoadingSpinner /> : startIcon}
            </InputAdornment>
          ),
          endAdornment: (endIcon || showPasswordToggle) && (
            <InputAdornment position="end">
              {showPasswordToggle && type === 'password' ? (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ) : endIcon}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&.Mui-focused': {
              color: theme.palette.primary.main,
            },
          },
          ...sizes[size],
          ...variants[variant],
          ...stateStyles,
          ...sx,
        }}
      />
      
    </Box>
  );
});

ModernInput.displayName = 'ModernInput';

export default ModernInput;
