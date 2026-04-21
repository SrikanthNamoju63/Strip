import React, { useEffect, useState } from 'react';
import { getAllSettlements, updateSettlementStatus, generateSettlement } from '../services/api';
import { DollarSign, Search, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useRealTime from '../hooks/useRealTime';

const Settlements = () => {
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const loadSettlements = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const data = await getAllSettlements();
            setSettlements(data);
        } catch (e) {
            console.error(e);
            if (!isBackground) toast.error('Failed to load settlements');
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        loadSettlements();
    }, []);

    // Real-time: auto-refresh when payment or settlement changes
    useRealTime({
        events: ['payment_update'],
        refetch: () => loadSettlements(true),
    });

    const handleMarkPaid = async (id) => {
        const txnId = prompt('Enter Bank Transaction ID / Reference No:');
        if (!txnId) return;

        try {
            await updateSettlementStatus(id, 'COMPLETED', txnId);
            toast.success('Settlement marked as COMPLETED');
            loadSettlements();
        } catch (e) {
            toast.error('Action failed');
        }
    };

    // Placeholder for manual generation trigger
    const handleGenerate = async () => {
        // In a real app, this would open a complex modal to select period and doctor
        // For now, we just mock the trigger or show a message
        toast('Settlement generation is usually automated via Cron Jobs.', { icon: 'ℹ️' });
        // Or we could trigger specific manual generation
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settlements & Payouts</h1>
                    <p className="text-gray-500">Track doctor earnings and process payouts</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleGenerate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200">
                        <DollarSign size={20} /> Generate Payouts
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600">ID</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Doctor</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Period</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Total Amt</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Commission</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Net Payable</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="8" className="px-6 py-8 text-center">Loading...</td></tr>
                        ) : settlements.length === 0 ? (
                            <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">No settlements found.</td></tr>
                        ) : settlements.map((s) => (
                            <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                    {s._id.substring(s._id.length - 6)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-800">{s.doctorId?.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{s.doctorId?.bankDetails?.bankName || 'No Bank Info'}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(s.settlementPeriod.startDate).toLocaleDateString()} - {new Date(s.settlementPeriod.endDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">₹{s.totalAmount}</td>
                                <td className="px-6 py-4 text-red-500">-₹{s.platformCommission}</td>
                                <td className="px-6 py-4 font-bold text-green-600">₹{s.netAmount}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        s.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {s.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleMarkPaid(s._id)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Mark Paid
                                        </button>
                                    )}
                                    {s.status === 'COMPLETED' && (
                                        <span className="text-xs text-gray-400">Paid {new Date(s.updatedAt).toLocaleDateString()}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Settlements;
