import React, { useState, useEffect } from 'react';
import { getDoctorProfile, updateDoctorProfile } from '../services/api';
import { Clock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Availability = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [schedule, setSchedule] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const data = await getDoctorProfile();
            const existing = data.weeklyAvailability || [];

            const fullSchedule = DAYS.map(day => {
                const found = existing.find(d => d.day === day);
                return found || {
                    day,
                    startTime: '09:00',
                    endTime: '17:00',
                    isOff: false,
                    slotDuration: 30
                };
            });

            setSchedule(fullSchedule);
        } catch (err) {
            console.error(err);
            setError('Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
        setSuccess(''); // Clear success msg on edit
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await updateDoctorProfile({ weeklyAvailability: schedule });
            setSuccess('Schedule updated successfully!');
        } catch (err) {
            console.error(err);
            setError('Failed to save schedule');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading availability...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Availability & Slots</h1>
                    <p className="text-gray-500">Configure your weekly schedule and appointment slots.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
                >
                    {saving ? 'Saving...' : <><Save size={20} /> Save Changes</>}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle size={20} /> {success}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                <th className="p-5 font-semibold">Day</th>
                                <th className="p-5 font-semibold text-center">Status</th>
                                <th className="p-5 font-semibold">Working Hours</th>
                                <th className="p-5 font-semibold">Lunch Break</th>
                                <th className="p-5 font-semibold">Slot Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {schedule.map((day, index) => (
                                <motion.tr
                                    key={day.day}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`hover:bg-gray-50 transition-colors ${day.isOff ? 'bg-gray-50/50' : ''}`}
                                >
                                    {/* Day Name */}
                                    <td className="p-5 font-medium text-gray-800 w-32">
                                        {day.day}
                                    </td>

                                    {/* Status Toggle */}
                                    <td className="p-5 text-center w-24">
                                        <label className="relative inline-flex items-center cursor-pointer justify-center">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={!day.isOff}
                                                onChange={(e) => handleChange(index, 'isOff', !e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                        <div className={`text-[10px] mt-1 font-bold ${!day.isOff ? 'text-primary' : 'text-gray-400'}`}>
                                            {!day.isOff ? 'ACTIVE' : 'OFF'}
                                        </div>
                                    </td>

                                    {/* Working Hours */}
                                    <td className="p-5">
                                        <div className={`flex items-center gap-2 ${day.isOff ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={day.startTime}
                                                    onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                                                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                                                />
                                                <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500 font-semibold">Start</span>
                                            </div>
                                            <span className="text-gray-400 font-medium">to</span>
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={day.endTime}
                                                    onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                                                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                                                />
                                                <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500 font-semibold">End</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Lunch Break */}
                                    <td className="p-5">
                                        <div className={`flex items-center gap-2 ${day.isOff ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={day.lunchStart || '13:00'}
                                                    onChange={(e) => handleChange(index, 'lunchStart', e.target.value)}
                                                    className="w-24 px-2 py-2 border border-blue-100 bg-blue-50/30 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                />
                                            </div>
                                            <span className="text-gray-300">-</span>
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={day.lunchEnd || '14:00'}
                                                    onChange={(e) => handleChange(index, 'lunchEnd', e.target.value)}
                                                    className="w-24 px-2 py-2 border border-blue-100 bg-blue-50/30 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Duration */}
                                    <td className="p-5">
                                        <div className={`relative w-24 ${day.isOff ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                            <input
                                                type="number"
                                                min="5"
                                                step="5"
                                                value={day.slotDuration}
                                                onChange={(e) => handleChange(index, 'slotDuration', parseInt(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            />
                                            <span className="absolute inset-y-0 right-3 flex items-center text-xs text-gray-400 pointer-events-none">min</span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Availability;
