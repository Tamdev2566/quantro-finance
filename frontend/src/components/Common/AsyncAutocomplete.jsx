import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { apiClient } from '../../api/client';

/**
 * AsyncAutocomplete
 * 
 * - Default: Fetches and displays only the top 5 latest records.
 * - On Type: Sends debounced query to backend autocomplete API to filter and fetch matching records.
 */
export default function AsyncAutocomplete({
  type,
  accountType,
  category,
  value,
  onChange,
  label,
  placeholder,
  required = false,
  error = false,
  helperText = '',
  size = 'small',
  disabled = false,
  fullWidth = true,
  extraOptions = [], // e.g. [{ id: '', label: 'Auto-allocate per items' }]
  limit = 5,
  searchLimit = 10,
  sx = {}
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(extraOptions);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const debounceTimer = useRef(null);
  const hasLoadedInitial = useRef(false);

  // Reset cache if target entity type or filter changes
  useEffect(() => {
    hasLoadedInitial.current = false;
    setOptions(extraOptions);
  }, [type, accountType, category]);

  // Helper to fetch data from backend API
  const fetchOptions = async (query = '') => {
    try {
      setLoading(true);
      const params = {
        type,
        q: query,
        limit: query ? searchLimit : limit
      };
      if (accountType) params.accountType = accountType;
      if (category) params.category = category;

      const res = await apiClient.autocomplete(params);
      const fetched = res.data || [];

      // Combine with extraOptions if applicable
      let combined = [...extraOptions];
      if (query) {
        // filter extra options by query
        combined = combined.filter((o) => (o.label || '').toLowerCase().includes(query.toLowerCase()));
      }
      // Deduplicate fetched by id
      const existingIds = new Set(combined.map((o) => String(o.id ?? '')));
      fetched.forEach((item) => {
        const idStr = String(item.id ?? item.code ?? '');
        if (!existingIds.has(idStr)) {
          combined.push(item);
          existingIds.add(idStr);
        }
      });

      setOptions(combined);
    } catch (err) {
      console.error(`Failed to autocomplete ${type}:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Only resolve specific value if passed initially in edit mode (not a blank/new form)
  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      const exists = options.some((o) => (o.id ?? o.code) === value);
      if (!exists) {
        // Fetch specific value to ensure display label
        fetchOptions(String(value));
      }
    }
  }, [value]);

  // Handle typing with debounced API call ("enter panna")
  const handleInputChange = (event, newInputValue, reason) => {
    setInputValue(newInputValue);
    if (reason === 'input') {
      hasLoadedInitial.current = true;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        fetchOptions(newInputValue.trim());
      }, 250);
    } else if (reason === 'clear') {
      fetchOptions('');
    }
  };

  // Resolve selected option object from value
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null) return null;
    return options.find((o) => (o.id ?? o.code) === value) || null;
  }, [options, value]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => {
        setOpen(true);
        // Only fetch when user explicitly opens/selects the dropdown
        if (!hasLoadedInitial.current) {
          hasLoadedInitial.current = true;
          fetchOptions(inputValue.trim());
        }
      }}
      onClose={() => setOpen(false)}
      fullWidth={fullWidth}
      size={size}
      disabled={disabled}
      options={options}
      loading={loading}
      value={selectedOption}
      onChange={(event, newValue) => {
        const val = newValue ? (newValue.id ?? newValue.code) : '';
        if (onChange) {
          onChange(val, newValue);
        }
      }}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      getOptionLabel={(option) => {
        if (!option) return '';
        if (typeof option === 'string') return option;
        return option.label || option.name || String(option.id || '');
      }}
      isOptionEqualToValue={(option, val) => {
        if (!val) return false;
        const optKey = option.id ?? option.code;
        const valKey = typeof val === 'object' ? (val.id ?? val.code) : val;
        return String(optKey) === String(valKey);
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id ?? option.code ?? option.label}>
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
              {option.label || option.name}
            </Typography>
            {option.category && (
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {option.type ? `${option.type} • ` : ''}{option.category}
              </Typography>
            )}
            {option.gstin && (
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                GSTIN: {option.gstin}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder || (loading ? 'Searching...' : 'Type to search or select...')}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '4px'
        },
        ...sx
      }}
    />
  );
}
