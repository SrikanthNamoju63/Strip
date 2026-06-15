import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, User, LogOut, Menu, X, Activity, Clock, Heart, Bell, BarChart3, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import DrStripLogo from './DrStripLogo';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const { user, logout } = useAuth(); // Get user and logout from AuthContext

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        await logout(); // Use context logout to update app state
        setShowLogoutModal(false);
        navigate('/login');
    };

    const isStaff = user?.role === 'RECEPTIONIST' || user?.role === 'NURSE';

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Calendar, label: 'Appointments', path: '/appointments' },
        { icon: Clock, label: 'Availability', path: '/availability' },
        { icon: Activity, label: 'Earnings', path: '/earnings', doctorOnly: true },
        { icon: Heart, label: 'Health Analysis', path: '/health-analysis' },
        { icon: Bell, label: 'Notifications', path: '/notifications' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics', doctorOnly: true },
        { icon: FileText, label: 'Feedbacks', path: '/feedbacks' },
        { icon: User, label: 'Profile', path: '/profile' },
    ].filter(item => !isStaff || !item.doctorOnly);

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className="fixed inset-0 bg-black z-20 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-30 w-64 md:translate-x-0 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6 flex items-center justify-center relative border-b border-gray-100">
                    <DrStripLogo fontSize={28} />
                    <button onClick={toggleSidebar} className="absolute right-6 md:hidden text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-2 mt-4">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
                                }`
                            }
                        >
                            <item.icon size={20} className="" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl w-full transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </motion.aside>
            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100"
                        >
                            <div className="flex items-center gap-3 mb-4 text-red-500">
                                <div className="p-2 bg-red-50 rounded-full">
                                    <LogOut size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Sign Out</h3>
                            </div>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Are you sure you want to sign out of your account? You will need to sign in again to access your dashboard.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 px-4 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="flex-1 px-4 py-2.5 bg-red-500 text-white font-bold hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 transition"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
