import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, LogOut, Calendar, Droplet, CreditCard, FileText, Settings, Shield, MessageSquare, Activity, DollarSign, Star, BarChart3, Server, Mail, Zap, FileEdit, ShieldCheck, Megaphone, Database, ChevronDown, ChevronRight } from 'lucide-react';
import { logoutAdmin } from '../services/api';
import useAdminAuth from '../hooks/useAdminAuth';
import DrStripLogo from './DrStripLogo';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAdminAuth();

    const [expandedMenus, setExpandedMenus] = useState({});

    const toggleMenu = (label) => {
        setExpandedMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const handleLogout = () => {
        logoutAdmin();
        navigate('/');
    };

    // Helper to check access
    const hasAccess = (allowedRoles) => {
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return allowedRoles.includes(user.role);
    };

    const menuStructure = [
        {
            category: "Overview",
            items: [
                { icon: LayoutDashboard, label: 'Overview', path: '/dashboard', visible: true }
            ]
        },
        {
            category: "Users & Resources",
            items: [
                { icon: UserCheck, label: 'Doctors', path: '/doctors', visible: hasAccess(['VERIFICATION_ADMIN', 'SUPPORT_ADMIN']) },
                { icon: Users, label: 'Users', path: '/users', visible: hasAccess(['VERIFICATION_ADMIN', 'SUPPORT_ADMIN']) },
                { icon: Calendar, label: 'Appointments', path: '/appointments', visible: hasAccess(['SUPPORT_ADMIN']) },
                { icon: Activity, label: 'Blood Requests', path: '/blood-requests', visible: hasAccess(['SUPPORT_ADMIN']) },
                { icon: Droplet, label: 'Donations', path: '/blood-donations', visible: hasAccess(['SUPPORT_ADMIN']) }
            ]
        },
        {
            category: "Financials",
            items: [
                { icon: CreditCard, label: 'Payments', path: '/payments', visible: hasAccess(['FINANCE_ADMIN']) },
                { icon: FileText, label: 'Settlements', path: '/settlements', visible: hasAccess(['FINANCE_ADMIN']) },
                { icon: FileText, label: 'Refunds', path: '/refunds', visible: hasAccess(['FINANCE_ADMIN']) }
            ]
        },
        {
            category: "Support & Comms",
            items: [
                { icon: MessageSquare, label: 'Support', path: '/support', visible: hasAccess(['SUPPORT_ADMIN']) },
                { icon: MessageSquare, label: 'App Feedback', path: '/app-feedback', visible: hasAccess(['SUPER_ADMIN', 'SUPPORT_ADMIN']) },
                { icon: Megaphone, label: 'Campaigns', path: '/campaigns', visible: hasAccess(['SUPER_ADMIN']) },
                { icon: Megaphone, label: 'Coupons', path: '/coupons', visible: hasAccess(['SUPER_ADMIN']) },
                { icon: Mail, label: 'Email Management', path: '/email-management', visible: hasAccess(['SUPER_ADMIN']) }
            ]
        },
        {
            category: "System Administration",
            items: [
                { icon: Shield, label: 'Admins', path: '/admins', visible: hasAccess([]) },
                { icon: Settings, label: 'System Configuration', path: '/settings', visible: hasAccess([]) },
                { 
                    icon: Server, 
                    label: 'Admin Tools', 
                    isParent: true,
                    visible: hasAccess(['SUPER_ADMIN']),
                    subItems: [
                        { label: 'Advanced Reports', path: '/advanced-reports', visible: hasAccess(['SUPER_ADMIN']) },
                        { label: 'System Admin', path: '/system-admin', visible: hasAccess(['SUPER_ADMIN']) },
                        { label: 'Content Mgmt', path: '/content-management', visible: hasAccess(['SUPER_ADMIN']) },
                        { label: 'Insurance', path: '/insurance-partners', visible: hasAccess(['SUPER_ADMIN']) },
                        { label: 'Data Backup', path: '/data-backup', visible: hasAccess(['SUPER_ADMIN']) }
                    ]
                }
            ]
        }
    ];

    return (
        <aside className="fixed top-0 left-0 h-full bg-white shadow-2xl z-30 w-72 transition-all duration-300 flex flex-col">
            {/* Logo Area */}
            <div className="h-20 flex items-center justify-center border-b border-gray-100 flex-shrink-0">
                <DrStripLogo fontSize={28} />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 mt-1 overflow-y-auto custom-scrollbar">
                {menuStructure.map((group, index) => {
                    const visibleItems = group.items.filter(item => item.visible);
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={index} className="space-y-1">
                            <h3 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                {group.category}
                            </h3>
                            {visibleItems.map((item) => {
                                if (item.isParent) {
                                    const visibleSubItems = item.subItems.filter(sub => sub.visible);
                                    if (visibleSubItems.length === 0) return null;
                                    const isOpen = expandedMenus[item.label];
                                    const isChildActive = visibleSubItems.some(sub => location.pathname === sub.path);
                                    
                                    return (
                                        <div key={item.label} className="flex flex-col">
                                            <button
                                                onClick={() => toggleMenu(item.label)}
                                                className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-left ${isChildActive && !isOpen
                                                    ? 'bg-primary/10 text-primary font-semibold'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon size={18} className={isChildActive ? "text-primary" : ""} />
                                                    <span className={`font-medium ${isChildActive ? "text-primary text-sm font-semibold" : "text-sm"}`}>{item.label}</span>
                                                </div>
                                                {isOpen ? <ChevronDown size={14} className="opacity-70" /> : <ChevronRight size={14} className="opacity-70" />}
                                            </button>
                                            
                                            {/* Sub items expand */}
                                            {isOpen && (
                                                <div className="mt-1 ml-9 pl-3 border-l-[1.5px] border-gray-200 flex flex-col gap-1 py-1">
                                                    {visibleSubItems.map(sub => (
                                                        <NavLink
                                                            key={sub.path}
                                                            to={sub.path}
                                                            className={({ isActive }) =>
                                                                `block px-3 py-2 text-[13px] rounded-lg transition-colors ${isActive
                                                                    ? 'bg-primary/10 text-primary font-bold'
                                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-primary font-medium'
                                                                }`
                                                            }
                                                        >
                                                            {sub.label}
                                                        </NavLink>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                                            }`
                                        }
                                    >
                                        <item.icon size={18} />
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
