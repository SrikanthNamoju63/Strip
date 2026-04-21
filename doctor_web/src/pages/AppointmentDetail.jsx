import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppointmentById, addConsultationNotes, addPrescriptions, completeAppointment } from '../services/api';
import { motion } from 'framer-motion';
import { X, Save, Plus, Trash2, CheckCircle, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const AppointmentDetail = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [consultationNotes, setConsultationNotes] = useState('');
    const [prescriptions, setPrescriptions] = useState([]);
    const [followUpRequired, setFollowUpRequired] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');
    const [newPrescription, setNewPrescription] = useState({
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
    });

    useEffect(() => {
        fetchAppointment();
    }, [appointmentId]);

    const fetchAppointment = async () => {
        try {
            const data = await getAppointmentById(appointmentId);
            setAppointment(data);
            setConsultationNotes(data.consultationNotes || '');
            setPrescriptions(data.prescriptions || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load appointment');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPrescription = () => {
        if (!newPrescription.medicineName.trim()) {
            toast.error('Please enter medicine name');
            return;
        }
        setPrescriptions([...prescriptions, newPrescription]);
        setNewPrescription({
            medicineName: '',
            dosage: '',
            frequency: '',
            duration: '',
            notes: ''
        });
    };

    const handleRemovePrescription = (index) => {
        setPrescriptions(prescriptions.filter((_, i) => i !== index));
    };

    const handleSaveNotes = async () => {
        setSaving(true);
        try {
            await addConsultationNotes(appointmentId, consultationNotes);
            toast.success('Consultation notes saved');
        } catch (err) {
            toast.error('Failed to save notes');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePrescriptions = async () => {
        setSaving(true);
        try {
            await addPrescriptions(appointmentId, prescriptions);
            toast.success('Prescriptions saved');
        } catch (err) {
            toast.error('Failed to save prescriptions');
        } finally {
            setSaving(false);
        }
    };

    const handleCompleteAppointment = async () => {
        if (!window.confirm('Mark this appointment as completed?')) return;

        setSaving(true);
        try {
            await completeAppointment(appointmentId, {
                consultationNotes,
                prescriptions,
                followUpRequired,
                followUpDate: followUpRequired ? followUpDate : null
            });
            toast.success('Appointment completed');
            navigate('/appointments');
        } catch (err) {
            toast.error('Failed to complete appointment');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">Appointment not found</p>
                <button
                    onClick={() => navigate('/appointments')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                    Back to Appointments
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Appointment Details</h1>
                    <p className="text-gray-500">{appointment.patientDetails?.name}</p>
                </div>
                <button
                    onClick={() => navigate('/appointments')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="text-lg font-semibold">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="text-lg font-semibold">{appointment.appointmentTime}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="text-lg font-semibold">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                appointment.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {appointment.status}
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="text-lg font-semibold">{appointment.consultationType}</p>
                    </div>
                </div>
            </div>

            {/* Patient Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="text-primary" size={24} />
                    Patient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-semibold">{appointment.patientDetails?.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Age / Gender</p>
                        <p className="font-semibold">{appointment.patientDetails?.age} / {appointment.patientDetails?.gender}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Chief Complaint</p>
                        <p className="font-semibold">{appointment.diseaseKeyword || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Contact</p>
                        <p className="font-semibold">{appointment.patientDetails?.contact}</p>
                    </div>
                    {appointment.patientDetails?.currentSymptoms && (
                        <div className="md:col-span-2">
                            <p className="text-sm text-gray-500">Current Symptoms</p>
                            <p className="font-semibold">{appointment.patientDetails.currentSymptoms}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Consultation Notes */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4">Consultation Notes</h2>
                <textarea
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    placeholder="Add consultation notes, observations, and findings..."
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none h-32"
                />
                <button
                    onClick={handleSaveNotes}
                    disabled={saving}
                    className="mt-4 flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
                >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save Notes'}
                </button>
            </div>

            {/* Prescriptions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-4">Prescriptions</h2>

                {/* Existing Prescriptions */}
                <div className="space-y-3 mb-6">
                    {prescriptions.map((prescription, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl flex justify-between items-start">
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800">{prescription.medicineName}</p>
                                <p className="text-sm text-gray-600">
                                    {prescription.dosage} • {prescription.frequency} • {prescription.duration}
                                </p>
                                {prescription.notes && <p className="text-sm text-gray-500 mt-1">Note: {prescription.notes}</p>}
                            </div>
                            <button
                                onClick={() => handleRemovePrescription(index)}
                                className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add Prescription Form */}
                <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-primary" />
                        Add Prescription
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Medicine Name"
                            value={newPrescription.medicineName}
                            onChange={(e) => setNewPrescription({ ...newPrescription, medicineName: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Dosage (e.g., 500mg)"
                            value={newPrescription.dosage}
                            onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Frequency (e.g., Twice daily)"
                            value={newPrescription.frequency}
                            onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Duration (e.g., 7 days)"
                            value={newPrescription.duration}
                            onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Special Notes (optional)"
                            value={newPrescription.notes}
                            onChange={(e) => setNewPrescription({ ...newPrescription, notes: e.target.value })}
                            className="md:col-span-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <button
                        onClick={handleAddPrescription}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition"
                    >
                        <Plus size={20} />
                        Add Medicine
                    </button>
                </div>

                <button
                    onClick={handleSavePrescriptions}
                    disabled={saving || prescriptions.length === 0}
                    className="mt-6 flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
                >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save Prescriptions'}
                </button>
            </div>

            {/* Follow-up */}
            {appointment.status !== 'COMPLETED' && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-xl font-bold mb-4">Follow-up</h2>
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={followUpRequired}
                            onChange={(e) => setFollowUpRequired(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300"
                        />
                        <span className="font-semibold">Schedule Follow-up Appointment</span>
                    </label>
                    {followUpRequired && (
                        <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="mt-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                    )}
                </div>
            )}

            {/* Action Buttons */}
            {appointment.status !== 'COMPLETED' && (
                <div className="flex gap-4 justify-end">
                    <button
                        onClick={() => navigate('/appointments')}
                        className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCompleteAppointment}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-semibold disabled:opacity-50"
                    >
                        <CheckCircle size={20} />
                        {saving ? 'Completing...' : 'Complete Appointment'}
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default AppointmentDetail;
