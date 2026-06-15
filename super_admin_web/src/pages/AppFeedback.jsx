import React, { useEffect, useState } from 'react';
import { Search, Filter, MessageSquare, Calendar, Bug, Lightbulb, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';

const AppFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('ALL'); // ALL, BUG, FEATURE, EXPERIENCE, GENERAL
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, OPEN, IN_PROGRESS, RESOLVED
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            let query = '/app-feedback?';
            if (filterType !== 'ALL') query += `type=${filterType}&`;
            if (filterStatus !== 'ALL') query += `status=${filterStatus}`;

            const res = await api.get(query);
            setFeedbacks(res.data);
        } catch (error) {
            console.error("Failed to fetch feedback", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, [filterType, filterStatus]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.put(`/app-feedback/${id}/status`, { status: newStatus });
            // Optimistic update or refetch
            setFeedbacks(feedbacks.map(f => f._id === id ? { ...f, status: newStatus } : f));
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        }
    };

    const handleReply = async (id) => {
        if (!replyText.trim()) return;
        try {
            await api.put(`/app-feedback/${id}/reply`, { reply: replyText });
            setFeedbacks(feedbacks.map(f => f._id === id ? { ...f, adminReply: replyText } : f));
            setReplyingTo(null);
            setReplyText('');
        } catch (error) {
            console.error("Failed to submit reply", error);
            alert("Failed to submit reply");
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'BUG': return <Bug size={18} className="text-red-500" />;
            case 'FEATURE': return <Lightbulb size={18} className="text-yellow-500" />;
            case 'EXPERIENCE': return <Activity size={18} className="text-blue-500" />;
            default: return <MessageSquare size={18} className="text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'OPEN': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle size={12} /> Open</span>;
            case 'IN_PROGRESS': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12} /> In Progress</span>;
            case 'RESOLVED': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Resolved</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">App Feedback</h1>
                    <p className="text-gray-500">Manage user bug reports, feature requests, and feedback.</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="ALL">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                    </select>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="ALL">All Types</option>
                        <option value="BUG">Bugs</option>
                        <option value="FEATURE">Features</option>
                        <option value="EXPERIENCE">Experience</option>
                        <option value="GENERAL">General</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="loader"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {feedbacks.map((item) => (
                        <div key={item._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-2 rounded-lg">
                                        {getTypeIcon(item.feedbackType)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{item.userName}</h3>
                                        <p className="text-xs text-gray-500">{item.email}</p>
                                    </div>
                                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-100">
                                        v{item.appVersion}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(item.createdAt).toLocaleString()}
                                    </div>
                                    {getStatusBadge(item.status)}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg text-gray-800 mb-4 border border-gray-100 whitespace-pre-wrap">
                                {item.feedbackText}
                            </div>

                            {item.deviceInfo && item.deviceInfo !== 'Unknown' && (
                                <div className="mb-4 text-xs text-gray-400 bg-gray-50 inline-block px-2 py-1 rounded">
                                    Device: {item.deviceInfo}
                                </div>
                            )}

                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                                <div className="flex gap-2">
                                    {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusUpdate(item._id, status)}
                                            disabled={item.status === status}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${item.status === status
                                                    ? 'bg-gray-800 text-white cursor-default'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            Mark {status.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>

                                {!item.adminReply && !replyingTo && (
                                    <button
                                        onClick={() => setReplyingTo(item._id)}
                                        className="text-primary hover:bg-primary/5 px-3 py-1 rounded text-sm font-medium transition-colors"
                                    >
                                        Reply to User
                                    </button>
                                )}
                            </div>

                            {/* Reply Section */}
                            {(replyingTo === item._id || item.adminReply) && (
                                <div className="mt-4 pl-4 border-l-2 border-primary/20">
                                    {item.adminReply ? (
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium mb-1">Pass Admin Reply:</p>
                                            <p className="text-gray-700 italic">{item.adminReply}</p>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Type your reply here..."
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                            <button
                                                onClick={() => handleReply(item._id)}
                                                className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary/90"
                                            >
                                                Send
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setReplyingTo(null);
                                                    setReplyText('');
                                                }}
                                                className="text-gray-500 hover:text-gray-700 px-2"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {feedbacks.length === 0 && (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                            No feedback found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AppFeedback;
