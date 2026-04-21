import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../services/api';
import { FileText, Search, User, Calendar } from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await getAuditLogs();
                setLogs(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">System Audit Logs</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600">Timestamp</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Admin</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Action</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Module</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map(log => (
                            <tr key={log._id} className="hover:bg-gray-50 text-sm">
                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {log.performedBy?.username || 'System/Unknown'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                            log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{log.module}</td>
                                <td className="px-6 py-4 text-gray-500 max-w-md truncate" title={log.metadata}>
                                    {log.metadata || `Updated ${log.targetModel} ID: ${log.targetId}`}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && !loading && (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No logs found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;
