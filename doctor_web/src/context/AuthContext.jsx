import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSessionValid, setIsSessionValid] = useState(false);
    const [tokenRefreshError, setTokenRefreshError] = useState(null);

    /**
     * Initialize session on app load
     * Check if token exists and validate it
     */
    const initializeSession = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setUser(null);
                setIsSessionValid(false);
                return;
            }

            // Verify session with backend
            const response = await api.get('/session/verify');

            if (response.data.isValid && response.data.user) {
                let userObj = response.data.user;
                if (userObj.role === 'DOCTOR') {
                    try {
                        const profileResponse = await api.get('/doctors/me');
                        userObj = { ...userObj, ...profileResponse.data };
                    } catch (profileErr) {
                        console.error('Failed to merge doctor profile details:', profileErr);
                    }
                }
                setUser(userObj);
                setIsSessionValid(true);
                setTokenRefreshError(null);
            } else {
                localStorage.removeItem('token');
                setUser(null);
                setIsSessionValid(false);
            }
        } catch (err) {
            console.error('Session initialization error:', err);

            // If token is invalid, clear it
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                setUser(null);
                setIsSessionValid(false);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Login user and start session
     */
    const login = useCallback(async (username, password) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/login-doctor', { email: username, username, password });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);

                // Immediately verify session
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
     * Logout user and clear session
     */
    const logout = useCallback(async () => {
        try {
            await api.post('/session/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setIsSessionValid(false);
        }
    }, []);

    /**
     * Refresh token before expiry
     */
    const refreshToken = useCallback(async () => {
        try {
            const response = await api.post('/session/refresh');

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
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
     * Check session validity periodically
     * Refresh if valid, logout if expired
     */
    const checkSession = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsSessionValid(false);
                return;
            }

            const response = await api.get('/session/check');

            if (response.data.isValid) {
                setIsSessionValid(true);

                // If expiring soon, refresh
                // Token expiry check can be enhanced with JWT decoding
                return true;
            }
        } catch (err) {
            if (err.response?.status === 401) {
                // Token expired
                setIsSessionValid(false);
                localStorage.removeItem('token');
                setUser(null);
            }
            return false;
        }
    }, []);

    /**
     * Update user profile in context
     */
    const updateUserProfile = useCallback((updatedData) => {
        setUser(prev => ({ ...prev, ...updatedData }));
    }, []);

    /**
     * Initialize session on component mount
     */
    useEffect(() => {
        console.log('AuthProvider: Mounting and initializing session...');
        try {
            initializeSession().catch(e => console.error('AuthProvider: Init failed caught', e));
        } catch (e) {
            console.error('AuthProvider: Sync error', e);
        }
    }, [initializeSession]);

    /**
     * Check session validity every 5 minutes
     */
    useEffect(() => {
        if (!user) return;

        const sessionCheckInterval = setInterval(() => {
            checkSession();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(sessionCheckInterval);
    }, [user, checkSession]);

    /**
     * Setup token refresh 1 minute before expiry (9 days for 10-day token)
     */
    useEffect(() => {
        if (!isSessionValid) return;

        const tokenRefreshTimeout = setTimeout(() => {
            refreshToken();
        }, 9 * 24 * 60 * 60 * 1000); // 9 days

        return () => clearTimeout(tokenRefreshTimeout);
    }, [isSessionValid, refreshToken]);

    /**
     * Request a password reset link
     */
    const forgotPassword = useCallback(async (email) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/forgot-password', { email });
            return { success: true, message: response.data.msg };
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Failed to process request';
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

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
        updateUserProfile,
        forgotPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
