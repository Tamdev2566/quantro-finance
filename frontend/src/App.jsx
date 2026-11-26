import React, { useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme, applyThemeCssVars } from './theme';
import AppRoutes from './routes';
import GlobalLoader from './components/Common/GlobalLoader';

export default function App() {
  const colorTheme = useSelector((state) => state.ui?.colorTheme || 'default');
  const muiTheme = useMemo(() => createAppTheme(colorTheme), [colorTheme]);

  useEffect(() => {
    applyThemeCssVars(colorTheme);
  }, [colorTheme]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <GlobalLoader />
      <AppRoutes />
    </ThemeProvider>
  );
}
