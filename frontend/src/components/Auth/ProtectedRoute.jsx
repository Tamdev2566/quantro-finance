import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const isAuthenticated = useSelector((state) => Boolean(state.auth?.isAuthenticated || state.finance?.isAuthenticated));
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
