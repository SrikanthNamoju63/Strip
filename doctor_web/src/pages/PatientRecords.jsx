import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatientRecords } from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientRecords = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [records, setRecords] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('appointments');

    useEffect(() => {
        fetchPatientRecords();
    }, [userId]);

    const fetchPatientRecords = async () => {
        try {
            const data = await getPatientRecords(userId);
            setRecords(data.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load patient records');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!records) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">Patient records not found</p>
            </div>
        );
    }

    const patient = records.patient;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition"
                >
                    <ArrowLeft size={24} />
                    Back
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Patient Records</h1>
                <div className="w-24"></div>
            </div>

            {/* Patient Summary Card */}
            <div className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-2xl shadow-lg border border-primary/20 p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="text-xl font-bold text-gray-800">{patient.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Age</p>
                        <p className="text-xl font-bold text-gray-800">{patient.age || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Gender</p>
                        <p className="text-xl font-bold text-gray-800">{patient.gender || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Appointments</p>
                        <p className="text-xl font-bold text-primary">{records.totalAppointments}</p>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-primary/20">
                    <p className="text-sm text-gray-500">Medical History</p>
                    <p className="text-gray-700">{patient.medicalHistory || 'No medical history recorded'}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('appointments')}
                    className={`px-6 py-3 font-semibold transition border-b-2 ${
                        activeTab === 'appointments'
                            ? 'text-primary border-primary'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                    Appointments ({records.appointments.length})
                </button>
                <button
                    onClick={() => setActiveTab('health')}
                    className={`px-6 py-3 font-semibold transition border-b-2 ${
                        activeTab === 'health'
                            ? 'text-primary border-primary'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                >
                    Health Readings ({records.healthReadings.length})
                </button>
            </div>

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
                <div className="space-y-4">
                    {records.appointments.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl p-8 text-center">
                            <p className="text-gray-500">No appointments found</p>
                        </div>
                    ) : (
                        records.appointments.map((appt, index) => (
                            <motion.div
                                key={appt._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="text-primary" size={24} />
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {new Date(appt.appointmentDate).toLocaleDateString()} at {appt.appointmentTime}
                                            </p>
                                            <p className="text-sm text-gray-500">{appt.diseaseKeyword}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        appt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        appt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                        appt.status.includes('CANCELLED') ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {appt.status}
                                    </span>
                                </div>

                                {appt.consultationNotes && (
                                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Consultation Notes</p>
                                        <p className="text-gray-700">{appt.consultationNotes}</p>
                                    </div>
                                )}

                                {appt.prescriptions && appt.prescriptions.length > 0 && (
                                    <div className="bg-indigo-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Prescriptions</p>
                                        <div className="space-y-2">
                                            {appt.prescriptions.map((med, i) => (
                                                <div key={i} className="bg-white p-3 rounded-lg border border-indigo-100">
                                                    <p className="font-semibold text-gray-800">{med.medicineName}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {med.dosage} • {med.frequency} • {med.duration}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Health Readings Tab */}
            {activeTab === 'health' && (
                <div className="space-y-4">
                    {records.healthReadings.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl p-8 text-center">
                            <p className="text-gray-500">No health readings found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {records.healthReadings.map((reading, index) => (
                                <motion.div
                                    key={reading._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="font-semibold text-gray-800">{reading.readingType}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(reading.readingDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-2xl font-bold text-primary mb-2">
                                        {reading.value} {reading.unit}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default PatientRecords;
