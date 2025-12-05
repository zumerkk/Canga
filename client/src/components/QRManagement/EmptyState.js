import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import {
  CalendarToday,
  Search,
  FilterList,
  Add,
  Refresh,
  CloudOff,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * 📭 Empty State Component
 * Veri olmadığında gösterilecek placeholder
 */

const EMPTY_STATE_TYPES = {
  NO_DATA: {
    icon: CalendarToday,
    title: 'Kayıt Bulunamadı',
    description: 'Bugün henüz giriş-çıkış kaydı yok.',
    color: 'text.secondary'
  },
  NO_RESULTS: {
    icon: Search,
    title: 'Sonuç Bulunamadı',
    description: 'Arama kriterlerinize uygun kayıt bulunamadı.',
    color: 'warning.main'
  },
  FILTER_EMPTY: {
    icon: FilterList,
    title: 'Filtre Sonucu Boş',
    description: 'Seçili filtrelere uygun kayıt yok. Filtreleri değiştirmeyi deneyin.',
    color: 'info.main'
  },
  OFFLINE: {
    icon: CloudOff,
    title: 'Çevrimdışı',
    description: 'İnternet bağlantısı yok. Veriler senkronize edilemiyor.',
    color: 'error.main'
  },
  ERROR: {
    icon: ErrorIcon,
    title: 'Hata Oluştu',
    description: 'Veriler yüklenirken bir hata oluştu.',
    color: 'error.main'
  }
};

const EmptyState = ({
  type = 'NO_DATA',
  title,
  description,
  icon: CustomIcon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  minHeight = 400
}) => {
  const config = EMPTY_STATE_TYPES[type] || EMPTY_STATE_TYPES.NO_DATA;
  const Icon = CustomIcon || config.icon;

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        bgcolor: 'grey.50',
        borderRadius: 3,
        border: '2px dashed',
        borderColor: 'grey.200'
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            boxShadow: 1
          }}
        >
          <Icon sx={{ fontSize: 60, color: config.color, opacity: 0.5 }} />
        </Box>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
          {title || config.title}
        </Typography>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Typography 
          variant="body1" 
          color="text.secondary" 
          textAlign="center"
          maxWidth={400}
          mb={3}
        >
          {description || config.description}
        </Typography>
      </motion.div>

      {(actionLabel || secondaryActionLabel) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Box display="flex" gap={2}>
            {actionLabel && (
              <Button
                variant="contained"
                onClick={onAction}
                startIcon={type === 'ERROR' || type === 'OFFLINE' ? <Refresh /> : <Add />}
              >
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && (
              <Button
                variant="outlined"
                onClick={onSecondaryAction}
              >
                {secondaryActionLabel}
              </Button>
            )}
          </Box>
        </motion.div>
      )}
    </Paper>
  );
};

/**
 * 📭 Inline Empty State
 * Tablo içi küçük boş durum
 */
export const InlineEmptyState = ({ message = 'Kayıt yok', icon: Icon = CalendarToday }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={6}
      color="text.secondary"
    >
      <Icon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
};

/**
 * 📭 Compact Empty State
 * Kompakt boş durum kartı
 */
export const CompactEmptyState = ({ 
  title, 
  description, 
  icon: Icon = CalendarToday,
  action
}) => {
  return (
    <Box
      sx={{
        p: 3,
        textAlign: 'center',
        bgcolor: 'grey.50',
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'grey.300'
      }}
    >
      <Icon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" mb={action ? 2 : 0}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
};

export default EmptyState;
