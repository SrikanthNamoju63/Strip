import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Protected Route Component
 * Checks session validity and redirects based on auth status
 * - If loading: Show loading spinner
 * - If not authenticated: Redirect to login
 * - If authenticated: Render children
 */
const PrivateRoute = ({ children }) => {
    const { isSessionValid, loading, user } = useAuth();

    // Show loading spinner while verifying session
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
            </div>
        );
    }

    // If session is not valid, redirect to login
    if (!isSessionValid || !user) {
        return <Navigate to="/login" replace />;
    }

    // Session is valid, render protected content
    return children;
};

export default PrivateRoute;
