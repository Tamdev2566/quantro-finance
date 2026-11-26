import React from 'react';
import AppRoutes from './routes';
import GlobalLoader from './components/Common/GlobalLoader';

export default function App() {
  return (
    <>
      <GlobalLoader />
      <AppRoutes />
    </>
  );
}
