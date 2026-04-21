import React, { useState } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, User, Loader2, Eye, EyeOff, ShieldCheck, Server, Activity } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

import DrStripLogo from '../components/DrStripLogo';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAdminAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await login(formData.username, formData.password);

        if (result.success) {
            toast.success('Enterprise session initiated.');
            navigate('/dashboard');
        } else {
            toast.error(result.error || 'Authentication failed. Unauthorized attempt logged.');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb] font-sans p-4">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[420px] bg-white p-[40px] rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100"
            >
                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <DrStripLogo fontSize={34} />
                    </div>
                    {/* Simplified Title - Removed duplicate Dr Strip text */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Super Admin Portal</h1>
                    <p className="text-sm font-medium text-gray-500">
                        Secure Access Management System
                    </p>
                </div>

                {/* Authentication Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div className="text-left">
                            <label className="block text-[13px] font-semibold text-gray-700 mb-2" htmlFor="username">
                                Admin ID
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    placeholder="Enter administrator ID"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="text-left">
                            <label className="block text-[13px] font-semibold text-gray-700 mb-2" htmlFor="password">
                                Access Key
                            </label>
                            <div className="relative group flex items-center">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    placeholder="Enter secure access key"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-[14px] font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all shadow-[0_2px_10px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.3)] disabled:opacity-75 disabled:cursor-wait"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            "Authenticate"
                        )}
                    </button>
                </form>

                {/* Security Section */}
                <div className="mt-8">
                    {/* Security Message */}
                    <div className="flex items-center justify-center text-gray-800 text-[13px] font-semibold mb-6">
                        <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-600" />
                        Protected by Dr Strip Enterprise Security
                    </div>

                    {/* Security Notice Box */}
                    <div className="w-full bg-gray-50 rounded text-center border border-gray-100 p-4 mb-8">
                        <p className="text-gray-500 text-[12px] font-medium mb-1">
                            All administrative activities are logged and monitored.
                        </p>
                        <p className="text-gray-500 text-[12px] font-medium">
                            Unauthorized access attempts will be recorded and reported.
                        </p>
                    </div>

                    {/* Bottom Security Indicators */}
                    <div className="flex items-center justify-between px-2">
                        <div className="flex flex-col items-center text-center">
                            <Lock className="h-4 w-4 text-gray-400 mb-1.5" />
                            <span className="text-[10px] text-gray-400 font-medium">Encrypted<br />Session</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <Server className="h-4 w-4 text-gray-400 mb-1.5" />
                            <span className="text-[10px] text-gray-400 font-medium">Secure Admin<br />Channel</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <Activity className="h-4 w-4 text-gray-400 mb-1.5" />
                            <span className="text-[10px] text-gray-400 font-medium">IP Monitoring<br />Enabled</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

