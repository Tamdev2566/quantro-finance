import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/Auth/ProtectedRoute';
import LoginView from '../views/Auth/LoginView';

import dashboardRoutes from './modules/dashboardRoutes';
import salesRoutes from './modules/salesRoutes';
import purchasesRoutes from './modules/purchasesRoutes';
import expensesRoutes from './modules/expensesRoutes';
import accountingRoutes from './modules/accountingRoutes';
import bankingRoutes from './modules/bankingRoutes';
import reportsRoutes from './modules/reportsRoutes';
import settingsRoutes from './modules/settingsRoutes';

const protectedRoutesConfig = [
  ...dashboardRoutes,
  ...salesRoutes,
  ...purchasesRoutes,
  ...expensesRoutes,
  ...accountingRoutes,
  ...bankingRoutes,
  ...reportsRoutes,
  ...settingsRoutes
];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {protectedRoutesConfig.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
