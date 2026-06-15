import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, FileText, Clock, CheckCircle, AlertCircle, Trash2, Eye, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getEmailTemplates, sendBroadcastEmail, getEmailHistory, createEmailTemplate } from '../services/api';

const EmailManagement = () => {
    const [templates, setTemplates] = useState([]);
    const [emailHistory, setEmailHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const [templateForm, setTemplateForm] = useState({
        name: '',
        subject: '',
        body: '',
        category: 'notification'
    });

    const [broadcastForm, setBroadcastForm] = useState({
        templateId: '',
        recipientGroup: 'all',
        subject: '',
        message: '',
        scheduledTime: ''
    });

    const emailCategories = [
        { value: 'notification', label: 'Notification' },
        { value: 'verification', label: 'Verification' },
        { value: 'promotional', label: 'Promotional' },
        { value: 'transactional', label: 'Transactional' },
        { value: 'support', label: 'Support' }
    ];

    const recipientGroups = [
        { value: 'all', label: 'All Users' },
        { value: 'doctors', label: 'Doctors Only' },
        { value: 'patients', label: 'Patients Only' },
        { value: 'admins', label: 'Admins Only' }
    ];

    useEffect(() => {
        loadEmailData();
    }, []);

    const loadEmailData = async () => {
        setLoading(true);
        try {
            const [templatesRes, historyRes] = await Promise.allSettled([
                getEmailTemplates(),
                getEmailHistory()
            ]);

            if (templatesRes.status === 'fulfilled') setTemplates(templatesRes.value);
            if (historyRes.status === 'fulfilled') setEmailHistory(historyRes.value);
        } catch (error) {
            console.error('Failed to load email data:', error);
            toast.error('Failed to load email data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        try {
            await createEmailTemplate(templateForm);
            toast.success('Template created successfully');
            setShowTemplateModal(false);
            setTemplateForm({ name: '', subject: '', body: '', category: 'notification' });
            loadEmailData();
        } catch (error) {
            toast.error('Failed to create template');
        }
    };

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        try {
            await sendBroadcastEmail(broadcastForm);
            toast.success('Email campaign sent successfully');
            setShowBroadcastModal(false);
            setBroadcastForm({ templateId: '', recipientGroup: 'all', subject: '', message: '', scheduledTime: '' });
            loadEmailData();
        } catch (error) {
            toast.error('Failed to send email campaign');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            sent: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
            pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
            failed: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle }
        };
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                <Icon size={14} /> {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Email Management</h1>
                    <p className="text-slate-500 mt-1">Create templates and manage email campaigns</p>
                </div>
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowTemplateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                        <Plus size={18} /> New Template
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowBroadcastModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                    >
                        <Send size={18} /> Send Campaign
                    </motion.button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
                    Templates ({templates.length})
                </button>
                <button className="px-4 py-3 border-b-2 border-transparent text-slate-600 hover:text-slate-900 font-medium text-sm">
                    History ({emailHistory.length})
                </button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                                <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                    {template.category}
                                </span>
                            </div>
                            <FileText className="text-slate-400" size={24} />
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            <span className="font-semibold">Subject:</span> {template.subject}
                        </p>

                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                            {template.body}
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedTemplate(template)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                            >
                                <Eye size={16} /> View
                            </button>
                            <button
                                onClick={() => {
                                    setBroadcastForm(prev => ({ ...prev, templateId: template._id }));
                                    setShowBroadcastModal(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                            >
                                <Send size={16} /> Use
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Email History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
            >
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Campaigns</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {emailHistory.length > 0 ? (
                        emailHistory.map((entry, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">{entry.subject}</p>
                                    <div className="flex gap-4 mt-2 text-xs text-slate-600">
                                        <span>Recipients: {entry.recipientCount}</span>
                                        <span>Sent: {new Date(entry.sentAt).toLocaleDateString()}</span>
                                        <span>Success Rate: {entry.successRate}%</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {getStatusBadge(entry.status)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-8">No email history</p>
                    )}
                </div>
            </motion.div>

            {/* Create Template Modal */}
            {showTemplateModal && (
                <AnimatePresence>
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-96 overflow-y-auto"
                        >
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Create Email Template</h3>

                            <form onSubmit={handleCreateTemplate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Template Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={templateForm.name}
                                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                        placeholder="e.g., Welcome Email"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                                    <select
                                        value={templateForm.category}
                                        onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        {emailCategories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={templateForm.subject}
                                        onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                                        placeholder="Email subject line"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Body</label>
                                    <textarea
                                        required
                                        value={templateForm.body}
                                        onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                                        placeholder="Email content (supports HTML)"
                                        rows="6"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowTemplateModal(false)}
                                        className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-900 rounded-xl hover:bg-slate-300 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Create Template
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </AnimatePresence>
            )}

            {/* Send Broadcast Modal */}
            {showBroadcastModal && (
                <AnimatePresence>
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-96 overflow-y-auto"
                        >
                            <h3 className="text-2xl font-bold text-slate-900 mb-6">Send Email Campaign</h3>

                            <form onSubmit={handleSendBroadcast} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Template</label>
                                    <select
                                        value={broadcastForm.templateId}
                                        onChange={(e) => setBroadcastForm({ ...broadcastForm, templateId: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Choose a template...</option>
                                        {templates.map(t => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Group</label>
                                    <select
                                        value={broadcastForm.recipientGroup}
                                        onChange={(e) => setBroadcastForm({ ...broadcastForm, recipientGroup: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        {recipientGroups.map(group => (
                                            <option key={group.value} value={group.value}>{group.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Send Time (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={broadcastForm.scheduledTime}
                                        onChange={(e) => setBroadcastForm({ ...broadcastForm, scheduledTime: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Leave empty to send immediately</p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowBroadcastModal(false)}
                                        className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-900 rounded-xl hover:bg-slate-300 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!broadcastForm.templateId}
                                        className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                                    >
                                        Send Campaign
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default EmailManagement;
