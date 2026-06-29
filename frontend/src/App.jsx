import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EmployeePerformance from './pages/EmployeePerformance';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

// Route Guard for admin protection
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Main layout wrapper that holds the sidebar and main viewport
const Layout = ({ children }) => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8 overflow-y-auto h-screen pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Public Views wrapped in standard layout */}
          <Route path="/" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          
          <Route path="/employees" element={
            <Layout>
              <EmployeePerformance />
            </Layout>
          } />
          
          <Route path="/reports" element={
            <Layout>
              <Reports />
            </Layout>
          } />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <Layout>
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Fallback Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
