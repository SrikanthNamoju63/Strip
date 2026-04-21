import React, { useEffect, useState } from 'react';
import { getAllAppointments } from '../services/api';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Table from '../components/Table';
import useRealTime from '../hooks/useRealTime';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const fetchApps = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const data = await getAllAppointments();
            setAppointments(data);
        } catch (e) {
            console.error(e);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        fetchApps();
    }, []);

    // Real-time: auto-refresh when appointments change
    useRealTime({
        events: ['appointment_update', 'payment_update'],
        refetch: () => fetchApps(true),
    });

    const getStatusBadge = (status) => {
        const styles = {
            COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
            CANCELLED: "bg-red-100 text-red-700 border-red-200",
            SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
            CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
            CHECKED_IN: "bg-teal-100 text-teal-700 border-teal-200",
            PENDING: "bg-amber-100 text-amber-700 border-amber-200"
        };
        const style = styles[status] || styles.PENDING;

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${style} inline-flex items-center gap-1`}>
                {status === 'COMPLETED' && <CheckCircle size={12} />}
                {status === 'CHECKED_IN' && <CheckCircle size={12} />}
                {status === 'CANCELLED' && <XCircle size={12} />}
                {(status === 'PENDING' || status === 'SCHEDULED' || status === 'CONFIRMED') && <Clock size={12} />}
                {status || 'PENDING'}
            </span>
        );
    };

    const columns = [
        {
            header: 'Date & Time',
            accessor: 'appointmentDate',
            render: (app) => (
                <div>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <Calendar size={14} className="text-slate-400" /> {new Date(app.appointmentDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                        <Clock size={14} className="text-slate-400" /> {app.appointmentTime}
                    </div>
                </div>
            )
        },
        {
            header: 'Patient',
            accessor: 'userId',
            render: (app) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                        {app.userId?.name?.[0] || 'P'}
                    </div>
                    <div>
                        <div className="font-medium text-slate-800">{app.userId?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{app.userId?.phone}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Doctor',
            accessor: 'doctorId',
            render: (app) => (
                <div>
                    <div className="font-medium text-blue-600">Dr. {app.doctorId?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{app.doctorId?.specialization}</div>
                </div>
            )
        },
        {
            header: 'Fees',
            accessor: 'fees',
            render: (app) => {
                const total = app.fees?.totalPaid || app.consultationFee || 0;
                const doc = app.fees?.doctorReceivable || app.consultationFee || 0;
                const platform = app.fees?.platformFee || 0;

                return (
                    <div>
                        <div className="font-bold text-slate-800">₹{total}</div>
                        <div className="text-[10px] text-slate-500">Dr: ₹{doc} | Pl: ₹{platform}</div>
                    </div>
                );
            }
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (app) => getStatusBadge(app.status)
        }
    ];

    const filteredApps = appointments.filter(app => {
        const matchesSearch =
            app.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
            app.doctorId?.name?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || app.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
                <p className="text-slate-500">Manage scheduled consultations</p>
            </div>

            <Table
                columns={columns}
                data={filteredApps}
                isLoading={loading}
                searchValue={search}
                onSearch={setSearch}
                searchPlaceholder="Search by patient or doctor..."
                filter={
                    <select
                        className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-slate-600 hover:border-blue-400 transition-colors"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                }
                pagination={true}
            />
        </div>
    );
};

export default Appointments;
