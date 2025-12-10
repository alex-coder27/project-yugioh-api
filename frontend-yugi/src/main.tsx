import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { ThemeProvider } from './hooks/useTheme.tsx';

import AuthPage from './pages/Auth/AuthPage.tsx'; 
import DashboardPage from './pages/Dashboard/DashboardPage.tsx'; 
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#1a1a1a', 
            color: 'white'
        }}>Carregando Duelista...</div>; 
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            
            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <DashboardPage /> 
                    </ProtectedRoute>
                } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
            
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);