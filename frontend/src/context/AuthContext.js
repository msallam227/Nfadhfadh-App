import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('nfadhfadh_token');
    const savedUser = localStorage.getItem('nfadhfadh_user');
    const savedIsAdmin = localStorage.getItem('nfadhfadh_is_admin');
    
    if (savedToken) {
      setToken(savedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedIsAdmin === 'true') {
        setIsAdmin(true);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      setIsAdmin(false);
      
      localStorage.setItem('nfadhfadh_token', newToken);
      localStorage.setItem('nfadhfadh_user', JSON.stringify(userData));
      localStorage.setItem('nfadhfadh_is_admin', 'false');
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const adminLogin = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/admin/login`, { username, password });
      const { token: newToken } = response.data;
      
      setToken(newToken);
      setUser({ username, isAdmin: true });
      setIsAdmin(true);
      
      localStorage.setItem('nfadhfadh_token', newToken);
      localStorage.setItem('nfadhfadh_user', JSON.stringify({ username, isAdmin: true }));
      localStorage.setItem('nfadhfadh_is_admin', 'true');
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Admin login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      setIsAdmin(false);
      
      localStorage.setItem('nfadhfadh_token', newToken);
      localStorage.setItem('nfadhfadh_user', JSON.stringify(newUser));
      localStorage.setItem('nfadhfadh_is_admin', 'false');
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    
    localStorage.removeItem('nfadhfadh_token');
    localStorage.removeItem('nfadhfadh_user');
    localStorage.removeItem('nfadhfadh_is_admin');
    
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateLanguage = async (language) => {
    try {
      await axios.put(`${API}/auth/language`, { language });
      setUser(prev => ({ ...prev, language }));
      localStorage.setItem('nfadhfadh_user', JSON.stringify({ ...user, language }));
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAdmin,
      login,
      adminLogin,
      register,
      logout,
      updateLanguage,
      isAuthenticated: !!token
    }}>
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
