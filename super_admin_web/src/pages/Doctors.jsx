import React, { useEffect, useState } from 'react';
import { getDoctors, verifyDoctor, deleteDoctor } from '../services/api';
import { Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Table from '../components/Table';
import useRealTime from '../hooks/useRealTime';

const DoctorAvatar = ({ doc, getInitials }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-xs overflow-hidden shadow-sm border border-white shrink-0">
                {doc.doctorPhoto && !imgError ? (
                    <img
                        src={
                            doc.doctorPhoto.startsWith('http') || doc.doctorPhoto.startsWith('data:')
                                ? doc.doctorPhoto
                                : doc.doctorPhoto.length > 200 // Assume Base64 if long
                                    ? `data:image/png;base64,${doc.doctorPhoto}`
                                    : `http://localhost:6002/${doc.doctorPhoto}`
                        }
                        className="w-full h-full object-cover"
                        alt={doc.name}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    getInitials(doc.name)
                )}
            </div>
            <div>
                <div className="font-semibold text-slate-800">{doc.name}</div>
                <div className="text-xs text-slate-400 font-mono">ID: {doc._id.substring(doc._id.length - 6)}</div>
            </div>
        </div>
    );
};

const Doctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadDoctors();
    }, [filter]);

    const loadDoctors = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const data = await getDoctors(filter);
            setDoctors(data);
        } catch (e) {
            console.error(e);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // Real-time: auto-refresh when doctor stats/status change
    useRealTime({
        events: [],
        refetch: () => loadDoctors(true),
    });

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this doctor? This cannot be undone.')) return;
        try {
            await deleteDoctor(id);
            loadDoctors();
        } catch (e) {
            alert('Delete failed');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            VERIFIED: "bg-emerald-100 text-emerald-700 border-emerald-200",
            REJECTED: "bg-red-100 text-red-700 border-red-200",
            SUSPENDED: "bg-slate-100 text-slate-700 border-slate-200",
            PENDING: "bg-amber-100 text-amber-700 border-amber-200"
        };
        const style = styles[status] || styles.PENDING;

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${style}`}>
                {status || 'PENDING'}
            </span>
        );
    };

    const columns = [
        {
            header: 'Doctor',
            accessor: 'name',
            render: (doc) => {
                const getInitials = (name) => {
                    if (!name) return 'Dr';
                    const parts = name.trim().split(' ').filter(p => p.length > 0);
                    if (parts.length === 0) return 'Dr';
                    if (parts.length === 1) return parts[0][0].toUpperCase();
                    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                };

                return <DoctorAvatar doc={doc} getInitials={getInitials} />;
            }
        },
        {
            header: 'Specialization',
            accessor: 'specialization',
            render: (doc) => <span className="text-slate-600 font-medium">{doc.specialization}</span>
        },
        {
            header: 'Contact',
            accessor: 'email',
            render: (doc) => (
                <div>
                    <div className="text-sm text-slate-700">{doc.email}</div>
                    <div className="text-xs text-slate-400">{doc.personalPhone}</div>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'verificationStatus',
            render: (doc) => getStatusBadge(doc.verificationStatus)
        }
    ];

    const filteredDocs = doctors.filter(doc =>
        doc.name?.toLowerCase().includes(search.toLowerCase()) ||
        doc.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Doctor Management</h1>
                <p className="text-slate-500">Monitor and verify doctor accounts</p>
            </div>

            <Table
                columns={columns}
                data={filteredDocs}
                isLoading={loading}
                searchValue={search}
                onSearch={setSearch}
                searchPlaceholder="Search doctors by name or email..."
                filter={
                    <select
                        className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-600 hover:border-blue-400 transition-colors"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending Review</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                        <option value="suspended">Suspended</option>
                    </select>
                }
                actions={(doc) => (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/doctors/${doc._id}`); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                        >
                            <Eye size={18} />
                        </button>
                        <button
                            onClick={(e) => handleDelete(e, doc._id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            />
        </div>
    );
};

export default Doctors;
