import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Tag, Plus, Edit2, Trash2, X, CheckSquare, Settings } from 'lucide-react';

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        maxDiscount: '',
        expiryDate: '',
        usageLimit: '',
        isWelcomeCoupon: false,
        isActive: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await api.get('/coupons');
            setCoupons(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

        const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = { ...formData };
            if (!dataToSubmit.maxDiscount) delete dataToSubmit.maxDiscount;
            if (!dataToSubmit.usageLimit) delete dataToSubmit.usageLimit;

            if (isEditing) {
                await api.put(`/coupons/${formData._id}`, dataToSubmit);
            } else {
                await api.post('/coupons', dataToSubmit);
            }
            fetchCoupons();
            closeModal();
            alert(`Coupon ${isEditing ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.msg || 'Error saving coupon');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await api.delete(`/coupons/${id}`);
            fetchCoupons();
        } catch (error) {
            console.error(error);
            alert('Error deleting coupon');
        }
    };

    const openModal = (coupon = null) => {
        if (coupon) {
            setIsEditing(true);
            setFormData({
                ...coupon,
                expiryDate: new Date(coupon.expiryDate).toISOString().slice(0,10)
            });
        } else {
            setIsEditing(false);
            setFormData({
                code: '',
                discountType: 'PERCENTAGE',
                discountValue: '',
                maxDiscount: '',
                expiryDate: '',
                usageLimit: '',
                isWelcomeCoupon: false,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    if (loading) return <div className="p-8 text-center bg-gray-50 h-screen flex items-center justify-center">Loading Coupons...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <Tag className="text-indigo-600" size={32} /> Coupon Management
                        </h1>
                        <p className="text-gray-500 mt-2">Create and manage discount coupons and welcome offers.</p>
                    </div>
                    <button onClick={() => openModal()} className="bg-indigo-600 outline-none hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-200">
                        <Plus size={20} /> Create Coupon
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 uppercase text-xs tracking-wider text-gray-500 font-bold">
                                <th className="p-4">Code</th>
                                <th className="p-4">Type & Value</th>
                                <th className="p-4">Expiry</th>
                                <th className="p-4">Usage</th>
                                <th className="p-4">Special</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((coupon) => (
                                <tr key={coupon._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                    <td className="p-4 font-bold text-gray-900 uppercase">{coupon.code}</td>
                                    <td className="p-4">
                                        <span className="font-semibold">{coupon.discountValue}{coupon.discountType === 'PERCENTAGE' ? '%' : '₹'}</span>
                                        {coupon.maxDiscount > 0 && <span className="block text-xs text-gray-500">Max: ₹{coupon.maxDiscount}</span>}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {coupon.usedCount} / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                                    </td>
                                    <td className="p-4">
                                        {coupon.isWelcomeCoupon && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Welcome</span>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {coupon.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => openModal(coupon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(coupon._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {coupons.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">No coupons found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-bold">{isEditing ? 'Edit Coupon' : 'Create Coupon'}</h2>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Coupon Code</label>
                                        <input required type="text" name="code" value={formData.code} onChange={handleInputChange} className="w-full p-2 border rounded-lg uppercase font-bold" placeholder="e.g. WELCOME10" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Discount Type</label>
                                        <select name="discountType" value={formData.discountType} onChange={handleInputChange} className="w-full p-2 border rounded-lg">
                                            <option value="PERCENTAGE">Percentage (%)</option>
                                            <option value="FLAT">Flat Amount (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Discount Value</label>
                                        <input required type="number" name="discountValue" value={formData.discountValue} onChange={handleInputChange} className="w-full p-2 border rounded-lg" min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Max Discount (₹)</label>
                                        <input type="number" name="maxDiscount" value={formData.maxDiscount} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="0 for no limit" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Total Usage Limit</label>
                                        <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="Leave blank for unlimited" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Expiry Date</label>
                                        <input required type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
                                    </div>
                                    <div className="col-span-2 border p-4 rounded-lg bg-gray-50 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 flex items-center gap-1"><Settings size={16}/> Welcome Coupon</p>
                                            <p className="text-xs text-gray-500">Automatically shown to new users. Applies to first booking only.</p>
                                        </div>
                                        <input type="checkbox" name="isWelcomeCoupon" checked={formData.isWelcomeCoupon} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 rounded" />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded" id="isActive" />
                                        <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Is Active</label>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md">
                                        {isEditing ? 'Save Changes' : 'Create Coupon'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Coupons;
