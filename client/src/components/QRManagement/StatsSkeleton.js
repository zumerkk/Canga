import React from 'react';
import { Box, Card, CardContent, Grid, Skeleton } from '@mui/material';

/**
 * 💀 Stats Skeleton
 * İstatistik kartları için loading placeholder
 */

const StatsSkeleton = ({ count = 5 }) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
              height: '100%'
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box flex={1}>
                  <Skeleton 
                    variant="text" 
                    width="60%" 
                    height={20} 
                    sx={{ mb: 1 }} 
                  />
                  <Skeleton 
                    variant="text" 
                    width="40%" 
                    height={48} 
                    sx={{ mb: 0.5 }} 
                  />
                  <Skeleton 
                    variant="text" 
                    width="50%" 
                    height={16} 
                  />
                </Box>
                <Skeleton 
                  variant="circular" 
                  width={60} 
                  height={60} 
                  sx={{ opacity: 0.3 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

/**
 * 💀 Table Skeleton
 * Tablo için loading placeholder
 */
export const TableSkeleton = ({ rows = 10, columns = 8 }) => {
  return (
    <Box>
      {/* Header */}
      <Box 
        display="flex" 
        gap={2} 
        p={2} 
        bgcolor="grey.100" 
        borderRadius="8px 8px 0 0"
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100/columns}%`} height={24} />
        ))}
      </Box>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box 
          key={rowIndex}
          display="flex" 
          gap={2} 
          p={2}
          borderBottom="1px solid"
          borderColor="grey.200"
        >
          {/* Avatar cell */}
          <Box display="flex" alignItems="center" gap={1} width={`${100/columns}%`}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box flex={1}>
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="60%" height={16} />
            </Box>
          </Box>

          {/* Other cells */}
          {Array.from({ length: columns - 1 }).map((_, i) => (
            <Box key={i} width={`${100/columns}%`}>
              <Skeleton variant="text" width="70%" height={20} />
              {i < 3 && <Skeleton variant="text" width="50%" height={16} />}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

/**
 * 💀 Full Page Skeleton
 * Tam sayfa loading
 */
export const FullPageSkeleton = () => {
  return (
    <Box p={4}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="text" width={200} height={20} />
        </Box>
        <Box display="flex" gap={2}>
          <Skeleton variant="rounded" width={100} height={40} />
          <Skeleton variant="rounded" width={150} height={40} />
        </Box>
      </Box>

      {/* Tabs */}
      <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 3 }} />

      {/* Stats Cards */}
      <StatsSkeleton count={5} />

      {/* Filter Bar */}
      <Skeleton 
        variant="rounded" 
        width="100%" 
        height={80} 
        sx={{ my: 3 }} 
      />

      {/* Table */}
      <TableSkeleton rows={8} columns={8} />
    </Box>
  );
};

/**
 * 💀 Card Skeleton
 * Tekil kart loading
 */
export const CardSkeleton = ({ height = 200 }) => {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={height - 80} />
        <Box display="flex" gap={1} mt={2}>
          <Skeleton variant="rounded" width={80} height={32} />
          <Skeleton variant="rounded" width={80} height={32} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsSkeleton;
