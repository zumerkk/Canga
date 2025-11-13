import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  TableChart,
  Description
} from '@mui/icons-material';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportUtils';

/**
 * 📥 EXPORT BUTONLARI
 * PDF, Excel, CSV export menüsü
 */

const ExportButtons = ({ records = [], title = 'Puantaj Raporu' }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (type) => {
    try {
      setLoading(true);
      
      switch (type) {
        case 'pdf':
          exportToPDF(records, title);
          break;
        case 'excel':
          exportToExcel(records, title);
          break;
        case 'csv':
          exportToCSV(records, title);
          break;
        default:
          break;
      }
      
      handleClose();
    } catch (error) {
      console.error('Export hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Download />}
        onClick={handleClick}
        disabled={loading || records.length === 0}
      >
        Rapor İndir
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>PDF Olarak İndir</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon>
            <TableChart fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Excel Olarak İndir</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon>
            <Description fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>CSV Olarak İndir</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ExportButtons;

