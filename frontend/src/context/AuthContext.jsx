import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('Admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth status
    const authStatus = authService.isAuthenticated();
    setIsAuthenticated(authStatus);
    if (authStatus) {
      setUsername(authService.getUsername());
    }
    setLoading(false);
  }, []);

  const login = async (user, password) => {
    setLoading(true);
    try {
      const data = await authService.login(user, password);
      setIsAuthenticated(true);
      setUsername(user);
      return data;
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUsername('Admin');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
