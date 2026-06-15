import React, { useState, useEffect } from 'react';
import { getFeeConfig, updateFeeConfig } from '../services/api';
import { toast } from 'react-hot-toast';

const FeeSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        platformFee: 0,
        commissionType: 'PERCENT',
        commissionValue: 0
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await getFeeConfig();
            if (response && response.success && response.data) {
                const data = response.data;
                setConfig({
                    platformFee: data.platformFee,
                    commissionType: data.commissionType,
                    commissionValue: data.commissionValue
                });
            }
        } catch (error) {
            console.error('Error fetching fee config', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: name === 'commissionType' ? value : Number(value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateFeeConfig(config);
            toast.success('Fee Settings Updated Successfully');
        } catch (error) {
            console.error('Error updating fee config', error);
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="loader"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Financial Configuration</h1>
                <p className="text-gray-500 mt-2">Manage platform fees, commissions, and payout settings.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">Fee Structure</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Platform Fee Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1">
                            <h3 className="font-semibold text-gray-900">Platform Fee</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Fixed fee charged to the patient for every booked appointment.
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <div className="relative max-w-xs">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    name="platformFee"
                                    value={config.platformFee}
                                    onChange={handleChange}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-gray-900"
                                    min="0"
                                    required
                                />
                            </div>
                            <p className="text-xs text-blue-600 mt-2 font-medium">
                                Revenue Source: Directly credited to Platform Account.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    {/* Commission Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                        <div className="md:col-span-1">
                            <h3 className="font-semibold text-gray-900">Doctor Commission</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Service charge deducted from the doctor's consultation fee.
                            </p>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex gap-4 p-1 bg-gray-100 rounded-lg w-fit">
                                <label className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all font-medium text-sm ${config.commissionType === 'PERCENT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="commissionType"
                                        value="PERCENT"
                                        checked={config.commissionType === 'PERCENT'}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    Percentage (%)
                                </label>
                                <label className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all font-medium text-sm ${config.commissionType === 'FIXED' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="commissionType"
                                        value="FIXED"
                                        checked={config.commissionType === 'FIXED'}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    Fixed Amount (₹)
                                </label>
                            </div>

                            <div className="relative max-w-xs">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                                    {config.commissionType === 'FIXED' ? '₹' : '%'}
                                </span>
                                <input
                                    type="number"
                                    name="commissionValue"
                                    value={config.commissionValue}
                                    onChange={handleChange}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-gray-900"
                                    min="0"
                                    max={config.commissionType === 'PERCENT' ? "100" : undefined}
                                    required
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Example Calculation</h4>
                                <div className="text-sm text-blue-800 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Consultation Fee:</span>
                                        <span className="font-bold">₹500</span>
                                    </div>
                                    <div className="flex justify-between border-b border-blue-200 pb-1 mb-1">
                                        <span>Commission ({config.commissionType === 'PERCENT' ? `${config.commissionValue}%` : `₹${config.commissionValue}`}):</span>
                                        <span className="font-bold text-red-600">- ₹{config.commissionType === 'PERCENT' ? (500 * config.commissionValue / 100).toFixed(0) : config.commissionValue}</span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span>Doctor Receives:</span>
                                        <span>₹{config.commissionType === 'PERCENT' ? (500 - (500 * config.commissionValue / 100)).toFixed(0) : (500 - config.commissionValue)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                        >
                            {saving ? 'Saving Changes...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeeSettings;
