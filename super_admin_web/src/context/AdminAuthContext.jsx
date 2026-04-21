import React, { createContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

export const AdminAuthContext = createContext();

const API_URL = 'http://localhost:6002/api';

const adminApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export const AdminAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSessionValid, setIsSessionValid] = useState(false);
    const [tokenRefreshError, setTokenRefreshError] = useState(null);

    /**
     * Initialize admin session on app load
     */
    const initializeSession = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');

            if (!token) {
                console.log('No token found, user not logged in');
                setUser(null);
                setIsSessionValid(false);
                return;
            }

            console.log('Token found, verifying session...');
            const response = await adminApi.get('/session/verify');

            if (response.data.isValid && response.data.user) {
                setUser(response.data.user);
                setIsSessionValid(true);
                setTokenRefreshError(null);
                console.log('Session verified');
            } else {
                localStorage.removeItem('adminToken');
                setUser(null);
                setIsSessionValid(false);
                console.log('Session invalid');
            }
        } catch (err) {
            console.error('Session initialization error:', err);

            if (err.response?.status === 401) {
                localStorage.removeItem('adminToken');
                setUser(null);
                setIsSessionValid(false);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Login admin
     */
    const login = useCallback(async (username, password) => {
        try {
            setLoading(true);
            const response = await adminApi.post('/admin/login', { username, password });

            if (response.data.token) {
                localStorage.setItem('adminToken', response.data.token);
                await initializeSession();
                return { success: true };
            }
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Login failed';
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [initializeSession]);

    /**
     * Logout admin
     */
    const logout = useCallback(async () => {
        try {
            await adminApi.post('/session/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('adminToken');
            setUser(null);
            setIsSessionValid(false);
        }
    }, []);

    /**
     * Refresh admin token
     */
    const refreshToken = useCallback(async () => {
        try {
            const response = await adminApi.post('/session/refresh');

            if (response.data.token) {
                localStorage.setItem('adminToken', response.data.token);
                setTokenRefreshError(null);
                return true;
            }
        } catch (err) {
            console.error('Token refresh failed:', err);
            setTokenRefreshError('Session expired. Please login again.');
            await logout();
            return false;
        }
    }, [logout]);

    /**
     * Check session validity
     */
    const checkSession = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setIsSessionValid(false);
                return;
            }

            const response = await adminApi.get('/session/check');

            if (response.data.isValid) {
                setIsSessionValid(true);
                return true;
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setIsSessionValid(false);
                localStorage.removeItem('adminToken');
                setUser(null);
            }
            return false;
        }
    }, []);

    /**
     * Update user profile
     */
    const updateUserProfile = useCallback((updatedData) => {
        setUser(prev => ({ ...prev, ...updatedData }));
    }, []);

    /**
     * Initialize session on mount
     */
    useEffect(() => {
        initializeSession();
    }, [initializeSession]);

    /**
     * Check session every 5 minutes
     */
    useEffect(() => {
        if (!user) return;

        const sessionCheckInterval = setInterval(() => {
            checkSession();
        }, 5 * 60 * 1000);

        return () => clearInterval(sessionCheckInterval);
    }, [user, checkSession]);

    /**
     * Refresh token before expiry
     */
    useEffect(() => {
        if (!isSessionValid) return;

        const tokenRefreshTimeout = setTimeout(() => {
            refreshToken();
        }, 9 * 24 * 60 * 60 * 1000);

        return () => clearTimeout(tokenRefreshTimeout);
    }, [isSessionValid, refreshToken]);

    const value = {
        user,
        loading,
        isSessionValid,
        tokenRefreshError,
        login,
        logout,
        refreshToken,
        checkSession,
        initializeSession,
        updateUserProfile
    };

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export default AdminAuthProvider;
