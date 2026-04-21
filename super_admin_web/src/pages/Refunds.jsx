import React, { useEffect, useState } from 'react';
import { getAllRefunds, approveRefund, rejectRefund } from '../services/api'; // Ensure getAllRefunds is used
import { Check, X, Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Refunds = () => {
    const [refunds, setRefunds] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRefunds();
    }, []);

    const loadRefunds = async () => {
        setLoading(true);
        try {
            const data = await getAllRefunds();
            setRefunds(data);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load refunds');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this refund request? Amount will be deducted from doctor payout.')) return;
        try {
            await approveRefund(id);
            toast.success('Refund Approved');
            loadRefunds();
        } catch (e) {
            toast.error('Approval failed');
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await rejectRefund(id, reason);
            toast.success('Refund Rejected');
            loadRefunds();
        } catch (e) {
            toast.error('Rejection failed');
        }
    };

    const filteredRefunds = refunds.filter(r => {
        if (filter === 'all') return true;
        return r.status === filter.toUpperCase();
    });

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Refund Requests</h1>
                    <p className="text-gray-500">Manage user refund claims and disputes</p>
                </div>
                <div className="flex gap-4">
                    <select
                        className="bg-white px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button onClick={loadRefunds} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600">ID</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">User / Doctor</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Amount</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Reason</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-8 text-center">Loading...</td></tr>
                        ) : filteredRefunds.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No refunds found.</td></tr>
                        ) : filteredRefunds.map((refund) => (
                            <tr key={refund._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                    {refund._id.substring(refund._id.length - 6)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-800">{refund.userId?.name || 'Unknown User'}</div>
                                    <div className="text-xs text-gray-500">Dr. {refund.doctorId?.name || 'Unknown'}</div>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">
                                    ₹{refund.amount}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {refund.reason}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={refund.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {refund.status === 'PENDING' && (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleApprove(refund._id)}
                                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                                                title="Approve"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(refund._id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                                title="Reject"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
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

const StatusBadge = ({ status }) => {
    let color = 'bg-gray-100 text-gray-700';
    if (status === 'APPROVED' || status === 'COMPLETED') color = 'bg-green-100 text-green-700';
    if (status === 'PENDING') color = 'bg-orange-100 text-orange-700';
    if (status === 'REJECTED' || status === 'FAILED') color = 'bg-red-100 text-red-700';

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
            {status}
        </span>
    );
};

export default Refunds;
