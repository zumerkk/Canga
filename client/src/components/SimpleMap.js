import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

const MERKEZ_OFIS = {
  lat: 39.81408397827491,
  lng: 33.48881297116444
};

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px'
};

// Libraries array'i component dışında tanımla - performans uyarısını önler
const libraries = ['places'];

const SimpleMap = ({ coordinates }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyDmDU8hhepLo1rMemJdfdJoIN4XnFF6PuU",
    libraries: libraries
  });

  if (loadError) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Harita yüklenemedi</Typography>
        <Typography variant="caption" color="text.secondary">
          API key hatası veya bağlantı problemi
        </Typography>
      </Paper>
    );
  }

  if (!isLoaded) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Harita yükleniyor...</Typography>
      </Paper>
    );
  }

  const center = coordinates && coordinates.latitude && coordinates.longitude
    ? { lat: parseFloat(coordinates.latitude), lng: parseFloat(coordinates.longitude) }
    : MERKEZ_OFIS;

  return (
    <Box sx={{ width: '100%', height: '400px' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true
        }}
      >
        {/* Personel Konumu */}
        {coordinates && coordinates.latitude && coordinates.longitude && (
          <Marker
            position={{ 
              lat: parseFloat(coordinates.latitude), 
              lng: parseFloat(coordinates.longitude) 
            }}
            label="Personel"
          />
        )}
        
        {/* Merkez Ofis */}
        <Marker
          position={MERKEZ_OFIS}
          label="Merkez"
        />
      </GoogleMap>
    </Box>
  );
};

export default SimpleMap;
