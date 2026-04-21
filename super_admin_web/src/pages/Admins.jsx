import React, { useEffect, useState } from 'react';
import { getAdmins, createAdmin, updateAdmin } from '../services/api';
import { Shield, UserPlus, Check, X, Lock, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Admins = () => {
    const [admins, setAdmins] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', role: 'VERIFICATION_ADMIN', permissions: []
    });

    const roles = ['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'];
    const availablePermissions = ['VIEW_DOCTORS', 'VERIFY_DOCTORS', 'VIEW_FINANCE', 'APPROVE_REFUNDS', 'VIEW_SUPPORT', 'RESOLVE_TICKETS', 'MANAGE_ADMINS'];

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            const data = await getAdmins();
            setAdmins(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createAdmin(formData);
            toast.success('Admin Created Successfully');
            setShowModal(false);
            setFormData({ username: '', email: '', password: '', role: 'VERIFICATION_ADMIN', permissions: [] });
            loadAdmins();
        } catch (e) {
            toast.error(e.response?.data?.msg || 'Failed to create admin');
        }
    };

    const handleFeatureToggle = (perm) => {
        setFormData(prev => {
            const newPerms = prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm];
            return { ...prev, permissions: newPerms };
        });
    };

    const toggleStatus = async (id, currentStatus) => {
        if (!window.confirm('Change admin active status?')) return;
        try {
            await updateAdmin(id, { isActive: !currentStatus });
            loadAdmins();
            toast.success('Status Updated');
        } catch (e) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Management</h1>
                    <p className="text-slate-500">Manage internal team access and permissions</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                    <UserPlus size={18} /> Invite Admin
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {admins.map((admin) => (
                    <div
                        key={admin._id}
                        className={`rounded-2xl shadow-sm border p-6 flex flex-col relative overflow-hidden transition-all ${!admin.isActive ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-100'
                            }`}
                    >
                        {/* Status Indicator Bar */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${admin.isActive ? 'bg-blue-500' : 'bg-slate-300'}`}></div>

                        {admin.role === 'SUPER_ADMIN' && (
                            <div className="absolute top-3 right-3 bg-purple-100 text-purple-700 text-[10px] px-2 py-1 rounded font-bold border border-purple-200">
                                SUPER ADMIN
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${admin.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                                }`}>
                                {admin.username[0].toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{admin.username}</h3>
                                <p className="text-xs text-slate-500 font-medium">{admin.email || 'No Email'}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role & Access</div>
                            <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 border border-slate-100 inline-block mb-3">
                                {admin.role.replace('_', ' ')}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {admin.permissions && admin.permissions.length > 0 ? (
                                    admin.permissions.slice(0, 3).map(p => (
                                        <span key={p} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                                            {p.split('_')[0]}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-slate-400 italic">No explicit permissions</span>
                                )}
                                {admin.permissions?.length > 3 && (
                                    <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-1 rounded border border-slate-100">
                                        +{admin.permissions.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-auto">
                            <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${admin.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                }`}>
                                {admin.isActive ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                                {admin.isActive ? 'Active' : 'Inactive'}
                            </span>

                            {admin.role !== 'SUPER_ADMIN' && (
                                <button
                                    onClick={() => toggleStatus(admin._id, admin.isActive)}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border ${admin.isActive
                                        ? 'border-red-100 text-red-600 hover:bg-red-50'
                                        : 'border-blue-100 text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    {admin.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div
                        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative border border-slate-100"
                    >
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Invite New Admin</h2>
                                <p className="text-sm text-slate-500">Create account and assign permissions</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Username</label>
                                    <input required type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                                        value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Role</label>
                                    <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                                        value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                                <input required type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Password</label>
                                <input required type="password" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>

                            {formData.role !== 'SUPER_ADMIN' && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Feature Permissions</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {availablePermissions.map(p => (
                                            <label key={p} className={`flex items-center gap-2 text-xs font-medium p-2 border rounded-lg cursor-pointer transition-colors ${formData.permissions.includes(p)
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}>
                                                <input type="checkbox"
                                                    checked={formData.permissions.includes(p)}
                                                    onChange={() => handleFeatureToggle(p)}
                                                    className="rounded text-blue-600 focus:ring-0"
                                                />
                                                {p.split('_').join(' ')}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">Send Invite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admins;
