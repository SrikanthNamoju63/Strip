import React, { useEffect, useState, useRef } from 'react';
import { getDoctorAppointments, getDoctorProfile, scanAppointment } from '../services/api';
import { Search, Filter, Calendar as CalendarIcon, Clock, QrCode, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSocket } from '../context/SocketContext';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    // Ensure format is YYYY-MM-DD for input type="date"
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showScanner, setShowScanner] = useState(false);
    const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'error', title: '', msg: '' }
    const scannerRef = useRef(null);

    // Real-time updates
    const socket = useSocket();

    const fetchAppointments = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const user = await getDoctorProfile();
            const appts = await getDoctorAppointments(user._id, selectedDate);
            setAppointments(appts || []);
        } catch (err) {
            console.error(err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();

        // Polling fallback
        const interval = setInterval(() => fetchAppointments(true), 30000);
        return () => clearInterval(interval);
    }, [selectedDate]);

    // Socket Listener - Auto-refresh on real-time changes
    useEffect(() => {
        if (!socket) return;

        const handleRealTimeUpdate = (data) => {
            console.log('🔄 Appointments: Real-time update, refreshing list...', data);
            fetchAppointments(true);
        };

        socket.on('notification', handleRealTimeUpdate);
        socket.on('appointment_update', handleRealTimeUpdate);

        return () => {
            socket.off('notification', handleRealTimeUpdate);
            socket.off('appointment_update', handleRealTimeUpdate);
        };
    }, [socket, selectedDate]);

    // Cleanup scanner on unmount or close
    useEffect(() => {
        // Scanner cleanup handled in close/success
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => { /* ignore */ });
            }
        };
    }, []);

    const filteredAppointments = appointments.filter(appt =>
        appt.patientDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.diseaseKeyword?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleScanSuccess = async (decodedText) => {
        // Stop scanning immediately
        if (scannerRef.current) {
            try {
                await scannerRef.current.clear();
                scannerRef.current = null;
            } catch (e) { console.error(e); }
        }
        setShowScanner(false);

        try {
            // Assume decodedText is the Appointment ID
            const appId = decodedText;
            const res = await scanAppointment({ appointmentId: appId });
            setScanResult({
                type: 'success',
                title: 'Appointment Completed',
                msg: res.msg || 'Appointment verified and marked as completed.'
            });
            // Refresh
            fetchAppointments();
        } catch (err) {
            if (err.response && (err.response.status === 400 || err.response.status === 409)) {
                setScanResult({
                    type: 'error',
                    title: 'Already Verified',
                    msg: 'This appointment has already been scanned and checked-in.'
                });
            } else {
                setScanResult({
                    type: 'error',
                    title: 'Scan Failed',
                    msg: err.response?.data?.msg || err.message || 'Invalid QR Code'
                });
            }
        }
    };

    const handleOpenScanner = () => {
        setShowScanner(true);
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );
            scanner.render(handleScanSuccess, (err) => { /* ignore errors usually */ });
            scannerRef.current = scanner;
        }, 300);
    };

    const handleCloseScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
        setShowScanner(false);
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' };
            case 'COMPLETED':
            case 'PAID':
                return { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' };
            case 'CANCELLED':
                return { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' };
            case 'PENDING':
            case 'PENDING_PAYMENT':
            case 'BOOKED':
                return { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' };
            case 'RESCHEDULED':
                return { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' };
            case 'CHECKED_IN':
                return { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' };
            case 'IN_PROGRESS':
                return { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
                    <p className="text-gray-500 mt-1">Manage all your patient schedules</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Universal Scan Button */}
                    <button
                        onClick={fetchAppointments}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm"
                    >
                        {loading ? <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div> : <Filter size={18} className="rotate-180" />}
                        <span>Refresh</span>
                    </button>

                    <button
                        onClick={handleOpenScanner}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-sm"
                    >
                        <QrCode size={20} />
                        <span>Scan QR</span>
                    </button>

                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700">
                        <CalendarIcon size={16} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent focus:outline-none border-none p-0 cursor-pointer"
                        />
                    </div>

                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
                        <button onClick={handleCloseScanner} className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 transition-colors">
                            <X size={24} />
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-center text-gray-900">Scan Patient QR Code</h3>
                        <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                            <div id="reader" className="w-full"></div>
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-4">Point camera at the patient's QR code</p>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {scanResult && (
                <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300 text-center">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${scanResult.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {scanResult.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {scanResult.title}
                        </h3>

                        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                            {scanResult.msg}
                        </p>

                        <button
                            onClick={() => setScanResult(null)}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transform transition active:scale-95 ${scanResult.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-gray-900 hover:bg-black shadow-gray-200'}`}
                        >
                            {scanResult.type === 'success' ? 'Great, Continue' : 'Close & Try Again'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-500">Loading appointments...</div>
                ) : filteredAppointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold w-24">Token</th>
                                    <th className="px-6 py-4 font-semibold">Patient Details</th>
                                    <th className="px-6 py-4 font-semibold">Time</th>
                                    <th className="px-6 py-4 font-semibold">Diagnosis</th>
                                    <th className="px-6 py-4 font-semibold">Details</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAppointments.map((appt) => (
                                    <tr key={appt._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                                                <span className="text-xs font-bold uppercase">Token</span>
                                                <span className="text-xl font-extrabold">{appt.tokenNumber || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                    {appt.patientDetails?.name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{appt.patientDetails?.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {appt.patientDetails?.age} yrs • {appt.patientDetails?.gender}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-0.5">{appt.patientDetails?.contact}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                {/* Convert 24h to 12h */}
                                                <Clock size={16} className="text-gray-400" />
                                                <span className="text-lg font-medium text-gray-800">
                                                    {new Date('2022-01-01T' + appt.appointmentTime + ':00').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 pl-6">
                                                {formatDateDisplay(appt.appointmentDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                                {appt.diseaseKeyword}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <span className="font-medium">Earnings:</span>
                                                    <span>{'\u20B9'}{appt.fees?.doctorReceivable || appt.consultationFee || 0}</span>
                                                </div>
                                                {appt.paymentId && (
                                                    <div className="flex items-center gap-1 text-green-600 text-xs">
                                                        <CheckCircle size={10} />
                                                        <span>Paid</span>
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-400 font-mono">
                                                    ID: ...{appt._id.slice(-4)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appt.status).bg} ${getStatusColor(appt.status).text}`}>
                                                <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${getStatusColor(appt.status).dot}`}></span>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {appt.status === 'COMPLETED' && (
                                                <span className="text-emerald-600 text-sm font-medium flex items-center justify-end gap-1">
                                                    <CheckCircle size={16} /> Verified
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <CalendarIcon size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
                        <p className="text-gray-500 mt-1">Try changing the date or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Appointments;
