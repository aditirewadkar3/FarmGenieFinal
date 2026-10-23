import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI, API_BASE_URL } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const stored = await SecureStore.getItemAsync('user');
      const token = await SecureStore.getItemAsync('accessToken');
      if (stored && token) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Auth init error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (mobileNumber, password) => {
    try {
      console.log(`[Auth] Attempting login to ${API_BASE_URL} for ${mobileNumber}`);
      const res = await authAPI.login({ mobileNumber, password });
      const { accessToken, refreshToken, user: userData } = res.data;
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      console.error('[Auth] Login error full object:', err);
      console.error('[Auth] Login error response data:', err.response?.data);
      console.error('[Auth] Login error message:', err.message);
      const msg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) await authAPI.logout({ refreshToken });
    } catch {}
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  };

  const updateUser = async (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    await SecureStore.setItemAsync('user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
