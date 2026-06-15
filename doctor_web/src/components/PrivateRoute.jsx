import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Protected Route Component
 * Checks session validity and redirects based on auth status
 * - If loading: Show loading spinner
 * - If not authenticated: Redirect to login
 * - If authenticated: Verify profile completion and render children
 */
const PrivateRoute = ({ children }) => {
    const { isSessionValid, loading, user } = useAuth();
    const location = useLocation();

    // Show loading spinner while verifying session
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="loader"></div>
            </div>
        );
    }

    // If session is not valid, redirect to login
    if (!isSessionValid || !user) {
        return <Navigate to="/login" replace />;
    }

    // If doctor, verify all critical profile details are complete
    if (user.role === 'DOCTOR') {
        const hasNoKeywords = !user.keywords || user.keywords.length === 0;
        const hasNoLanguages = !user.languages || user.languages.length === 0;
        const hasNoFacilities = !user.facilities || Object.keys(user.facilities).length === 0;
        const hasNoGenderPref = !user.genderPreference;
        const hasNoDiseaseImages = !user.diseaseImages || user.diseaseImages.length === 0;
        const hasNoClinicImages = !user.clinicImages || user.clinicImages.length === 0;
        const hasNoAvailability = !user.weeklyAvailability || user.weeklyAvailability.length === 0;

        const isMissingCritical = hasNoKeywords || 
                                 hasNoLanguages || 
                                 hasNoFacilities || 
                                 hasNoGenderPref || 
                                 hasNoDiseaseImages || 
                                 hasNoClinicImages || 
                                 hasNoAvailability;

        // Redirect to onboarding if critical details are missing
        if (isMissingCritical && location.pathname !== '/onboarding') {
            return <Navigate to="/onboarding" replace />;
        }

        // Redirect to dashboard if details are fully completed but trying to access onboarding
        if (!isMissingCritical && location.pathname === '/onboarding') {
            return <Navigate to="/" replace />;
        }
    }

    // Session is valid and profile is complete, render protected content
    return children;
};

export default PrivateRoute;
