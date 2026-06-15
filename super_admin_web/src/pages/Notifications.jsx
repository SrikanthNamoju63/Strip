import React, { useState } from 'react';
import { sendBroadcast } from '../services/api';
import { Bell, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Notifications = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetRole, setTargetRole] = useState('ALL');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;

        setIsSending(true);
        try {
            await sendBroadcast(title, message, targetRole);
            toast.success('Broadcast Sent Successfully');
            setTitle('');
            setMessage('');
        } catch (e) {
            toast.error('Failed to send broadcast');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-8">
            <div className="text-center mb-10">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <Bell size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Broadcast Notifications</h1>
                <p className="text-gray-500 mt-2">Send push notifications to Doctors, Patients, or Everyone.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <form onSubmit={handleSend} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                        <div className="grid grid-cols-3 gap-4">
                            {['ALL', 'DOCTOR', 'USER'].map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setTargetRole(role)}
                                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${targetRole === role
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {role === 'ALL' ? 'Everyone' : role === 'DOCTOR' ? 'All Doctors' : 'All Patients'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notification Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. System Maintenance Alert"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter your notification message..."
                            rows="5"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            required
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={isSending}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSending ? (
                            <div className="loader"></div>
                        ) : (
                            <> <Send size={20} /> Send Broadcast </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Notifications;
