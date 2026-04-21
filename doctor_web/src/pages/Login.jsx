import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import DrStripLogo from '../components/DrStripLogo';
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const location = useLocation();

    // Check if we start on forgot password based on the path
    const [view, setView] = useState(location.pathname === '/forgot-password' ? 'forgot' : 'login');

    const { login, forgotPassword } = useAuth();
    const navigate = useNavigate();

    // Login Form State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isLoginLoading, setIsLoginLoading] = useState(false);

    // Forgot Password Form State
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStatus, setForgotStatus] = useState({ type: '', message: '' });
    const [isForgotLoading, setIsForgotLoading] = useState(false);

    // Sync URL when view changes without triggering full redirect reload
    useEffect(() => {
        const path = view === 'forgot' ? '/forgot-password' : '/login';
        if (location.pathname !== path) {
            window.history.replaceState(null, '', path);
        }
    }, [view, location.pathname]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoginLoading(true);
        try {
            const res = await login(loginEmail, loginPassword);
            if (res.success) {
                navigate('/');
            } else {
                setLoginError(res.error || 'Login failed');
            }
        } catch (err) {
            setLoginError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotStatus({ type: '', message: '' });
        setIsForgotLoading(true);

        try {
            const res = await forgotPassword(forgotEmail);
            if (res.success) {
                setForgotStatus({ type: 'success', message: res.message || 'Password reset link sent successfully.' });
                setForgotEmail('');
            } else {
                setForgotStatus({ type: 'error', message: res.error || 'Failed to send reset link.' });
            }
        } catch (err) {
            setForgotStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
        } finally {
            setIsForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f7fb] flex justify-center items-center p-4 font-sans selection:bg-teal-100 selection:text-teal-900">
            <div className="w-full max-w-[440px]">
                <motion.div
                    layout
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 p-6 border border-gray-100 overflow-hidden"
                >
                    <motion.div layout className="mb-8 flex flex-col items-center">
                        <DrStripLogo fontSize={36} />

                        <AnimatePresence mode="popLayout" initial={false}>
                            {view === 'login' ? (
                                <motion.div
                                    key="login-text"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-center w-full"
                                >
                                    <h2 className="mt-6 text-[22px] font-bold text-gray-900 text-center tracking-tight">
                                        Doctor Portal Login
                                    </h2>
                                    <p className="mt-2 text-[14px] text-gray-500 text-center leading-relaxed px-2">
                                        Secure access for registered doctors to manage appointments, patients, and medical services.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="forgot-text"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-center w-full"
                                >
                                    <h2 className="mt-6 text-[22px] font-bold text-gray-900 text-center tracking-tight">
                                        Reset Password
                                    </h2>
                                    <p className="mt-2 text-[14px] text-gray-500 text-center leading-relaxed px-2">
                                        Enter your registered email address and we'll send you a link to reset your password.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <AnimatePresence mode="popLayout" initial={false}>
                        {view === 'login' ? (
                            <motion.div
                                key="login-form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0, transition: { delay: 0.1, duration: 0.3 } }}
                                exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                                className="w-full"
                            >
                                {loginError && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center" role="alert">
                                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                        <span>{loginError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleLoginSubmit} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-gray-700 text-sm font-medium">Email Address</label>
                                        <input
                                            type="email"
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:border-[#009999] focus:ring-4 focus:ring-[#009999]/10 outline-none transition-all duration-300 text-sm text-gray-900 placeholder-gray-400 bg-gray-50/50 hover:bg-white focus:bg-white"
                                            placeholder="Enter your registered doctor email"
                                            required
                                            disabled={isLoginLoading}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-gray-700 text-sm font-medium">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                className="w-full px-4 py-3 pr-12 rounded-[12px] border border-gray-200 focus:border-[#009999] focus:ring-4 focus:ring-[#009999]/10 outline-none transition-all duration-300 text-sm text-gray-900 placeholder-gray-400 bg-gray-50/50 hover:bg-white focus:bg-white"
                                                placeholder="Enter your password"
                                                required
                                                disabled={isLoginLoading}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-[#009999] transition-colors focus:outline-none"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={isLoginLoading}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setView('forgot')}
                                                className="text-[13px] font-medium text-[#009999] hover:text-[#007a7a] transition-colors"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoginLoading}
                                        className="w-full mt-2 bg-[#009999] hover:bg-[#007a7a] text-white font-medium py-3 px-4 rounded-[12px] transition-all duration-300 flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm shadow-[#009999]/20"
                                    >
                                        {isLoginLoading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Verifying Access...</span>
                                            </>
                                        ) : (
                                            <span>Access Doctor Dashboard</span>
                                        )}
                                    </button>

                                    <div className="pt-4 text-center">
                                        <p className="text-[13px] text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100/50">
                                            Authorized access only. This portal is exclusively for verified medical professionals.
                                        </p>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="forgot-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0, transition: { delay: 0.1, duration: 0.3 } }}
                                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                className="w-full"
                            >
                                {forgotStatus.message && (
                                    <div
                                        className={`px-4 py-3 rounded-xl mb-6 text-sm flex items-start sm:items-center ${forgotStatus.type === 'success'
                                                ? 'bg-teal-50 border border-teal-100 text-[#009999]'
                                                : 'bg-red-50 border border-red-100 text-red-600'
                                            }`}
                                        role="alert"
                                    >
                                        {forgotStatus.type === 'success' ? (
                                            <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                                        ) : (
                                            <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 sm:mt-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                        )}
                                        <span className="leading-relaxed font-medium">{forgotStatus.message}</span>
                                    </div>
                                )}

                                <form onSubmit={handleForgotSubmit} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-gray-700 text-sm font-medium">Email Address</label>
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-[12px] border border-gray-200 focus:border-[#009999] focus:ring-4 focus:ring-[#009999]/10 outline-none transition-all duration-300 text-sm text-gray-900 placeholder-gray-400 bg-gray-50/50 hover:bg-white focus:bg-white"
                                            placeholder="Enter your registered doctor email"
                                            required
                                            disabled={isForgotLoading || forgotStatus.type === 'success'}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isForgotLoading || forgotStatus.type === 'success'}
                                        className="w-full mt-2 bg-[#009999] hover:bg-[#007a7a] text-white font-medium py-3 px-4 rounded-[12px] transition-all duration-300 flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm shadow-[#009999]/20"
                                    >
                                        {isForgotLoading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Sending Link...</span>
                                            </>
                                        ) : (
                                            <span>Send Reset Link</span>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-8 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setView('login')}
                                        className="inline-flex items-center text-[14px] font-medium text-gray-500 hover:text-[#009999] transition-colors cursor-pointer"
                                    >
                                        <ArrowLeft size={16} className="mr-2" />
                                        Back to Login
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div layout className="mt-8 text-center text-[14px] text-gray-500 relative z-0">
                    <p>
                        Need help accessing your account?{' '}
                        <a href="mailto:support@drstrip.com" className="text-[#009999] font-medium hover:text-[#007a7a] transition-colors hover:underline underline-offset-2">
                            Contact support@drstrip.com
                        </a>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
