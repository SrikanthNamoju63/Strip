import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings, getFeeConfig, updateFeeConfig } from '../services/api';
import { Settings as SettingsIcon, Save, RefreshCw, CreditCard, Shield, Clock, Hash, Mail, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Settings = () => {
    const [settings, setSettings] = useState({});
    const [feeConfig, setFeeConfig] = useState({
        platformFee: 0,
        commissionType: 'PERCENT',
        commissionValue: 0
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [sysData, feeData] = await Promise.all([
                getSettings(),
                getFeeConfig()
            ]);
            
            if (sysData && sysData.config) {
                setSettings(sysData.config);
            }
            if (feeData && feeData.success && feeData.data) {
                setFeeConfig({
                    platformFee: feeData.data.platformFee || 0,
                    commissionType: feeData.data.commissionType || 'PERCENT',
                    commissionValue: feeData.data.commissionValue || 0
                });
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to load configurations');
        } finally {
            setLoading(false);
        }
    };

    const handleSysChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleFeeChange = (e) => {
        const { name, value } = e.target;
        setFeeConfig(prev => ({
            ...prev,
            [name]: name === 'commissionType' ? value : Number(value)
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Because the backend payment controller relies heavily on SystemSetting's PLATFORM_FEE_PERCENTAGE
            // we will mirror the FeeConfig values into SystemSettings implicitly to keep them strictly synchronized.
            const updatedSettings = {
                ...settings,
                PLATFORM_FEE_FIXED: feeConfig.platformFee,
                PLATFORM_FEE_PERCENTAGE: feeConfig.commissionType === 'PERCENT' ? feeConfig.commissionValue : (settings.PLATFORM_FEE_PERCENTAGE || 10)
            };

            await Promise.all([
                updateSettings(updatedSettings),
                updateFeeConfig(feeConfig)
            ]);
            toast.success('System and Fee configurations updated successfully');
        } catch (e) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const SettingCard = ({ title, icon: Icon, children, className = "" }) => (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}>
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            </div>
            <div className="space-y-5">
                {children}
            </div>
        </div>
    );

    const InputField = ({ label, value, onChange, icon: Icon, type = "text", helpText, step }) => (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
            <div className="relative group">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    type={type}
                    step={step}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`block w-full py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
                />
            </div>
            {helpText && <p className="text-xs text-slate-500 mt-1.5 ml-1">{helpText}</p>}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
                    <p className="text-slate-500">Manage platform parameters, fees, and operational limits globally in one place.</p>
                </div>
                <button
                    onClick={loadAll}
                    disabled={loading}
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                    title="Refresh Settings"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="loader"></div>
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-6">
                    
                    {/* Unified Fee Structure (from FeeSettings) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="flex items-center gap-3 p-6 border-b border-slate-100 pb-4 bg-slate-50/50">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <CreditCard size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Global Fee Structure</h3>
                        </div>

                        <div className="p-6 md:p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-1">
                                    <h3 className="font-semibold text-slate-900">Platform Fee</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Fixed fee charged to the patient for every booked appointment.
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="relative max-w-xs">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                        <input
                                            type="number"
                                            name="platformFee"
                                            value={feeConfig.platformFee}
                                            onChange={handleFeeChange}
                                            className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-slate-900"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2 font-medium">
                                        Revenue Source: Directly credited to Platform Account.
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-slate-100"></div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
                                <div className="md:col-span-1">
                                    <h3 className="font-semibold text-slate-900">Doctor Commission</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Service charge deducted from the doctor's consultation fee.
                                    </p>
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex gap-4 p-1 bg-slate-100 rounded-lg w-fit">
                                        <label className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all font-medium text-sm ${feeConfig.commissionType === 'PERCENT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="commissionType"
                                                value="PERCENT"
                                                checked={feeConfig.commissionType === 'PERCENT'}
                                                onChange={handleFeeChange}
                                                className="hidden"
                                            />
                                            Percentage (%)
                                        </label>
                                        <label className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all font-medium text-sm ${feeConfig.commissionType === 'FIXED' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="commissionType"
                                                value="FIXED"
                                                checked={feeConfig.commissionType === 'FIXED'}
                                                onChange={handleFeeChange}
                                                className="hidden"
                                            />
                                            Fixed Amount (₹)
                                        </label>
                                    </div>

                                    <div className="relative max-w-xs">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                                            {feeConfig.commissionType === 'FIXED' ? '₹' : '%'}
                                        </span>
                                        <input
                                            type="number"
                                            name="commissionValue"
                                            value={feeConfig.commissionValue}
                                            onChange={handleFeeChange}
                                            className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-slate-900"
                                            min="0"
                                            max={feeConfig.commissionType === 'PERCENT' ? "100" : undefined}
                                            required
                                        />
                                    </div>

                                    <div className="bg-blue-50 p-4 xl:max-w-md rounded-lg border border-blue-100">
                                        <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Example Calculation</h4>
                                        <div className="text-sm text-blue-800 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Consultation Fee:</span>
                                                <span className="font-bold">₹500</span>
                                            </div>
                                            <div className="flex justify-between border-b border-blue-200 pb-1 mb-1">
                                                <span>Commission ({feeConfig.commissionType === 'PERCENT' ? `${feeConfig.commissionValue}%` : `₹${feeConfig.commissionValue}`}):</span>
                                                <span className="font-bold text-red-600">- ₹{feeConfig.commissionType === 'PERCENT' ? (500 * feeConfig.commissionValue / 100).toFixed(0) : feeConfig.commissionValue}</span>
                                            </div>
                                            <div className="flex justify-between font-bold">
                                                <span>Doctor Receives:</span>
                                                <span>₹{feeConfig.commissionType === 'PERCENT' ? (500 - (500 * feeConfig.commissionValue / 100)).toFixed(0) : (500 - feeConfig.commissionValue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Remaining Financial Settings */}
                        <SettingCard title="Additional Financial Details" icon={FileText} className="h-full">
                            <InputField
                                label="Tax / GST"
                                value={settings.TAX_PERCENTAGE}
                                onChange={(v) => handleSysChange('TAX_PERCENTAGE', v)}
                                type="number"
                                step="0.1"
                                icon={Hash}
                                helpText="Applicable tax percentage on services."
                            />
                            <InputField
                                label="Refund Window"
                                value={settings.REFUND_WINDOW_HOURS}
                                onChange={(v) => handleSysChange('REFUND_WINDOW_HOURS', v)}
                                type="number"
                                icon={Clock}
                                helpText="Hours allowed for users to request automatic refunds."
                            />
                        </SettingCard>

                        {/* Operational Settings */}
                        <SettingCard title="Operational Parameters" icon={Shield} className="h-full">
                            <InputField
                                label="Max Appointments per Slot"
                                value={settings.MAX_APPOINTMENTS_SLOT}
                                onChange={(v) => handleSysChange('MAX_APPOINTMENTS_SLOT', v)}
                                type="number"
                                icon={Hash}
                                helpText="Maximum bookings allowed per time slot."
                            />
                            <div className="h-px bg-slate-100 my-4"></div>
                            <InputField
                                label="Support Email"
                                value={settings.SUPPORT_EMAIL}
                                onChange={(v) => handleSysChange('SUPPORT_EMAIL', v)}
                                type="email"
                                icon={Mail}
                                helpText="Public contact email for support inquiries."
                            />
                            <InputField
                                label="System Contact Phone"
                                value={settings.SYSTEM_PHONE || ''}
                                onChange={(v) => handleSysChange('SYSTEM_PHONE', v)}
                                type="tel"
                                icon={SettingsIcon}
                                helpText="Emergency contact number for system alerts."
                            />
                        </SettingCard>
                    </div>

                    <div className="flex justify-end pt-4 mb-10">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-semibold active:scale-95"
                        >
                            {saving ? (
                                <>Saving Configuration...</>
                            ) : (
                                <><Save size={20} /> Save All Configurations</>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Settings;
