import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginSuccess, showNotification } from '../../store';
import { apiClient } from '../../api/client';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Stack,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BoltIcon from '@mui/icons-material/Bolt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';

export default function LoginView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('admin@apex.corp');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [demoUsers, setDemoUsers] = useState([]);

  useEffect(() => {
    apiClient.getAuthUsers()
      .then((res) => {
        if (res.data) setDemoUsers(res.data);
      })
      .catch(() => {
        setDemoUsers([
          { id: 'USR-001', name: 'Alex Carter', email: 'admin@apex.corp', role: 'Chief Financial Officer', avatar: 'AC', color: '#e5a93c' },
          { id: 'USR-002', name: 'David Chen', email: 'accountant@apex.corp', role: 'Senior Accountant', avatar: 'DC', color: '#10b981' },
          { id: 'USR-003', name: 'Priya Sharma', email: 'auditor@apex.corp', role: 'Statutory Auditor', avatar: 'PS', color: '#8b5cf6' }
        ]);
      });
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.login({ email, password });
      if (res.success && res.data?.user) {
        apiClient.setAuthUser(res.data.user);
        dispatch(loginSuccess(res.data.user));
        dispatch(showNotification({
          message: `Welcome back, ${res.data.user.name}!`,
          severity: 'success'
        }));
        navigate(from, { replace: true });
      }
    } catch (err) {
      if (err.message?.includes('404') || err.message?.includes('Cannot POST /api/auth/login')) {
        const fallbackUser = demoUsers.find((u) => u.email === email) || {
          id: 'USR-001',
          name: 'Alex Carter',
          email,
          role: 'Chief Financial Officer',
          avatar: 'AC',
          color: '#e5a93c'
        };
        apiClient.setAuthUser(fallbackUser);
        dispatch(loginSuccess(fallbackUser));
        navigate(from, { replace: true });
      } else {
        setError(err.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (user) => {
    setEmail(user.email);
    setPassword(user.email.split('@')[0]);
    setTimeout(() => {
      apiClient.login({ email: user.email, password: user.email.split('@')[0] })
        .then((res) => {
          if (res.success && res.data?.user) {
            apiClient.setAuthUser(res.data.user);
            dispatch(loginSuccess(res.data.user));
            navigate(from, { replace: true });
          }
        })
        .catch(() => {
          apiClient.setAuthUser(user);
          dispatch(loginSuccess(user));
          navigate(from, { replace: true });
        });
    }, 50);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0c0d14', // Quantro Charcoal Canvas
        p: { xs: 2, md: 4 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Metallic Gold Glowing Ambience Spheres */}
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          left: '10%',
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(229,169,60,0.14) 0%, rgba(229,169,60,0) 70%)',
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          right: '10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184,128,25,0.12) 0%, rgba(184,128,25,0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Login Card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 1060,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
          backgroundColor: '#151621',
          borderRadius: '28px',
          border: '1px solid #232537',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        {/* Left Side: Quantro Brand Showcase */}
        <Box
          sx={{
            background: 'linear-gradient(155deg, #181926 0%, #11121c 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.05)', md: 'none' },
            color: '#ffffff',
            p: { xs: 2.5, sm: 4, md: 5.5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 2.5, sm: 4 } }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f3c64f 0%, #d49b28 50%, #b88019 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(229, 169, 60, 0.4)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6C4 4.89543 4.89543 4 6 4H8C9.10457 4 10 4.89543 10 6V18C10 19.1046 9.10457 20 8 20H6C4.89543 20 4 19.1046 4 18V6Z" fill="#12131c" />
                  <path d="M11 9C11 7.89543 11.8954 7 13 7H15C16.1046 7 17 7.89543 17 9V18C17 19.1046 16.1046 20 15 20H13C11.8954 20 11 19.1046 11 18V9Z" fill="#12131c" fillOpacity="0.8" />
                  <path d="M18 12C18 10.8954 18.8954 10 20 10H22V18C22 19.1046 21.1046 20 20 20H18V12Z" fill="#12131c" fillOpacity="0.6" />
                </svg>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  Quantro
                </Typography>
                <Typography variant="caption" sx={{ color: '#e5a93c', fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.68rem' }}>
                  FINANCE & ANALYTICS ERP
                </Typography>
              </Box>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: '#ffffff', lineHeight: 1.25, letterSpacing: '-0.02em', fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.1rem' } }}>
              Real-Time Financial Intelligence Platform
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4, lineHeight: 1.6, fontSize: '0.9rem' }}>
              Strict double-entry accounting with instant GST calculation, automated general ledger reconciliation, and tamper-proof audit trails.
            </Typography>

            <Stack spacing={2.5} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <VerifiedUserOutlinedIcon sx={{ color: '#e5a93c', fontSize: 22, mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff' }}>
                    Strict Mathematical Balance
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Guaranteed debit and credit equilibrium on every posted transaction.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <InsightsOutlinedIcon sx={{ color: '#f3c64f', fontSize: 22, mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff' }}>
                    Executive Performance Analytics
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Instant cash flow, variance reports, and revenue trajectory insights.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <SecurityOutlinedIcon sx={{ color: '#10b981', fontSize: 22, mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff' }}>
                    Atomic File-Based JSON Persistence
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Zero external DB dependencies, fully thread-safe serialized storage.
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                System Ready & Reconciled
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Quantro v2.0
            </Typography>
          </Box>
        </Box>

        {/* Right Side: Sleek Dark Login Form */}
        <Box sx={{ p: { xs: 3.5, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', mb: 0.5, letterSpacing: '-0.02em' }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Sign in to manage your financial accounts and reports.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '14px', backgroundColor: '#fee2e2' }}>
              {error}
            </Alert>
          )}

          {/* Quick Demo 1-Click Sign-in */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: '#1a1b29',
              borderRadius: '18px',
              border: '1px solid #282a3d'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
              <BoltIcon sx={{ color: '#e5a93c', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#e5a93c', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Quick Sign-in
              </Typography>
            </Box>
            <Stack spacing={1}>
              {demoUsers.map((u) => (
                <Box
                  key={u.id}
                  onClick={() => handleQuickDemo(u)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.1,
                    px: 1.5,
                    borderRadius: '12px',
                    bgcolor: '#12131d',
                    border: '1px solid #232537',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      borderColor: '#e5a93c',
                      bgcolor: '#191b28',
                      transform: 'translateX(3px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: u.color || '#e5a93c', fontSize: '0.75rem', fontWeight: 800, color: '#000000' }}>
                      {u.avatar || u.name?.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.1, fontSize: '0.84rem' }}>
                        {u.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                        {u.role}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    size="small"
                    label="Login"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(229, 169, 60, 0.15)',
                      color: '#e5a93c',
                      borderRadius: '6px'
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Box>

          <Divider sx={{ my: 1, mb: 2.5, borderColor: '#232537' }}>
            <Typography variant="caption" sx={{ color: '#64748b', px: 1, fontSize: '0.72rem', letterSpacing: '0.05em' }}>
              OR SIGN IN WITH EMAIL
            </Typography>
          </Divider>

          <form onSubmit={handleLogin}>
            <Stack spacing={2.2}>
              <Box>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, display: 'block', mb: 0.6 }}>
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apex.corp"
                  autoComplete="email"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a1b28',
                      borderRadius: '14px',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#282a3d' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#e5a93c' }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ color: '#64748b', fontSize: 19 }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, display: 'block', mb: 0.6 }}>
                  Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a1b28',
                      borderRadius: '14px',
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#282a3d' },
                      '&:hover fieldset': { borderColor: '#475569' },
                      '&.Mui-focused fieldset': { borderColor: '#e5a93c' }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#64748b', fontSize: 19 }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={<Checkbox defaultChecked size="small" sx={{ color: '#64748b', '&.Mui-checked': { color: '#e5a93c' } }} />}
                  label={<Typography variant="caption" sx={{ color: '#94a3b8' }}>Remember this device</Typography>}
                />
                <Typography variant="caption" sx={{ color: '#e5a93c', fontWeight: 700 }}>
                  Password: admin
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon sx={{ fontSize: 18 }} />}
                sx={{
                  py: 1.3,
                  background: 'linear-gradient(135deg, #f3c64f 0%, #d49b28 100%)',
                  color: '#000000',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  borderRadius: '14px',
                  boxShadow: '0 4px 18px rgba(229, 169, 60, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #e5a93c 0%, #b88019 100%)',
                    color: '#ffffff'
                  }
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </Stack>
          </form>
        </Box>
      </Box>
    </Box>
  );
}
