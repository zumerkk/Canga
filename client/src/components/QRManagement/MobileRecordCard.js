import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Edit,
  Visibility,
  AccessTime,
  LocationOn,
  Business,
  QrCode
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * 📱 Mobile Record Card
 * Mobil görünüm için kayıt kartı
 */

const MobileRecordCard = ({ 
  record, 
  expanded,
  onToggleExpand,
  onEdit,
  onViewSignature,
  selected,
  onSelect
}) => {
  const { employeeId, checkIn, checkOut, status, workDuration } = record;

  const getStatusColor = (status) => {
    switch (status) {
      case 'NORMAL': return 'success';
      case 'LATE': return 'warning';
      case 'EARLY_LEAVE': return 'warning';
      case 'INCOMPLETE': return 'error';
      case 'ABSENT': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'NORMAL': return 'Normal';
      case 'LATE': return 'Geç';
      case 'EARLY_LEAVE': return 'Erken Çıkış';
      case 'INCOMPLETE': return 'Eksik';
      case 'ABSENT': return 'Devamsız';
      default: return status || '-';
    }
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}dk`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        sx={{ 
          mb: 1.5,
          border: selected ? 2 : 0,
          borderColor: selected ? 'primary.main' : 'transparent',
          transition: 'all 0.2s'
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header */}
          <Box 
            display="flex" 
            alignItems="center" 
            gap={2}
            onClick={() => onSelect?.(record._id)}
            sx={{ cursor: 'pointer' }}
          >
            <Avatar 
              src={employeeId?.profilePhoto}
              sx={{ 
                width: 48, 
                height: 48,
                bgcolor: checkIn?.branch === 'IŞIL' ? 'secondary.main' : 'primary.main'
              }}
            >
              {employeeId?.adSoyad?.charAt(0) || '?'}
            </Avatar>

            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                {employeeId?.adSoyad || 'İsimsiz'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {employeeId?.pozisyon || '-'}
              </Typography>
            </Box>

            <Box textAlign="right">
              <Chip
                label={getStatusLabel(status)}
                color={getStatusColor(status)}
                size="small"
              />
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>

          {/* Quick Info */}
          <Box display="flex" gap={3} mt={2}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <AccessTime fontSize="small" color="success" />
              <Typography variant="body2">
                {formatTime(checkIn?.time)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <AccessTime fontSize="small" color="error" />
              <Typography variant="body2">
                {formatTime(checkOut?.time)}
              </Typography>
            </Box>
            {workDuration && (
              <Typography variant="body2" fontWeight="medium" color="primary">
                {formatDuration(workDuration)}
              </Typography>
            )}
          </Box>

          {/* Expanded Details */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" flexDirection="column" gap={1.5}>
              {/* Şube */}
              <Box display="flex" alignItems="center" gap={1}>
                <Business fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Şube:
                </Typography>
                <Chip
                  label={checkIn?.branch === 'IŞIL' ? '🏢 Işıl' : '🏭 Merkez'}
                  size="small"
                  variant="outlined"
                  color={checkIn?.branch === 'IŞIL' ? 'secondary' : 'primary'}
                />
              </Box>

              {/* Konum */}
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Konum:
                </Typography>
                <Typography variant="body2">
                  {checkIn?.coordinates 
                    ? `${checkIn.coordinates.lat?.toFixed(4)}, ${checkIn.coordinates.lng?.toFixed(4)}`
                    : 'GPS yok'
                  }
                </Typography>
              </Box>

              {/* Yöntem */}
              <Box display="flex" alignItems="center" gap={1}>
                <QrCode fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Yöntem:
                </Typography>
                <Chip
                  label={checkIn?.method === 'SIGNATURE' ? 'İmza' : checkIn?.method === 'QR' ? 'QR' : '-'}
                  size="small"
                  variant="outlined"
                />
              </Box>

              {/* Lokasyon */}
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  Lokasyon:
                </Typography>
                <Typography variant="body2">
                  {employeeId?.lokasyon || '-'}
                </Typography>
              </Box>

              {/* Actions */}
              <Box display="flex" gap={1} mt={1}>
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => onEdit?.(record)}
                  sx={{ bgcolor: 'primary.light', color: 'white' }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                {checkIn?.signature && (
                  <IconButton 
                    size="small"
                    onClick={() => onViewSignature?.(checkIn.signature)}
                    sx={{ bgcolor: 'info.light', color: 'white' }}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * 📱 Mobile Records List
 * Mobil kayıt listesi
 */
export const MobileRecordsList = ({ 
  records = [], 
  selectedIds = [],
  onSelect,
  onEdit,
  onViewSignature
}) => {
  const [expandedId, setExpandedId] = React.useState(null);

  if (records.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center"
        py={6}
        px={2}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          📭 Kayıt Bulunamadı
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Bugün için giriş-çıkış kaydı yok
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {records.map((record) => (
        <MobileRecordCard
          key={record._id}
          record={record}
          expanded={expandedId === record._id}
          onToggleExpand={() => setExpandedId(
            expandedId === record._id ? null : record._id
          )}
          selected={selectedIds.includes(record._id)}
          onSelect={onSelect}
          onEdit={onEdit}
          onViewSignature={onViewSignature}
        />
      ))}
    </Box>
  );
};

export default MobileRecordCard;
