import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Laptop, Save, X } from 'lucide-react';

const CustomTimePicker = ({ isOpen, onClose, initialValue, onSave }) => {
    const [mode, setMode] = useState('analog'); // 'analog' or 'digital'
    const [activeTab, setActiveTab] = useState('hour'); // 'hour' or 'minute'
    
    // Deconstruct initial value (expecting "HH:MM" 24h format, e.g. "09:00" or "17:30")
    const [hour24, setHour24] = useState(9);
    const [minute, setMinute] = useState(0);
    const [ampm, setAmpm] = useState('AM');

    // Parse initial 24h time to 12h format
    useEffect(() => {
        if (initialValue) {
            const [hStr, mStr] = initialValue.split(':');
            const h = parseInt(hStr) || 9;
            const m = parseInt(mStr) || 0;
            setMinute(m);
            
            if (h >= 12) {
                setAmpm('PM');
                setHour24(h === 12 ? 12 : h - 12);
            } else {
                setAmpm('AM');
                setHour24(h === 0 ? 12 : h);
            }
        }
        setActiveTab('hour'); // Reset to hour selection on open
    }, [initialValue, isOpen]);

    if (!isOpen) return null;

    // Convert 12h representation back to 24h string "HH:MM"
    const get24HourString = () => {
        let h = hour24;
        if (ampm === 'PM') {
            h = h === 12 ? 12 : h + 12;
        } else {
            h = h === 12 ? 0 : h;
        }
        return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    const handleSave = () => {
        onSave(get24HourString());
        onClose();
    };

    // Hours list (1 to 12)
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    // Minutes list (0 to 55 in steps of 5)
    const minutes5 = Array.from({ length: 12 }, (_, i) => i * 5);

    // Calculate coordinates for circle positioning
    const getCoords = (index, total = 12, radius = 85) => {
        // Offset by 90 deg to start 1 at top-right
        const angle = ((index * (360 / total)) - 90) * (Math.PI / 180);
        const x = 110 + radius * Math.cos(angle);
        const y = 110 + radius * Math.sin(angle);
        return { x, y, angle: index * (360 / total) };
    };

    // Coordinate of the active hand line
    const activeIndex = activeTab === 'hour' ? hour24 : (minute / 5);
    const activeCoords = getCoords(activeIndex);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.4 }}
                    className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden w-full max-w-sm flex flex-col"
                >
                    {/* Header: Displays selected Time */}
                    <div className="bg-gradient-to-br from-[#003366] to-[#009999] p-6 text-center text-white relative">
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
                        >
                            <X size={18} />
                        </button>
                        
                        <p className="text-[10px] text-teal-300 font-bold uppercase tracking-wider mb-2">Set Consultation Time</p>
                        
                        <div className="flex justify-center items-baseline gap-2">
                            {/* Hours Display button */}
                            <button 
                                onClick={() => setActiveTab('hour')}
                                className={`text-4xl font-extrabold px-3 py-1 rounded-xl transition-all ${
                                    activeTab === 'hour' ? 'bg-white/20 scale-105' : 'opacity-70 hover:opacity-100'
                                }`}
                            >
                                {hour24.toString().padStart(2, '0')}
                            </button>
                            <span className="text-3xl opacity-50 font-light">:</span>
                            {/* Minutes Display button */}
                            <button 
                                onClick={() => setActiveTab('minute')}
                                className={`text-4xl font-extrabold px-3 py-1 rounded-xl transition-all ${
                                    activeTab === 'minute' ? 'bg-white/20 scale-105' : 'opacity-70 hover:opacity-100'
                                }`}
                            >
                                {minute.toString().padStart(2, '0')}
                            </button>

                            {/* AM/PM Toggle */}
                            <div className="flex flex-col ml-3 border border-white/20 rounded-lg overflow-hidden text-xs">
                                <button 
                                    onClick={() => setAmpm('AM')}
                                    className={`px-2.5 py-1 font-bold transition-all ${ampm === 'AM' ? 'bg-white text-slate-800' : 'hover:bg-white/10'}`}
                                >
                                    AM
                                </button>
                                <button 
                                    onClick={() => setAmpm('PM')}
                                    className={`px-2.5 py-1 font-bold transition-all ${ampm === 'PM' ? 'bg-white text-slate-800' : 'hover:bg-white/10'}`}
                                >
                                    PM
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* View Switcher Toggle */}
                    <div className="flex justify-center py-3 bg-slate-50 border-b border-slate-100 px-4">
                        <div className="flex bg-slate-200/60 p-1 rounded-full w-full">
                            <button
                                onClick={() => setMode('analog')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full font-bold text-xs transition-all ${
                                    mode === 'analog' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Clock size={14} />
                                Analog Watch
                            </button>
                            <button
                                onClick={() => setMode('digital')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full font-bold text-xs transition-all ${
                                    mode === 'digital' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Laptop size={14} />
                                Digital Input
                            </button>
                        </div>
                    </div>

                    {/* Body: Custom Time Selector View */}
                    <div className="flex-1 p-6 flex justify-center items-center bg-white min-h-[250px]">
                        {mode === 'analog' ? (
                            <div className="relative w-[220px] h-[220px] bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center shadow-inner">
                                {/* Clock Center */}
                                <div className="absolute w-2 h-2 bg-[#009999] rounded-full z-20"></div>

                                {/* Clock Face SVG Line Hand */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                                    <line
                                        x1="110"
                                        y1="110"
                                        x2={activeCoords.x}
                                        y2={activeCoords.y}
                                        stroke="#009999"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx={activeCoords.x}
                                        cy={activeCoords.y}
                                        r="14"
                                        fill="#009999"
                                        opacity="0.15"
                                    />
                                </svg>

                                {/* Render Numbers */}
                                {activeTab === 'hour' ? (
                                    hours.map((val, idx) => {
                                        const { x, y } = getCoords(val);
                                        const isSelected = hour24 === val;
                                        return (
                                            <button
                                                key={val}
                                                onClick={() => {
                                                    setHour24(val);
                                                    // Auto toggle to minutes after hour select
                                                    setTimeout(() => setActiveTab('minute'), 250);
                                                }}
                                                style={{ left: `${x - 14}px`, top: `${y - 14}px` }}
                                                className={`absolute w-7 h-7 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                                                    isSelected 
                                                        ? 'bg-[#009999] text-white shadow-md scale-110' 
                                                        : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
                                                }`}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })
                                ) : (
                                    minutes5.map((val, idx) => {
                                        const { x, y } = getCoords(idx, 12);
                                        const isSelected = minute === val;
                                        return (
                                            <button
                                                key={val}
                                                onClick={() => setMinute(val)}
                                                style={{ left: `${x - 14}px`, top: `${y - 14}px` }}
                                                className={`absolute w-7 h-7 rounded-full text-[10px] font-bold transition-all flex items-center justify-center ${
                                                    isSelected 
                                                        ? 'bg-[#009999] text-white shadow-md scale-110' 
                                                        : 'text-slate-500 hover:bg-slate-200/80 hover:text-slate-800'
                                                }`}
                                            >
                                                {val.toString().padStart(2, '0')}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        ) : (
                            /* Digital View Details */
                            <div className="flex flex-col gap-6 w-full max-w-[240px]">
                                {/* Quick select row */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500 font-bold uppercase">Hour</span>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setHour24(prev => prev === 1 ? 12 : prev - 1)}
                                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 transition"
                                            >
                                                -
                                            </button>
                                            <span className="w-10 text-center font-extrabold text-lg text-slate-800">{hour24}</span>
                                            <button 
                                                onClick={() => setHour24(prev => prev === 12 ? 1 : prev + 1)}
                                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 transition"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500 font-bold uppercase">Minute</span>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setMinute(prev => prev === 0 ? 55 : prev - 5)}
                                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 transition"
                                            >
                                                -
                                            </button>
                                            <span className="w-10 text-center font-extrabold text-lg text-slate-800">{minute.toString().padStart(2, '0')}</span>
                                            <button 
                                                onClick={() => setMinute(prev => prev === 55 ? 0 : prev + 5)}
                                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 transition"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Common quick selections */}
                                <div className="border-t border-slate-100 pt-4">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Quick Standard Slots</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['09:00', '13:00', '14:00', '17:00', '18:00', '20:00'].map(slot => {
                                            const [h, m] = slot.split(':').map(Number);
                                            return (
                                                <button
                                                    key={slot}
                                                    onClick={() => {
                                                        setMinute(m);
                                                        if (h >= 12) {
                                                            setAmpm('PM');
                                                            setHour24(h === 12 ? 12 : h - 12);
                                                        } else {
                                                            setAmpm('AM');
                                                            setHour24(h === 0 ? 12 : h);
                                                        }
                                                    }}
                                                    className="py-1 text-xs font-semibold text-slate-600 border border-slate-200 hover:border-[#009999] hover:text-[#009999] hover:bg-teal-50/20 rounded-md transition"
                                                >
                                                    {h > 12 ? `${h - 12}:00 PM` : `${h === 12 ? 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer buttons */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-xs transition active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-1 py-2.5 rounded-xl bg-[#009999] hover:bg-[#007a7a] font-bold text-white text-xs shadow-lg shadow-teal-500/10 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                            <Save size={14} />
                            Save Time
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CustomTimePicker;
