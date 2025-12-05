import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Slider,
  FormControlLabel,
  Checkbox,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Clear,
  Save,
  BookmarkBorder,
  Bookmark
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { savePreference, getPreference } from '../../utils/indexedDB';

/**
 * 🔍 Advanced Filters Panel
 * Gelişmiş filtreleme seçenekleri
 */

const PRESET_FILTERS = [
  { id: 'late', label: '⏰ Geç Kalanlar', filter: { status: 'LATE' } },
  { id: 'incomplete', label: '⚠️ Eksik Kayıt', filter: { hasIncomplete: true } },
  { id: 'noGPS', label: '📍 GPS Yok', filter: { noLocation: true } },
  { id: 'overtime', label: '💪 Fazla Mesai', filter: { hasOvertime: true } },
  { id: 'absent', label: '❌ Devamsız', filter: { status: 'ABSENT' } },
  { id: 'earlyLeave', label: '🏃 Erken Çıkış', filter: { status: 'EARLY_LEAVE' } }
];

const DEPARTMENTS = [
  'TORNA GRUBU',
  'FREZE GRUBU',
  'TESTERE',
  'KAYNAK',
  'MONTAJ',
  'İDARİ BİRİM',
  'TEKNİK OFİS',
  'KALİTE KONTROL',
  'BAKIM VE ONARIM',
  'PLANLAMA',
  'DEPO',
  'AR-GE',
  'BİLGİ İŞLEM'
];

const STATUS_OPTIONS = [
  { value: 'NORMAL', label: 'Normal', color: 'success' },
  { value: 'LATE', label: 'Geç Geldi', color: 'warning' },
  { value: 'EARLY_LEAVE', label: 'Erken Çıktı', color: 'warning' },
  { value: 'ABSENT', label: 'Devamsız', color: 'error' },
  { value: 'INCOMPLETE', label: 'Eksik Kayıt', color: 'info' },
  { value: 'LEAVE', label: 'İzinli', color: 'default' }
];

