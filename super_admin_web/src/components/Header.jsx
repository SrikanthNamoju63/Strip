import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Settings, LogOut, User, Menu, X, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAdminAuth from '../hooks/useAdminAuth';
import { getAuditLogs } from '../services/api';
import { format } from 'date-fns';

const Header = ({ toggleSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAdminAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    // Get page title based on path
    const getPageTitle = (pathname) => {
        const path = pathname.split('/')[1] || 'dashboard';
        return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
    };

    const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
            // Using audit logs as notifications for now
            const logs = await getAuditLogs();
            // Take the latest 10 logs
            setNotifications(logs.slice(0, 10));
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        if (showNotifications) {
            fetchNotifications();
        }
    }, [showNotifications]);

    return (
        <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle (optional logic can be added later) */}

                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {getPageTitle(location.pathname)}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">Overview & Statistics</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Search Bar - Visual Only for now */}
                <div className="hidden md:flex items-center bg-white/60 px-4 py-2 rounded-xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all w-64">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-600 placeholder:text-gray-400"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowProfileMenu(false);
                            }}
                            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-600"
                        >
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-20"
                                    >
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                            <h3 className="font-bold text-gray-800">Notifications</h3>
                                            <button
                                                onClick={() => setShowNotifications(false)}
                                                className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div className="max-h-[400px] overflow-y-auto">
                                            {loadingNotifications ? (
                                                <div className="flex justify-center items-center py-8">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                <div className="divide-y divide-gray-50">
                                                    {notifications.map((notif, index) => (
                                                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                                            <div className="flex gap-3">
                                                                <div className={`mt-1 min-w-[32px] h-8 rounded-full flex items-center justify-center ${notif.action === 'CREATE' ? 'bg-green-100 text-green-600' :
                                                                        notif.action === 'UPDATE' ? 'bg-blue-100 text-blue-600' :
                                                                            notif.action === 'DELETE' ? 'bg-red-100 text-red-600' :
                                                                                'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {notif.action === 'CREATE' ? <div className="text-xs font-bold">+</div> :
                                                                        notif.action === 'DELETE' ? <div className="text-xs font-bold">×</div> :
                                                                            <AlertCircle size={14} />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-gray-800">
                                                                        {notif.action} {notif.module}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                        {notif.metadata || `Action performed on ${notif.targetModel}`}
                                                                    </p>
                                                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                                                                        <Clock size={10} />
                                                                        <span>
                                                                            {notif.createdAt ? format(new Date(notif.createdAt), 'MMM dd, yyyy • hh:mm a') : 'Just now'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-gray-500">
                                                    <p className="text-sm">No new notifications</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                                            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                                View All Activity
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowProfileMenu(!showProfileMenu);
                                setShowNotifications(false);
                            }}
                            className="flex items-center gap-3 pl-4 pr-1.5 py-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group"
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
                                    {user?.username || 'Admin'}
                                </p>
                                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">
                                    {user?.role || 'SUPER_ADMIN'}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30 ring-2 ring-white sm:group-hover:scale-105 transition-transform">
                                {user?.username?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </button>

                        <AnimatePresence>
                            {showProfileMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 overflow-hidden"
                                    >
                                        <div className="px-4 py-4 bg-gray-50 border-b border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
                                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.email || 'admin@example.com'}</p>
                                        </div>

                                        <div className="p-2">
                                            <button
                                                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
                                                <User size={18} /> My Profile
                                            </button>
                                            <button
                                                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                                            >
                                                <Settings size={18} /> Settings
                                            </button>
                                            <div className="h-px bg-gray-100 my-2 mx-2"></div>
                                            <button
                                                onClick={() => { logout(); setShowProfileMenu(false); navigate('/'); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <LogOut size={18} /> Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
