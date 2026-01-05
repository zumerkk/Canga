import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Fade,
  Zoom,
  Backdrop
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🎯 Enterprise Popup Modal Component
 * 24 saatte bir gösterilen popup için profesyonel animasyonlu modal
 */

const PopupModal = ({ open, onClose, imageUrl }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    // Animasyon tamamlanana kadar bekle
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
              position: 'relative'
            }
          }}
          BackdropComponent={({ ...props }) => (
            <Backdrop
              {...props}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Fade in={props.open} timeout={400}>
                <Box />
              </Fade>
            </Backdrop>
          )}
          TransitionComponent={Zoom}
          TransitionProps={{
            timeout: 400,
            style: {
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }
          }}
        >
          <DialogContent
            sx={{
              p: 0,
              position: 'relative',
              '&.MuiDialogContent-root': {
                padding: 0
              }
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={handleClose}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                width: 48,
                height: 48,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  transform: 'scale(1.1) rotate(90deg)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                }
              }}
            >
              <CloseIcon sx={{ fontSize: 24, color: '#333' }} />
            </IconButton>

            {/* Image Container with Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: isClosing ? 0 : 1, 
                scale: isClosing ? 0.9 : 1 
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <motion.img
                  src={imageUrl}
                  alt="Çanga Savunma Endüstrisi"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: isClosing ? 0 : 1, 
                    y: isClosing ? 20 : 0 
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                />
                
                {/* Decorative gradient overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 100%)',
                    pointerEvents: 'none'
                  }}
                />
              </Box>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default PopupModal;

