import React, { useState, useEffect } from 'react';
import { getDoctorHealthAnalysis, updateHealthAnalysis } from '../services/api';
import { motion } from 'framer-motion';
import { Save, Edit2, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const HealthAnalysis = () => {
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        fetchAnalyses();
    }, [statusFilter]);

    const fetchAnalyses = async () => {
        try {
            setLoading(true);
            const data = await getDoctorHealthAnalysis(statusFilter);
            setAnalyses(data.data?.analyses || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load health analyses');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (analysis) => {
        setEditingId(analysis._id);
        setEditData({
            findings: analysis.findings || '',
            recommendations: analysis.recommendations || '',
            status: analysis.status || 'PENDING'
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleSave = async (analysisId) => {
        if (!editData.findings.trim()) {
            toast.error('Please add findings');
            return;
        }

        setSaving(true);
        try {
            await updateHealthAnalysis(analysisId, editData);
            toast.success('Health analysis updated');
            setEditingId(null);
            fetchAnalyses();
        } catch (err) {
            console.error(err);
            toast.error('Failed to update health analysis');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-6"
        >
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Health Analysis Requests</h1>
                <p className="text-gray-500 mt-2">Review and provide analysis for patient health data</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
                {['all', 'pending', 'completed', 'archived'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
                            statusFilter === status
                                ? 'text-primary border-primary'
                                : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Analyses List */}
            <div className="space-y-4">
                {analyses.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-12 text-center">
                        <p className="text-gray-500 text-lg">No health analyses found</p>
                    </div>
                ) : (
                    analyses.map((analysis, index) => (
                        <motion.div
                            key={analysis._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition"
                        >
                            {editingId === analysis._id ? (
                                // Edit Mode
                                <div className="p-6 space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {analysis.userId?.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Created {new Date(analysis.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            editData.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            editData.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {editData.status}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Findings
                                        </label>
                                        <textarea
                                            value={editData.findings}
                                            onChange={(e) => setEditData({ ...editData, findings: e.target.value })}
                                            placeholder="Enter your clinical findings..."
                                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none h-32"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Recommendations
                                        </label>
                                        <textarea
                                            value={editData.recommendations}
                                            onChange={(e) => setEditData({ ...editData, recommendations: e.target.value })}
                                            placeholder="Enter recommendations for the patient..."
                                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none h-32"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={editData.status}
                                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="ARCHIVED">Archived</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleSave(analysis._id)}
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition disabled:opacity-50 font-semibold"
                                        >
                                            <Save size={20} />
                                            {saving ? 'Saving...' : 'Save Analysis'}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-semibold"
                                        >
                                            <X size={20} />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <>
                                    <div className="p-6 border-b border-gray-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800">
                                                    {analysis.userId?.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {analysis.userId?.email}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                analysis.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                analysis.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {analysis.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            📅 {new Date(analysis.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {analysis.findings && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-2">Findings</p>
                                                <p className="text-gray-700 whitespace-pre-wrap">{analysis.findings}</p>
                                            </div>
                                        )}

                                        {analysis.recommendations && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-2">Recommendations</p>
                                                <p className="text-gray-700 whitespace-pre-wrap">{analysis.recommendations}</p>
                                            </div>
                                        )}

                                        {!analysis.findings && (
                                            <div className="bg-yellow-50 p-4 rounded-lg">
                                                <p className="text-yellow-700">Pending your analysis...</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleEdit(analysis)}
                                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-semibold"
                                        >
                                            <Edit2 size={20} />
                                            {analysis.findings ? 'Edit Analysis' : 'Add Analysis'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default HealthAnalysis;
