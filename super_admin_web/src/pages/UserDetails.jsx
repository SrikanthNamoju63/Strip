import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserDetails, cancelAppointment, rescheduleAppointment, refundAppointment, getUserRatings, hideRating, deleteRating, getDoctorAvailableSlots, getAppFeedbackByUser } from '../services/api';
import { ChevronLeft, Mail, Phone, Calendar, CreditCard, Droplet, MapPin, User, Activity, Clock, Eye, XCircle, RefreshCw, RotateCcw, DollarSign, Star, MessageSquare, EyeOff, Trash2, Bug, Lightbulb } from 'lucide-react';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const UserDetails = () => {
    const { user: adminUser } = useContext(AdminAuthContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [appFeedbacks, setAppFeedbacks] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [modalType, setModalType] = useState(null); // 'CANCEL', 'RESCHEDULE', 'REFUND'
    const [selectedAppt, setSelectedAppt] = useState(null);

    // Form States
    const [cancelReason, setCancelReason] = useState('');
    const [refundPercent, setRefundPercent] = useState(100);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundExternalId, setRefundExternalId] = useState('');

    useEffect(() => {
        loadData();
    }, [id]);

    useEffect(() => {
        if (modalType === 'RESCHEDULE' && selectedAppt && rescheduleDate) {
            fetchSlots();
        }
    }, [modalType, rescheduleDate]);

    const fetchSlots = async () => {
        if (!rescheduleDate || !selectedAppt?.doctorId) return;
        try {
            setLoadingSlots(true);
            const doctorId = selectedAppt.doctorId._id || selectedAppt.doctorId;
            const res = await getDoctorAvailableSlots(doctorId, rescheduleDate);
            setAvailableSlots(res.slots || []);
        } catch (error) {
            console.error("Error fetching slots:", error);
            // toast.error("Failed to load time slots"); // Optional: don't spam toasts on date change
        } finally {
            setLoadingSlots(false);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [userRes, ratingsRes, appFeedbacksRes] = await Promise.all([
                getUserDetails(id),
                getUserRatings(id),
                getAppFeedbackByUser(id)
            ]);
            setData(userRes);
            setRatings(ratingsRes.data || []);
            setAppFeedbacks(appFeedbacksRes || []);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.msg || "Failed to load user details.");
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (type, appt) => {
        setSelectedAppt(appt);
        setModalType(type);

        // Reset forms
        setCancelReason('');
        setRefundPercent(100);
        setRescheduleDate(appt.appointmentDate ? appt.appointmentDate.split('T')[0] : '');
        setRescheduleTime(appt.appointmentTime || '');
        setRefundAmount(appt.fees?.totalPaid || '');
        setRefundExternalId('');
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedAppt(null);
    };

    const handleCancelSubmit = async (e) => {
        e.preventDefault();
        try {
            await cancelAppointment(selectedAppt._id, cancelReason, refundPercent);
            toast.success('Appointment cancelled successfully');
            closeModal();
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to cancel');
        }
    };

    const handleRescheduleSubmit = async (e) => {
        e.preventDefault();
        try {
            await rescheduleAppointment(selectedAppt._id, rescheduleDate, rescheduleTime);
            toast.success('Appointment rescheduled successfully');
            closeModal();
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to reschedule');
        }
    };

    const handleRefundSubmit = async (e) => {
        e.preventDefault();
        try {
            await refundAppointment(selectedAppt._id, refundAmount, refundExternalId);
            toast.success('Refund processed successfully');
            closeModal();
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Failed to refund');
        }
    };

    const handleHideRating = async (ratingId) => {
        if (!window.confirm('Are you sure you want to toggle visibility for this rating?')) return;
        try {
            await hideRating(ratingId);
            toast.success('Rating visibility updated');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update visibility');
        }
    };

    const handleDeleteRating = async (ratingId) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this rating?')) return;
        try {
            await deleteRating(ratingId);
            toast.success('Rating deleted successfully');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete rating');
        }
    };

    if (error) return <div className="p-10 text-center text-red-500 font-medium bg-red-50 rounded-xl m-8">{error}</div>;
    if (loading || !data) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="loader"></div>
        </div>
    );

    const { user, appointments, payments } = data;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto space-y-6 pb-20"
        >
            <button onClick={() => navigate('/users')} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors group px-1">
                <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Users
            </button>

            {/* Profile Info Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -z-10 -mr-20 -mt-20 opacity-70"></div>

                <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg shadow-indigo-200 text-white text-4xl font-bold ring-4 ring-white">
                        {user.profileImage ? (
                            <img
                                src={`http://localhost:6002/${user.profileImage.replace(/\\/g, '/')}`}
                                className="w-full h-full object-cover"
                                alt={user.name}
                                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = user.name?.[0] || 'U'; }}
                            />
                        ) : (
                            user.name?.[0] || 'U'
                        )}
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{user.name}</h1>
                                <div className="flex flex-wrap gap-3">
                                    {user.userNumber && (
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-mono font-bold flex items-center gap-1">
                                            User ID: {user.userNumber}
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold flex items-center gap-1">
                                        <Clock size={12} /> Joined: {new Date(user.createdAt).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 mt-6 pt-6 border-t border-slate-100/80">
                            <InfoItem icon={Mail} label="Email Address" value={user.email} />
                            <InfoItem icon={Phone} label="Phone Number" value={user.phone || 'N/A'} />
                            <InfoItem icon={MapPin} label="Location" value={user.address ? (typeof user.address === 'object' ? `${user.address.city || ''}, ${user.address.state || ''}` : user.address) : 'Not Provided'} />
                            <InfoItem icon={User} label="Gender" value={user.gender || 'N/A'} />
                            <InfoItem icon={Calendar} label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString('en-GB') : 'N/A'} />
                            <InfoItem icon={User} label="Age" value={user.age ? `${user.age} Years` : 'N/A'} />
                            <InfoItem icon={Droplet} label="Blood Group" value={user.bloodGroup || 'N/A'} />
                            <InfoItem icon={Activity} label="Height" value={user.height ? `${user.height} cm` : 'N/A'} />
                            <InfoItem icon={Activity} label="Weight" value={user.weight ? `${user.weight} kg` : 'N/A'} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointments Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="text-blue-500" size={20} /> Appointment History
                    </h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{appointments.length} Records</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                                <th className="p-4">Date / Time</th>
                                <th className="p-4">Doctor</th>
                                <th className="p-4">Status / Token</th>
                                <th className="p-4">Financials</th>
                                <th className="p-4">Payment & Refund</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {appointments.map((app) => (
                                <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 align-top">
                                        <div className="font-semibold text-slate-800">{new Date(app.appointmentDate).toLocaleDateString('en-GB')}</div>
                                        <div className="text-xs text-slate-500">{app.appointmentTime}</div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="font-semibold text-blue-600">Dr. {app.doctorId?.name}</div>
                                        <div className="text-xs text-slate-400">{app.doctorId?.specialization}</div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <StatusBadge status={app.status} />
                                        <div className="text-xs text-slate-500 mt-1">Token: <span className="font-mono font-bold">{app.tokenNumber || '-'}</span></div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="space-y-1">
                                            <div className="flex justify-between gap-4 text-xs">
                                                <span className="text-slate-500">Total Paid:</span>
                                                <span className="font-bold text-slate-800">₹{app.fees?.totalPaid || app.consultationFee || 0}</span>
                                            </div>
                                            <div className="flex justify-between gap-4 text-[10px] text-slate-400">
                                                <span>Doctor:</span>
                                                <span>₹{app.fees?.doctorReceivable || 0}</span>
                                            </div>
                                            <div className="flex justify-between gap-4 text-[10px] text-slate-400">
                                                <span>Platform:</span>
                                                <span>₹{app.fees?.adminProfit || 0}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="space-y-2">
                                            {/* Payment Info */}
                                            <div>
                                                <div className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">Payment</div>
                                                <div className={`text-xs font-bold inline-flex items-center gap-1 ${app.paymentStatus === 'COMPLETED' ? 'text-emerald-600' : 'text-orange-500'
                                                    }`}>
                                                    {app.paymentStatus}
                                                    {app.paymentId && <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded ml-1 font-mono">{String(app.paymentId._id || app.paymentId).slice(-6)}</span>}
                                                </div>
                                            </div>

                                            {/* Refund Info */}
                                            {(app.cancellation?.refundStatus || app.paymentStatus === 'REFUNDED') && (
                                                <div className="pt-1 border-t border-slate-100">
                                                    <div className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">Refund</div>
                                                    <div className="text-xs font-bold text-red-500 flex flex-col">
                                                        <span>Status: {app.cancellation?.refundStatus || 'REFUNDED'}</span>
                                                        {app.cancellation?.refundAmount > 0 && <span>Amt: ₹{app.cancellation.refundAmount} ({app.cancellation.refundPercent}%)</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-top text-right">
                                        <div className="flex justify-end gap-1">
                                            {/* View Details - Just placeholder or modal */}
                                            {/* <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600" title="View Details">
                                                <Eye size={16} />
                                            </button> */}

                                            {/* Cancel Action */}
                                            {['PENDING', 'CONFIRMED', 'PAID'].includes(app.status) && (
                                                <button
                                                    onClick={() => handleActionClick('CANCEL', app)}
                                                    className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"
                                                    title="Cancel Appointment"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}

                                            {/* Reschedule Action */}
                                            {['PENDING', 'CONFIRMED', 'PAID', 'RESCHEDULED'].includes(app.status) && (
                                                <button
                                                    onClick={() => handleActionClick('RESCHEDULE', app)}
                                                    className="p-1.5 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-600"
                                                    title="Reschedule"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                            )}

                                            {/* Refund Action */}
                                            {(app.paymentStatus === 'COMPLETED' || app.status === 'PAID') && (!app.cancellation?.refundStatus || app.cancellation.refundStatus === 'FAILED') && (
                                                <button
                                                    onClick={() => handleActionClick('REFUND', app)}
                                                    className="p-1.5 hover:bg-yellow-50 rounded text-slate-400 hover:text-yellow-600"
                                                    title="Process Refund"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* Ratings Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Star className="text-amber-500" size={20} /> Feedback History
                    </h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{ratings.length} Reviews</span>
                </div>

                {ratings.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {ratings.map((rating) => (
                            <div key={rating._id} className={`p-6 transition-colors ${rating.isHidden ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                            {rating.doctorId?.doctorPhoto ? (
                                                <img
                                                    src={
                                                        rating.doctorId.doctorPhoto.startsWith('http') || rating.doctorId.doctorPhoto.startsWith('data:')
                                                            ? rating.doctorId.doctorPhoto
                                                            : rating.doctorId.doctorPhoto.length > 200
                                                                ? `data:image/png;base64,${rating.doctorId.doctorPhoto}`
                                                                : `http://localhost:6002/${rating.doctorId.doctorPhoto}`
                                                    }
                                                    alt={rating.doctorId.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                                    {rating.doctorId?.name?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">Dr. {rating.doctorId?.name}</div>
                                            <div className="text-xs text-slate-500">{rating.doctorId?.specialization}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 font-medium mb-1">
                                            {new Date(rating.createdAt).toLocaleDateString('en-GB')}
                                        </div>
                                        <div className="flex gap-0.5 mb-2 justify-end">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} size={14} fill={s <= rating.overallRating ? "#F59E0B" : "none"} color={s <= rating.overallRating ? "#F59E0B" : "#CBD5E1"} />
                                            ))}
                                        </div>

                                        {/* Admin Actions */}
                                        {adminUser?.role === 'SUPER_ADMIN' && (
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleHideRating(rating._id)}
                                                    className={`p-1 rounded ${rating.isHidden ? 'text-red-600 bg-red-200' : 'text-slate-400 hover:text-slate-600'}`}
                                                    title={rating.isHidden ? "Unhide Review" : "Hide Review"}
                                                >
                                                    {rating.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRating(rating._id)}
                                                    className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"
                                                    title="Delete Review"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {rating.reviewText && (
                                    <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 italic border border-slate-100">
                                        "{rating.reviewText}"
                                    </div>
                                )}

                                {rating.doctorResponse && (
                                    <div className="mt-3 ml-4 pl-4 border-l-2 border-blue-200">
                                        <div className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1">
                                            <MessageSquare size={12} /> Doctor Response
                                        </div>
                                        <p className="text-sm text-slate-600">{rating.doctorResponse.text}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-400">
                        <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
                        <p>No feedback provided yet</p>
                    </div>
                )}
            </div>

            {/* App Feedbacks Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="text-blue-500" size={20} /> App Feedback
                    </h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{appFeedbacks.length} Submissions</span>
                </div>

                {appFeedbacks.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {appFeedbacks.map((item) => (
                            <div key={item._id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            {item.feedbackType === 'BUG' ? <Bug size={14} className="text-red-500" /> : (item.feedbackType === 'FEATURE' ? <Lightbulb size={14} className="text-yellow-500" /> : <Activity size={14} className="text-blue-500" />)}
                                            {item.feedbackType}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">App v{item.appVersion} &bull; {item.deviceInfo}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 font-medium mb-1">
                                            {new Date(item.createdAt).toLocaleDateString('en-GB')}
                                        </div>
                                        <div className={`text-[10px] font-bold inline-block px-2 py-1 rounded-lg uppercase ${item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {item.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100 whitespace-pre-wrap">
                                    {item.feedbackText}
                                </div>
                                {item.adminReply && (
                                    <div className="mt-3 ml-4 pl-4 border-l-2 border-blue-200">
                                        <div className="text-xs font-bold text-blue-600 mb-1">Admin Reply</div>
                                        <p className="text-sm text-slate-600">{item.adminReply}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-400">
                        <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
                        <p>No app feedback submitted yet</p>
                    </div>
                )}
            </div>

            {/* Payments List (Optional secondary view) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard className="text-emerald-500" size={20} /> Payment History (Raw Logs)
                    </h2>
                </div>
                <div className="p-4">
                    {payments.length > 0 ? (
                        <div className="space-y-2">
                            {payments.map(p => (
                                <div key={p._id} className="flex justify-between items-center p-3 bg-slate-50 rounded text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-slate-500 text-xs">{p._id}</div>
                                        <div className="font-bold">₹{p.amount}</div>
                                        <div className="text-slate-400 text-xs">{new Date(p.createdAt).toLocaleString('en-GB')}</div>
                                    </div>
                                    <div className={`font-bold text-xs px-2 py-1 rounded ${p.paymentStatus === 'SUCCESS' || p.paymentStatus === 'CAPTURED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {p.paymentStatus}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-4 text-sm">No payment logs found</div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {modalType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800">
                                    {modalType === 'CANCEL' && 'Cancel Appointment'}
                                    {modalType === 'RESCHEDULE' && 'Reschedule Appointment'}
                                    {modalType === 'REFUND' && 'Process Refund'}
                                </h3>
                                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><XCircle size={20} /></button>
                            </div>

                            <div className="p-6 space-y-4">
                                {modalType === 'CANCEL' && (
                                    <form onSubmit={handleCancelSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Cancellation</label>
                                            <textarea
                                                required
                                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                rows="3"
                                                value={cancelReason}
                                                onChange={e => setCancelReason(e.target.value)}
                                                placeholder="Enter reason..."
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Refund Percentage</label>
                                            <select
                                                className="w-full p-2 border border-slate-200 rounded-lg"
                                                value={refundPercent}
                                                onChange={e => setRefundPercent(Number(e.target.value))}
                                            >
                                                <option value={100}>100% Refund</option>
                                                <option value={50}>50% Refund</option>
                                                <option value={0}>0% (No Refund)</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors">
                                            Confirm Cancellation
                                        </button>
                                    </form>
                                )}

                                {modalType === 'RESCHEDULE' && (
                                    <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">New Date</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full p-2 border border-slate-200 rounded-lg"
                                                value={rescheduleDate}
                                                onChange={e => setRescheduleDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2 mt-4">Select Time Slot</label>
                                            {loadingSlots ? (
                                                <div className="flex justify-center p-4">
                                                    <div className="loader"></div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-lg bg-slate-50/50">
                                                    {availableSlots.length > 0 ? (
                                                        availableSlots.map((slot) => (
                                                            <button
                                                                key={slot.time}
                                                                type="button"
                                                                disabled={slot.status === 'booked' || slot.status === 'locked'}
                                                                onClick={() => setRescheduleTime(slot.time)}
                                                                className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all duration-200 ${rescheduleTime === slot.time
                                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                                    : slot.status === 'booked' || slot.status === 'locked'
                                                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm'
                                                                    }`}
                                                            >
                                                                {slot.time}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="col-span-3 text-center py-4 text-slate-400 text-sm italic">
                                                            No available slots for this date.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                                            Confirm Reschedule
                                        </button>
                                    </form>
                                )}

                                {modalType === 'REFUND' && (
                                    <form onSubmit={handleRefundSubmit} className="space-y-4">
                                        <div className="p-3 bg-yellow-50 rounded-lg text-yellow-800 text-sm mb-4">
                                            This will trigger a refund for the appointment. Ensure the payment gateway supports this or handle manually.
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Refund Amount</label>
                                            <div className="relative">
                                                <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full pl-9 p-2 border border-slate-200 rounded-lg"
                                                    value={refundAmount}
                                                    onChange={e => setRefundAmount(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">External Refund ID (Optional)</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border border-slate-200 rounded-lg"
                                                value={refundExternalId}
                                                onChange={e => setRefundExternalId(e.target.value)}
                                                placeholder="e.g. ref_123xyz"
                                            />
                                        </div>
                                        <button type="submit" className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors">
                                            Process Refund
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div >
    );
};

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 mt-0.5">
            <Icon size={14} />
        </div>
        <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{label}</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5 max-w-[200px] truncate" title={value}>{value}</p>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        'PENDING': 'bg-yellow-100 text-yellow-700',
        'CONFIRMED': 'bg-blue-100 text-blue-700',
        'COMPLETED': 'bg-emerald-100 text-emerald-700',
        'CANCELLED': 'bg-red-100 text-red-700',
        'CANCELLED_BY_ADMIN': 'bg-red-100 text-red-700',
        'RESCHEDULED': 'bg-purple-100 text-purple-700',
        'PAID': 'bg-indigo-100 text-indigo-700'
    };
    return (
        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
};

export default UserDetails;
