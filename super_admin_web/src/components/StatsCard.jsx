import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ icon: Icon, label, value, subValue, trend, trendValue, color = "blue", delay = 0 }) => {

    // Map of color names to Tailwind classes for background and text
    const colorStyles = {
        blue: "bg-blue-500/10 text-blue-600",
        emerald: "bg-emerald-500/10 text-emerald-600",
        purple: "bg-purple-500/10 text-purple-600",
        amber: "bg-amber-500/10 text-amber-600",
        rose: "bg-rose-500/10 text-rose-600",
        indigo: "bg-indigo-500/10 text-indigo-600",
    };

    const activeStyle = colorStyles[color] || colorStyles.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group"
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>

                    {(subValue || trend) && (
                        <div className="flex items-center mt-2 space-x-2">
                            {trend && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center ${trend === 'up'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'
                                    }`}>
                                    {trend === 'up' ? '↑' : '↓'} {trendValue}
                                </span>
                            )}
                            {subValue && (
                                <span className="text-xs text-gray-400">{subValue}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className={`p-3 rounded-xl ${activeStyle} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} />
                </div>
            </div>

            {/* Decorative progress bar or line */}
            <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, delay: delay + 0.2 }}
                    className={`h-full ${activeStyle.split(' ')[1].replace('text', 'bg')}`}
                    style={{ opacity: 0.7 }}
                />
            </div>
        </motion.div>
    );
};

export default StatsCard;
