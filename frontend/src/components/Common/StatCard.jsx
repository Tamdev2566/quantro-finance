import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function StatCard({ title, value, subtitle, icon: Icon, color = '#2563eb', prefix = '₹' }) {
  const formattedValue = typeof value === 'number'
    ? `${prefix} ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : value;

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          {Icon && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                backgroundColor: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color
              }}
            >
              <Icon fontSize="small" />
            </Box>
          )}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          {formattedValue || '₹ 0.00'}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
