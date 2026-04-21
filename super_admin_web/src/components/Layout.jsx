import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    return (
        <div className="flex bg-gray-50 min-h-screen w-full relative">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Wrapper */}
            <div className="ml-72 flex-1 flex flex-col relative z-10 transition-all duration-300">

                {/* Top Header */}
                <Header />

                {/* Page Content */}
                <main className="p-8 flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-7xl mx-auto"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default Layout;
