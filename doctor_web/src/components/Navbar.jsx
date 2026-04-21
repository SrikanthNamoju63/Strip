import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Calendar, User, LogOut } from 'lucide-react';
import { logoutPlugin } from '../services/api';
import DrStripLogo from './DrStripLogo';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    if (!token) return null;

    const handleLogout = () => {
        logoutPlugin();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary font-bold text-xl">
                    <DrStripLogo fontSize={24} />
                </div>
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Activity size={20} /> Dashboard
                    </Link>
                    <Link to="/appointments" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Calendar size={20} /> Appointments
                    </Link>
                    <Link to="/profile" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <User size={20} /> Profile
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors">
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