const AdvancedFiltersPanel = ({ 
  filters, 
  onFiltersChange, 
  onClear,
  expanded = false,
  onExpandChange
}) => {
  const [localFilters, setLocalFilters] = useState({
    dateFrom: null,
    dateTo: null,
    departments: [],
    locations: [],
    branches: [],
    statuses: [],
    minWorkHours: 0,
    maxWorkHours: 12,
    hasOvertime: false,
    noLocation: false,
    hasIncomplete: false,
    search: '',
    ...filters
  });

  const [savedFilters, setSavedFilters] = useState([]);
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Kaydedilmiş filtreleri yükle
  useEffect(() => {
    const loadSavedFilters = async () => {
      const saved = await getPreference('savedFilters', []);
      setSavedFilters(saved);
    };
    loadSavedFilters();
  }, []);

  // Filtre değişikliği
  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Çoklu seçim toggle
  const handleMultiSelectToggle = (field, value) => {
    const current = localFilters[field] || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    handleFilterChange(field, newValue);
  };

  // Preset filtre uygula
  const applyPreset = (preset) => {
    const newFilters = { ...localFilters, ...preset.filter };
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Filtreleri temizle
  const clearFilters = () => {
    const emptyFilters = {
      dateFrom: null,
      dateTo: null,
      departments: [],
      locations: [],
      branches: [],
      statuses: [],
      minWorkHours: 0,
      maxWorkHours: 12,
      hasOvertime: false,
      noLocation: false,
      hasIncomplete: false,
      search: ''
    };
    setLocalFilters(emptyFilters);
    onFiltersChange?.(emptyFilters);
    onClear?.();
  };

  // Filtreyi kaydet
  const saveCurrentFilter = async () => {
    const filterName = prompt('Filtre adını girin:');
    if (!filterName) return;

    const newSaved = [...savedFilters, { name: filterName, filter: localFilters }];
    setSavedFilters(newSaved);
    await savePreference('savedFilters', newSaved);
  };

  // Kaydedilmiş filtreyi uygula
  const applySavedFilter = (saved) => {
    setLocalFilters(saved.filter);
    onFiltersChange?.(saved.filter);
  };

  // Kaydedilmiş filtreyi sil
  const deleteSavedFilter = async (index) => {
    const newSaved = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(newSaved);
    await savePreference('savedFilters', newSaved);
  };

  // Aktif filtre sayısı
  const activeFilterCount = Object.entries(localFilters).filter(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    if (key === 'minWorkHours' && value > 0) return true;
    if (key === 'maxWorkHours' && value < 12) return true;
    if (value && key !== 'search') return true;
    return false;
  }).length;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Accordion 
        expanded={isExpanded} 
        onChange={(e, exp) => {
          setIsExpanded(exp);
          onExpandChange?.(exp);
        }}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1} width="100%">
            <FilterList color="primary" />
            <Typography fontWeight="medium">Gelişmiş Filtreler</Typography>
            {activeFilterCount > 0 && (
              <Chip 
                label={`${activeFilterCount} aktif`} 
                size="small" 
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          {/* Preset Filtreler */}
          <Box mb={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Hızlı Filtreler
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {PRESET_FILTERS.map(preset => (
                <Chip
                  key={preset.id}
                  label={preset.label}
                  onClick={() => applyPreset(preset)}
                  variant="outlined"
                  clickable
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            {/* Tarih Aralığı */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tarih Aralığı
              </Typography>
              <Box display="flex" gap={2}>
                <DatePicker
                  label="Başlangıç"
                  value={localFilters.dateFrom}
                  onChange={(date) => handleFilterChange('dateFrom', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <DatePicker
                  label="Bitiş"
                  value={localFilters.dateTo}
                  onChange={(date) => handleFilterChange('dateTo', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Box>
            </Grid>

            {/* Departman */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Departman
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {DEPARTMENTS.slice(0, 8).map(dept => (
                  <Chip
                    key={dept}
                    label={dept}
                    size="small"
                    onClick={() => handleMultiSelectToggle('departments', dept)}
                    color={localFilters.departments?.includes(dept) ? 'primary' : 'default'}
                    variant={localFilters.departments?.includes(dept) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>

            {/* Lokasyon */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Lokasyon
              </Typography>
              <Box display="flex" gap={1}>
                {['MERKEZ', 'İŞIL', 'OSB'].map(loc => (
                  <Chip
                    key={loc}
                    label={loc}
                    size="small"
                    onClick={() => handleMultiSelectToggle('locations', loc)}
                    color={localFilters.locations?.includes(loc) ? 'primary' : 'default'}
                    variant={localFilters.locations?.includes(loc) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>

            {/* Şube */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Giriş Şubesi
              </Typography>
              <Box display="flex" gap={1}>
                {['MERKEZ', 'IŞIL'].map(branch => (
                  <Chip
                    key={branch}
                    label={branch === 'MERKEZ' ? '🏭 Merkez' : '🏢 Işıl'}
                    size="small"
                    onClick={() => handleMultiSelectToggle('branches', branch)}
                    color={localFilters.branches?.includes(branch) ? (branch === 'MERKEZ' ? 'primary' : 'secondary') : 'default'}
                    variant={localFilters.branches?.includes(branch) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>

            {/* Durum */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Durum
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {STATUS_OPTIONS.map(status => (
                  <Chip
                    key={status.value}
                    label={status.label}
                    size="small"
                    onClick={() => handleMultiSelectToggle('statuses', status.value)}
                    color={localFilters.statuses?.includes(status.value) ? status.color : 'default'}
                    variant={localFilters.statuses?.includes(status.value) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>

            {/* Çalışma Süresi */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Çalışma Süresi (Saat)
              </Typography>
              <Box px={2}>
                <Slider
                  value={[localFilters.minWorkHours, localFilters.maxWorkHours]}
                  onChange={(e, value) => {
                    handleFilterChange('minWorkHours', value[0]);
                    handleFilterChange('maxWorkHours', value[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={16}
                  marks={[
                    { value: 0, label: '0s' },
                    { value: 8, label: '8s' },
                    { value: 12, label: '12s' },
                    { value: 16, label: '16s' }
                  ]}
                />
              </Box>
            </Grid>

            {/* Boolean Filtreler */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Özel Filtreler
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localFilters.hasOvertime}
                      onChange={(e) => handleFilterChange('hasOvertime', e.target.checked)}
                      size="small"
                    />
                  }
                  label="Fazla mesai var"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localFilters.noLocation}
                      onChange={(e) => handleFilterChange('noLocation', e.target.checked)}
                      size="small"
                    />
                  }
                  label="GPS yok"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localFilters.hasIncomplete}
                      onChange={(e) => handleFilterChange('hasIncomplete', e.target.checked)}
                      size="small"
                    />
                  }
                  label="Düzeltme gerekli"
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Kaydedilmiş Filtreler */}
          {savedFilters.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Kaydedilmiş Filtreler
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {savedFilters.map((saved, index) => (
                  <Chip
                    key={index}
                    icon={<Bookmark fontSize="small" />}
                    label={saved.name}
                    onClick={() => applySavedFilter(saved)}
                    onDelete={() => deleteSavedFilter(index)}
                    variant="outlined"
                    color="secondary"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Aksiyonlar */}
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button
              startIcon={<Clear />}
              onClick={clearFilters}
              color="inherit"
            >
              Temizle
            </Button>
            <Button
              startIcon={<BookmarkBorder />}
              onClick={saveCurrentFilter}
              variant="outlined"
            >
              Filtreyi Kaydet
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </LocalizationProvider>
  );
};

export default AdvancedFiltersPanel;
