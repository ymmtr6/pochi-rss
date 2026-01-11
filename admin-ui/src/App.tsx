import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { SiteList } from './pages/SiteList';
import { SiteAdd } from './pages/SiteAdd';
import { SiteEdit } from './pages/SiteEdit';
import { ProtectedRoute } from './components/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SiteList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <SiteAdd />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:siteId"
          element={
            <ProtectedRoute>
              <SiteEdit />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
