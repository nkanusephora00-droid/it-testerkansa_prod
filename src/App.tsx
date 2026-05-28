import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ThemeToggle from './components/ThemeToggle';
import Layout from './components/Layout';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Applications = lazy(() => import('./pages/Applications'));
const Comptes = lazy(() => import('./pages/Comptes'));
const Tests = lazy(() => import('./pages/TestSessions'));
const Profile = lazy(() => import('./pages/Profile'));
const Todos = lazy(() => import('./pages/Todos'));
const Reports = lazy(() => import('./pages/Reports'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Messages = lazy(() => import('./pages/Messages'));
const Bugs = lazy(() => import('./pages/Bugs'));

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Chargement...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><Layout><Users /></Layout></PrivateRoute>} />
          <Route path="/applications" element={<PrivateRoute><Layout><Applications /></Layout></PrivateRoute>} />
          <Route path="/comptes" element={<PrivateRoute><Layout><Comptes /></Layout></PrivateRoute>} />
          <Route path="/tests" element={<PrivateRoute><Layout><Tests /></Layout></PrivateRoute>} />
          <Route path="/bugs" element={<PrivateRoute><Layout><Bugs /></Layout></PrivateRoute>} />
          <Route path="/todos" element={<PrivateRoute><Layout><Todos /></Layout></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Layout><Messages /></Layout></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Layout><Reports /></Layout></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Layout><Notifications /></Layout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
