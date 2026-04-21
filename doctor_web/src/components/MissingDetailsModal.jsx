import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, X } from 'lucide-react';
import { updateDoctorProfile } from '../services/api';
import { toast } from 'react-hot-toast';

const MissingDetailsModal = ({ isOpen, onClose, profile, onUpdateSuccess }) => {
    const [formData, setFormData] = useState({
        registrationNumber: profile?.registrationNumber || '',
        medicalCouncil: profile?.medicalCouncil || '',
        practiceType: profile?.practiceType || '',
        consultationModes: profile?.consultationModes || [],
        experience: profile?.experience || '',
        consultationFee: profile?.consultationFee || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleModeToggle = (mode) => {
        setFormData(prev => {
            const current = prev.consultationModes || [];
            if (current.includes(mode)) {
                return { ...prev, consultationModes: current.filter(m => m !== mode) };
            } else {
                return { ...prev, consultationModes: [...current, mode] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.registrationNumber || !formData.medicalCouncil || !formData.experience || !formData.consultationFee) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await updateDoctorProfile(formData);
            toast.success('Profile updated successfully!');
            onUpdateSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-start gap-4">
                        <div className="bg-amber-100 p-3 rounded-full text-amber-600 shrink-0">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-amber-900">Action Required</h2>
                            <p className="text-amber-700/80 text-sm mt-1">
                                {profile?.profileDetailsMessage || "Some mandatory details are missing from your profile. Please update them to avoid account suspension."}
                            </p>
                        </div>
                    </div>

                    {/* Scrollable Form Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <form id="missing-details-form" onSubmit={handleSubmit} className="space-y-4">

                            {/* Medical Reg No */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Medical Registration Number *</label>
                                <input
                                    type="text"
                                    name="registrationNumber"
                                    value={formData.registrationNumber}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g. 12345/2015"
                                />
                            </div>

                            {/* Medical Council */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Medical Council *</label>
                                <input
                                    type="text"
                                    name="medicalCouncil"
                                    value={formData.medicalCouncil}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g. Medical Council of India"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Experience */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years) *</label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="e.g. 8"
                                    />
                                </div>

                                {/* Consultation Fee */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee (₹) *</label>
                                    <input
                                        type="number"
                                        name="consultationFee"
                                        value={formData.consultationFee}
                                        onChange={handleChange}
                                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="e.g. 500"
                                    />
                                </div>
                            </div>

                            {/* Practice Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Practice Type</label>
                                <select
                                    name="practiceType"
                                    value={formData.practiceType}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="">Select Type</option>
                                    <option value="Own Clinic">Own Clinic</option>
                                    <option value="Visiting Consultant">Visiting Consultant</option>
                                    <option value="Hospital Employee">Hospital Employee</option>
                                </select>
                            </div>

                            {/* Consultation Modes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Consultation Modes</label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${formData.consultationModes.includes('IN_PERSON') ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.consultationModes.includes('IN_PERSON')}
                                            onChange={() => handleModeToggle('IN_PERSON')}
                                        />
                                        <Check size={16} className={formData.consultationModes.includes('IN_PERSON') ? 'opacity-100' : 'opacity-0'} />
                                        In-Person
                                    </label>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${formData.consultationModes.includes('VIDEO') ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.consultationModes.includes('VIDEO')}
                                            onChange={() => handleModeToggle('VIDEO')}
                                        />
                                        <Check size={16} className={formData.consultationModes.includes('VIDEO') ? 'opacity-100' : 'opacity-0'} />
                                        Video
                                    </label>
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        {/* 
                           Only allow cancel if it's strictly a request from admin that isn't blocking,
                           But typically "Missing Details" implies it's required. 
                           However, to avoid getting stuck if user doesn't have details handy right now, we MIGHT allow close?
                           The requirement says "through pop out", usually implies blocking or insistent.
                           Let's allow close if it's just a request, but maybe not if crucial fields missing?
                           For now, let's keep it simple: It's a modal you can submit.
                        */}
                        {/* <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Dismiss</button> */}

                        <button
                            type="submit"
                            form="missing-details-form"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Details'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MissingDetailsModal;
