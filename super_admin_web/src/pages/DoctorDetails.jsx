import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getDoctorDetails,
    verifyDoctor,
    rejectDoctor,
    suspendDoctor,
    revokeVerification,
    requestReupload,
    verifyBankDetails,
    getAllRatings,
    requestProfileDetails,
    onboardDoctorToRazorpay
} from '../services/api';
import {
    Star, ShieldAlert, RefreshCw, Eye, Building, GraduationCap, Phone, Mail, Award, MapPin, Briefcase, Video,
    ArrowLeft, Check, X, FileText, Calendar, CreditCard, Link, CheckSquare, Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DoctorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [stats, setStats] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Modals
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showReuploadModal, setShowReuploadModal] = useState(false);
    const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [actionReason, setActionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Document Preview State
    const [selectedDoc, setSelectedDoc] = useState(null);

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const data = await getDoctorDetails(id);
            setDoctor(data.doctor);
            setStats({
                rating: data.ratingSummary,
                finance: data.financialSummary
            });
            setAppointments(data.appointments);

            // Fetch reviews
            const reviewsData = await getAllRatings({ doctorId: id, limit: 10 });
            if (reviewsData.success) {
                setReviews(reviewsData.data);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load doctor details');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionType) => {
        setIsSubmitting(true);
        try {
            // ... (keep existing logic)
            if (actionType === 'VERIFY') {
                if (!window.confirm('Confirm Verify?')) return;
                await verifyDoctor(id);
                toast.success('Doctor Verified');
            } else if (actionType === 'REVOKE') {
                if (!window.confirm('Confirm Revoke Verification?')) return;
                await revokeVerification(id);
                toast.success('Verification Revoked');
            } else if (actionType === 'REJECT') {
                await rejectDoctor(id, actionReason);
                toast.success('Doctor Rejected');
                setShowRejectModal(false);
            } else if (actionType === 'REUPLOAD') {
                await requestReupload(id, actionReason);
                toast.success('Re-upload Requested');
                setShowReuploadModal(false);
            } else if (actionType === 'SUSPEND') {
                await suspendDoctor(id, actionReason);
                toast.success('Doctor Suspended');
                setShowSuspendModal(false);
            } else if (actionType === 'VERIFY_BANK') {
                if (!window.confirm('Are you sure you want to verify these bank details?')) return;
                await verifyBankDetails(id, 'VERIFIED');
                toast.success('Bank Details Verified');
            } else if (actionType === 'REQUEST_DETAILS') {
                await requestProfileDetails(id, actionReason);
                toast.success('Profile Details Requested');
                setShowRequestDetailsModal(false);
            } else if (actionType === 'ONBOARD_RAZORPAY') {
                if (!window.confirm('Create linked Razorpay account for this doctor?')) return;
                await onboardDoctorToRazorpay(id);
                toast.success('Razorpay Account Created & Linked');
            }
            setActionReason('');
            fetchDetails();
        } catch (err) {
            toast.error('Action failed');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
    if (!doctor) return <div className="p-10 text-center text-slate-500">Doctor not found</div>;

    const getStatusBadge = (status) => {
        const styles = {
            VERIFIED: "bg-emerald-100 text-emerald-700 border-emerald-200",
            REJECTED: "bg-red-100 text-red-700 border-red-200",
            SUSPENDED: "bg-slate-100 text-slate-700 border-slate-200",
            PENDING: "bg-amber-100 text-amber-700 border-amber-200"
        };
        const style = styles[status] || styles.PENDING;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${style} flex items-center gap-1.5`}>
                {status === 'VERIFIED' && <Check size={12} />}
                {status === 'REJECTED' && <X size={12} />}
                {status || 'PENDING'}
            </span>
        );
    };

    const getInitials = (name) => {
        if (!name) return 'Dr';
        const parts = name.trim().split(' ').filter(p => p.length > 0);
        if (parts.length === 0) return 'Dr';
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 relative max-w-7xl mx-auto"
        >
            <button onClick={() => navigate('/doctors')} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors group">
                <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Doctors
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -z-10 -mr-16 -mt-16"></div>

                <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-white shadow-xl relative cursor-pointer group bg-slate-100 flex items-center justify-center">
                    {doctor.doctorPhoto && !imageError ? (
                        <img
                            src={
                                doctor.doctorPhoto.startsWith('http') || doctor.doctorPhoto.startsWith('data:')
                                    ? doctor.doctorPhoto
                                    : doctor.doctorPhoto.length > 200
                                        ? `data:image/png;base64,${doctor.doctorPhoto}`
                                        : `http://localhost:6002/${doctor.doctorPhoto}`
                            }
                            alt={doctor.name}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="text-3xl font-bold text-slate-400">{getInitials(doctor.name)}</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <Eye className="text-white" />
                    </div>
                </div>

                <div className="flex-1 w-full relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-1">{doctor.name}</h1>
                            <div className="flex items-center gap-3 text-slate-500 mb-4">
                                <span className="flex items-center gap-1"><Award size={16} className="text-blue-500" /> {doctor.specialization}</span>
                                <span>•</span>
                                <span>{doctor.experience} Years Exp.</span>
                            </div>

                            <div className="flex items-center gap-4">
                                {getStatusBadge(doctor.verificationStatus)}
                                <div className="flex items-center text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full text-sm">
                                    <Star size={14} fill="currentColor" />
                                    <span className="ml-1.5 font-bold text-amber-700">{stats?.rating?.averageRating?.toFixed(1) || 'N/A'}</span>
                                    <span className="ml-1 text-amber-600/70 text-xs">({stats?.rating?.totalReviews || 0} reviews)</span>
                                </div>
                            </div>

                            {doctor.rejectionReason && doctor.verificationStatus === 'REJECTED' && (
                                <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                    <strong>Rejection Reason:</strong> {doctor.rejectionReason}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            {doctor.verificationStatus === 'PENDING' && (
                                <>
                                    <ActionButton onClick={() => setShowRejectModal(true)} variant="danger">Reject</ActionButton>
                                    <ActionButton onClick={() => setShowReuploadModal(true)} variant="warning">Request Info</ActionButton>
                                    <ActionButton onClick={() => setShowRequestDetailsModal(true)} variant="secondary">Request Missing Details</ActionButton>
                                    <ActionButton onClick={() => handleAction('VERIFY')} variant="success" primary>Verify Doctor</ActionButton>
                                </>
                            )}
                            {doctor.verificationStatus === 'VERIFIED' && (
                                <>
                                    <ActionButton onClick={() => handleAction('REVOKE')} variant="secondary">Revoke</ActionButton>
                                    <ActionButton onClick={() => setShowSuspendModal(true)} variant="danger">Suspend</ActionButton>
                                </>
                            )}
                            {doctor.verificationStatus === 'SUSPENDED' && (
                                <ActionButton onClick={() => handleAction('VERIFY')} variant="success">Re-Activate</ActionButton>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100">
                        <InfoItem label="Email Contact" value={doctor.email} icon={Mail} />
                        <InfoItem label="Phone Number" value={doctor.personalPhone} icon={Phone} />
                        <InfoItem label="Clinic Location" value={`${doctor.clinicAddress?.street || ''}, ${doctor.clinicAddress?.city || ''}`} icon={MapPin} />

                        <InfoItem label="Medical Reg. No" value={doctor.registrationNumber || doctor.educationDetails?.registrationNumber || 'Not provided'} icon={FileText} />
                        <InfoItem label="Medical Council" value={doctor.medicalCouncil || 'Not provided'} icon={Building} />

                        <InfoItem label="Practice Type" value={doctor.practiceType || 'Not specified'} icon={Briefcase} />
                        <InfoItem label="Consultation Modes"
                            value={doctor.consultationModes?.map(m => m === 'IN_PERSON' ? 'In-Person' : 'Video').join(', ') || 'Not specified'}
                            icon={Video}
                        />

                        <InfoItem label="Consultation Fee" value={`₹${doctor.consultationFee}`} icon={CreditCard} />
                        <InfoItem label="Education" value={doctor.education} icon={GraduationCap} />
                    </div>

                    {(doctor.facilities && Object.values(doctor.facilities).some(v => v) || doctor.languages?.length > 0) && (
                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-8">
                            {doctor.facilities && Object.values(doctor.facilities).some(v => v) && (
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <CheckSquare size={14} /> Clinic Facilities
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(doctor.facilities).filter(([k,v]) => v).map(([key]) => {
                                            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                            return (
                                                <span key={key} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-200 flex items-center gap-1.5">
                                                    <Check size={12} /> {label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            {doctor.languages?.length > 0 && (
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Globe size={14} /> Languages Spoken
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {doctor.languages.map((lang, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-md border border-purple-200">
                                                {lang}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Documents Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                            <FileText size={20} className="text-blue-500" /> Documents
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {doctor.documents || doctor.educationDetails?.licenseImage ? (
                                <>
                                    {doctor.documents?.degreeCertificateUrl && <DocThumbnail label="Degree Certificate" url={doctor.documents.degreeCertificateUrl} onSelect={setSelectedDoc} />}
                                    {doctor.documents?.medicalRegistrationUrl && <DocThumbnail label="Medical Registration" url={doctor.documents.medicalRegistrationUrl} onSelect={setSelectedDoc} />}
                                    {doctor.documents?.idProofUrl && <DocThumbnail label="ID Proof" url={doctor.documents.idProofUrl} onSelect={setSelectedDoc} />}
                                    {doctor.educationDetails?.licenseImage && <DocThumbnail label="Medical License" url={doctor.educationDetails.licenseImage} onSelect={setSelectedDoc} />}
                                    {doctor.identityProof && <DocThumbnail label="Identity Proof (Govt)" url={doctor.identityProof} onSelect={setSelectedDoc} />}
                                </>
                            ) : (
                                <p className="text-slate-400 italic col-span-3 text-center py-4">No documents uploaded yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Appointment History */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                            <Calendar size={20} className="text-purple-500" /> Recent Activity
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-slate-500 bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                        <th className="px-4 py-3 font-semibold">Patient</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold text-right">Fee</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {appointments.slice(0, 5).map(app => (
                                        <tr key={app._id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 text-slate-600">{new Date(app.appointmentDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{app.userId?.name || 'Unknown'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>{app.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600">₹{app.consultationFee}</td>
                                        </tr>
                                    ))}
                                    {appointments.length === 0 && <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">No appointments history available</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-fit">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                        <CreditCard size={20} className="text-emerald-500" /> Financials
                    </h3>
                    <div className="space-y-3">
                        <FinanceRow label="Total Revenue" value={stats?.finance?.totalRevenue} />
                        <FinanceRow label="Admin Commission" value={stats?.finance?.adminEarnings} color="text-emerald-600" prefix="+" />
                        <FinanceRow label="Doctor Payouts" value={stats?.finance?.doctorPayouts} color="text-blue-600" />
                        <FinanceRow label="Refunds" value={stats?.finance?.totalRefunds} color="text-red-500" prefix="-" />

                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payout Method</h4>
                            {doctor.bankDetails ? (
                                <div className="space-y-3">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-slate-800 text-sm">{doctor.bankDetails.bankName}</p>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${doctor.bankDetails.verificationStatus === 'VERIFIED' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                                {doctor.bankDetails.verificationStatus}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono">**** {doctor.bankDetails.accountNumber?.slice(-4)}</p>

                                        {doctor.bankDetails.verificationStatus === 'PENDING' && (
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    onClick={() => handleAction('VERIFY_BANK')}
                                                    disabled={isSubmitting}
                                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                >
                                                    Verify Bank
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Razorpay Status */}
                                    <div className={`p-3 rounded-lg border flex flex-col gap-3 ${doctor.bankDetails.razorpayAccountId
                                        ? 'bg-emerald-50 border-emerald-100'
                                        : 'bg-slate-50 border-slate-100'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-full ${doctor.bankDetails.razorpayAccountId
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                    <CreditCard size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">Razorpay Payouts</p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {doctor.bankDetails.razorpayAccountId ? `Linked: ${doctor.bankDetails.razorpayAccountId}` : 'Not Linked'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${doctor.bankDetails.kycStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                {doctor.bankDetails.razorpayAccountId ? (doctor.bankDetails.kycStatus || 'PENDING') : 'INACTIVE'}
                                            </span>
                                        </div>

                                        {!doctor.bankDetails.razorpayAccountId && doctor.bankDetails.verificationStatus === 'VERIFIED' && (
                                            <div className="flex justify-end border-t border-slate-200 pt-2">
                                                <button
                                                    onClick={() => handleAction('ONBOARD_RAZORPAY')}
                                                    disabled={isSubmitting}
                                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    <RefreshCw size={12} className={isSubmitting ? 'animate-spin' : ''} />
                                                    Create Linked Account
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic flex items-center gap-2"><ShieldAlert size={14} /> No bank details linked</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Reviews Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <Star size={20} className="text-amber-500" /> Patient Reviews
                </h3>

                {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {reviews.map((review) => (
                            <div key={review._id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-4">
                                {/* Score */}
                                <div className="flex flex-col items-center justify-center min-w-[60px] md:border-r border-slate-200 md:pr-4">
                                    <div className="text-2xl font-bold text-slate-800">{review.overallRating}</div>
                                    <div className="flex text-amber-500 text-[10px]">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} fill={i < review.overallRating ? "currentColor" : "none"} />
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex gap-2 items-center">
                                            <span className="font-bold text-slate-900 text-sm">
                                                {review.userId?.name || 'Anonymous User'}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-slate-400 text-xs gap-1">
                                            <Calendar size={12} />
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="text-slate-600 text-sm italic mb-2">
                                        "{review.reviewText || 'No comment provided'}"
                                    </div>

                                    {review.serviceRatings && (
                                        <div className="flex gap-2 text-[10px] text-slate-500 flex-wrap">
                                            {Object.entries(review.serviceRatings).map(([key, val]) => (
                                                val > 0 && (
                                                    <div key={key} className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                        <span className="capitalize">{key}:</span>
                                                        <span className="font-bold text-slate-700">{val}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <p>No reviews available for this doctor yet.</p>
                    </div>
                )}
            </div>

            {/* Reusable Modal Component */}
            <AnimatePresence>
                {(showRejectModal || showReuploadModal || showSuspendModal || showRequestDetailsModal) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => { setShowRejectModal(false); setShowReuploadModal(false); setShowSuspendModal(false); setShowRequestDetailsModal(false); }}
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6 border border-slate-100"
                        >
                            <h3 className="text-xl font-bold mb-2 text-slate-900">
                                {showRejectModal ? 'Reject Application' :
                                    showReuploadModal ? 'Request Re-upload' :
                                        showRequestDetailsModal ? 'Request Missing Details' :
                                            'Suspend Account'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {showRejectModal ? 'Please provide a valid reason for rejection.' :
                                    showReuploadModal ? 'Specify which documents need to be re-uploaded.' :
                                        showRequestDetailsModal ? 'Specify which details differ or are missing.' :
                                            'Reason for suspending this doctor account.'}
                            </p>
                            <textarea
                                className="w-full border border-slate-200 rounded-xl p-3 h-32 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none resize-none text-sm"
                                placeholder="Enter details here..."
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                            ></textarea>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => { setShowRejectModal(false); setShowReuploadModal(false); setShowSuspendModal(false); setShowRequestDetailsModal(false); }}
                                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction(showRejectModal ? 'REJECT' : showReuploadModal ? 'REUPLOAD' : showRequestDetailsModal ? 'REQUEST_DETAILS' : 'SUSPEND')}
                                    disabled={!actionReason.trim() || isSubmitting}
                                    className={`px-4 py-2 text-white font-medium rounded-lg shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all ${showRejectModal || showSuspendModal ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                                        }`}
                                >
                                    {isSubmitting ? 'Processing...' : 'Confirm Action'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

            </AnimatePresence>

            {/* Document Preview Modal */}
            <AnimatePresence>
                {selectedDoc && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative"
                        >
                            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <FileText size={20} className="text-blue-500" />
                                    {selectedDoc.label}
                                </h3>
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-red-500"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center overflow-auto relative">
                                {selectedDoc.url.toLowerCase().endsWith('.pdf') || selectedDoc.url.startsWith('data:application/pdf') ? (
                                    <iframe
                                        src={
                                            selectedDoc.url.startsWith('http') || selectedDoc.url.startsWith('data:')
                                                ? selectedDoc.url
                                                : `http://localhost:6002/${selectedDoc.url.replace(/\\/g, '/')}`
                                        }
                                        className="w-full h-full rounded-lg shadow-sm bg-white"
                                        title={selectedDoc.label}
                                    ></iframe>
                                ) : (
                                    <img
                                        src={
                                            selectedDoc.url.startsWith('http') || selectedDoc.url.startsWith('data:')
                                                ? selectedDoc.url
                                                : `http://localhost:6002/${selectedDoc.url.replace(/\\/g, '/')}`
                                        }
                                        alt={selectedDoc.label}
                                        className="max-w-full max-h-full object-contain rounded shadow-sm"
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ActionButton = ({ children, onClick, variant = 'primary', primary }) => {
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border-red-100",
        warning: "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100",
        secondary: "bg-slate-100 text-slate-600 hover:bg-slate-200"
    };

    return (
        <button
            onClick={onClick}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${variants[variant]} ${primary ? 'shadow-lg' : ''}`}
        >
            {children}
        </button>
    );
}

const InfoItem = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-400 bg-slate-50 p-1.5 rounded-lg">
            <Icon size={16} />
        </div>
        <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">{label}</p>
            <p className="font-medium text-slate-800 text-sm mt-0.5 break-words">{value}</p>
        </div>
    </div>
);

const FinanceRow = ({ label, value, color = "text-slate-900", prefix = "" }) => (
    <div className="flex justify-between items-center p-3 bg-slate-50/50 rounded-lg border border-slate-50">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        <span className={`font-bold ${color}`}>{prefix}₹{Number(value || 0).toFixed(2)}</span>
    </div>
);

const DocThumbnail = ({ label, url, onSelect }) => {
    const handleSelect = () => {
        if (url) onSelect({ label, url });
    };

    return (
        <div
            onClick={handleSelect}
            className={`bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all h-32 group relative overflow-hidden ${url ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : 'opacity-60 cursor-not-allowed'}`}
        >
            <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/30 transition-colors"></div>
            <FileText size={24} className="text-slate-400 mb-2 group-hover:text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-600 relative z-10">{label}</span>
            {!url && <span className="text-[10px] text-red-500 mt-1 font-medium bg-red-50 px-2 py-0.5 rounded-full">Missing</span>}
        </div>
    );
};

export default DoctorDetails;
