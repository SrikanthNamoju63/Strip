"use client";

import { Shield, FileText, CheckCircle, AlertCircle, Calendar, CreditCard, RefreshCw, Droplet, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsPage() {
    return (
        <div className="pb-20 overflow-hidden bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-24 pb-16 overflow-hidden bg-white border-b border-slate-200">
                <div className="absolute inset-0 bg-grid opacity-5"></div>
                <div className="container relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="max-w-3xl border-l-4 border-blue-500 pl-6"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                            Terms and Conditions
                        </h1>
                        <p className="text-lg text-slate-500">
                            Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Content Section */}
            <section className="container py-16">
                <div className="max-w-4xl mx-auto space-y-12">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 mb-6">
                            <FileText className="text-blue-500" />
                            1. Acceptance of Terms
                        </h2>
                        <div className="text-slate-600 space-y-4 leading-relaxed">
                            <p>
                                Welcome to Dr Strip. By accessing or using our website, mobile application, or any of our related healthcare services (collectively, the &quot;Platform&quot;), you agree to comply with and be bound by these Terms and Conditions.
                            </p>
                            <p>
                                If you do not agree with any part of these terms, you must not use our Platform. These terms apply to all patients, healthcare providers, blood donors, and visitors accessing the Platform.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 mb-6">
                            <Stethoscope className="text-teal-500" />
                            2. Medical Disclaimer & Doctor Consultations
                        </h2>
                        <div className="p-6 bg-teal-50 rounded-2xl border border-teal-100 text-slate-700 leading-relaxed mb-6">
                            <p className="font-semibold text-teal-900 mb-2">
                                Important Notice: Dr Strip is a technology platform connecting patients with independent healthcare providers. We are not a medical facility and do not provide medical advice.
                            </p>
                            <p>
                                The content provided on the Platform is for informational purposes only. Do not disregard or delay seeking professional medical advice because of something you read on the Dr Strip Platform.
                            </p>
                        </div>
                        <div className="text-slate-600 space-y-4 leading-relaxed">
                            <ul className="list-none space-y-3">
                                <li className="flex gap-3">
                                    <CheckCircle className="text-teal-500 shrink-0 mt-0.5" size={20} />
                                    <span><strong>Provider Independence:</strong> Doctors and healthcare professionals on the Platform are independent practitioners, not employees of Dr Strip. They are solely responsible for the medical services and advice they provide.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle className="text-teal-500 shrink-0 mt-0.5" size={20} />
                                    <span><strong>Emergency Situations:</strong> In case of a medical emergency, do not use this Platform. Call your local emergency services immediately.</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 mb-6">
                            <Calendar className="text-blue-500" />
                            3. Appointments: Time and Date
                        </h2>
                        <div className="text-slate-600 space-y-4 leading-relaxed">
                            <p>
                                The Platform allows you to schedule appointments with healthcare providers based on their real-time availability.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-blue-500">
                                <li><strong>Accuracy of Scheduling:</strong> While we strive for accuracy, appointment times are subject to the doctor's actual availability on the day. Delays may occur due to prior extended consultations or medical emergencies handled by the provider.</li>
                                <li><strong>Time Zones:</strong> All appointment dates and times are displayed in the local time zone of the clinic or hospital, unless explicitly stated otherwise.</li>
                                <li><strong>Arrival:</strong> For in-person visits, patients are advised to arrive at least 15 minutes before the scheduled time. For tele-consultations, please log in 5 minutes early.</li>
                            </ul>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 mb-6">
                            <CreditCard className="text-purple-500" />
                            4. Payments, Fees & Billing
                        </h2>
                        <div className="text-slate-600 space-y-4 leading-relaxed">
                            <p>
                                Dr Strip securely processes payments for appointments and related healthcare services via integrated third-party payment gateways.
                            </p>
                            <ul className="list-none space-y-3 mt-4">
                                <li className="flex gap-3">
                                    <CheckCircle className="text-purple-500 shrink-0 mt-0.5" size={20} />
                                    <span><strong>Consultation Fees:</strong> Fees are set by the individual doctors or clinics. Dr Strip may charge a small service/convenience fee on top of the consultation fee, which will be transparently displayed at checkout.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle className="text-purple-500 shrink-0 mt-0.5" size={20} />
                                    <span><strong>Payment Processing:</strong> Full payment or a required deposit must be made at the time of booking to secure an appointment, depending on the provider's policy.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle className="text-purple-500 shrink-0 mt-0.5" size={20} />
                                    <span><strong>Taxes:</strong> All applicable taxes will be added to the final billing amount as per local regulations.</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 mb-6">
                            <RefreshCw className="text-orange-500" />
                            5. Cancellations, Rescheduling & Refunds
                        </h2>
                        <div className="text-slate-600 space-y-4 leading-relaxed">
                            <p>
                                We understand that plans change. Our cancellation and rescheduling policies are designed to be fair to both patients and doctors.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-orange-500">
                                <li><strong>Rescheduling by Patient:</strong> Appointments can be rescheduled for free if done at least 12 hours prior to the scheduled time. Rescheduling within 12 hours may be subject to availability and potential fees.</li>
                                <li><strong>Cancellations by Patient:</strong> If you cancel your appointment at least 24 hours in advance, a full refund (excluding gateway charges) will be issued. Cancellations made within less than 24 hours may incur a cancellation fee. "No-shows" will not be eligible for a refund.</li>
                                <li><strong>Cancellations by Doctor:</strong> In the rare event a doctor cancels your appointment, you will be notified immediately and offered a full refund or the option to reschedule at your convenience.</li>
                                <li><strong>Refund Timeline:</strong> Approved refunds will be processed back to the original payment method within 5-7 business days.</li>
                            </ul>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 mb-6">
                            <Droplet className="text-red-500" />
                            6. Blood Finder & Donation Services
                        </h2>
                        <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-slate-700 leading-relaxed mb-6">
                            <p>
                                Dr Strip offers a community-driven blood donation matching service ("Blood Finder"). This feature is strictly for facilitating life-saving connections and is bound by ethical guidelines.
                            </p>
                        </div>
                        <div className="text-slate-600 space-y-4 leading-relaxed">
                            <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-red-500">
                                <li><strong>No Commercial Intent:</strong> Buying or selling blood is strictly prohibited. The Blood Finder feature is purely for voluntary donations. Any user found soliciting money for blood will be permanently banned.</li>
                                <li><strong>Verification:</strong> While we attempt to verify requests, Dr Strip does not guarantee the medical suitability of the donor or the exact matching of blood groups. Final verification and medical screening must be done by the recognized hospital or blood bank at the time of donation.</li>
                                <li><strong>Privacy:</strong> Donor and requester contact details are shared only when an explicit connection request is approved.</li>
                            </ul>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm"
                    >
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <AlertCircle className="text-slate-500" />
                            7. Limitation of Liability
                        </h2>
                        <div className="text-slate-600 space-y-4 leading-relaxed">
                            <p>
                                To the maximum extent permitted by applicable law, Dr Strip and its affiliates, officers, employees, agents, partners, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of the Platform, or your interactions with doctors, clinics, or blood donors found through the Platform.
                            </p>
                            <p>
                                We do not endorse any specific tests, physicians, products, procedures, or opinions mentioned on the Platform.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between"
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">
                                Got questions?
                            </h2>
                            <p className="text-slate-500">
                                Contact our support or legal team for clarification on any of these terms.
                            </p>
                        </div>
                        <a
                            href="mailto:legal@drstrip.com"
                            className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shrink-0 shadow-lg shadow-slate-200"
                        >
                            legal@drstrip.com
                        </a>
                    </motion.div>

                </div>
            </section>
        </div>
    );
}
