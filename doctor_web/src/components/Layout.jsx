import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className="md:ml-64 min-h-screen flex flex-col transition-all duration-300">
                {/* Top Bar (Mobile Only) */}
                <header className="bg-white shadow-sm p-4 md:hidden flex items-center justify-between sticky top-0 z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                        <Menu size={24} />
                    </button>
                    <h1 className="font-bold text-lg text-primary">MediCare Doctor</h1>
                    <div className="w-6"></div> {/* Spacer */}
                </header>

                <main className="flex-grow p-6 md:p-8 lg:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
