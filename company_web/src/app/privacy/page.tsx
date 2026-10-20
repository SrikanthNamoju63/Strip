"use client";

import { Lock, Eye, CheckCircle, Database, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
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
                            Privacy Policy
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
                            <Eye className="text-blue-500" />
                            1. Information We Collect
                        </h2>
                        <div className="text-slate-600 space-y-4 leading-relaxed">
                            <p>
                                At Dr Strip, protecting your health and personal information is our highest priority. We collect only the information necessary to provide our services.
                            </p>
                            <ul className="list-none space-y-3 mt-4">
                                {[
                                    "Personal Identifiers (Name, Email, Phone number, Profile photo).",
                                    "Medical and Health Information provided by you or your doctors during consultations.",
                                    "Payment and billing information securely processed through our third-party payment gateways.",
                                    "Device data and usage logs used to secure and optimize the platform."
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3">
                                        <Database className="text-teal-500 shrink-0 mt-0.5" size={20} />
                                        <span>{item}</span>
                                    </li>
                                ))}
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
                            <Activity className="text-blue-500" />
                            2. How We Use Your Data
                        </h2>
                        <div className="text-slate-600 space-y-4 leading-relaxed">
                            <p>
                                The data we collect is used strictly to enhance your healthcare experience and deliver the features promised in our platform.
                            </p>
                            <ul className="list-none space-y-3 mt-4">
                                {[
                                    "To verify your identity and manage patient-doctor relationships.",
                                    "To schedule and complete appointments efficiently.",
                                    "To securely store medical history only accessible to you and your selected providers.",
                                    "To send timely notifications for upcoming health events or reminders."
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3">
                                        <CheckCircle className="text-indigo-500 shrink-0 mt-0.5" size={20} />
                                        <span>{item}</span>
                                    </li>
                                ))}
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
                            <Lock className="text-blue-500" />
                            3. Data Security
                        </h2>
                        <div className="text-slate-600 space-y-4 leading-relaxed">
                            <p>
                                We employ industry-leading encryption and strict data protection policies conforming to the latest healthcare data standards (e.g., HIPAA compliance principles). Your data is hosted on secure, audited cloud environments, and our internal staff cannot view your personal medical records.
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
                                Privacy Concerns?
                            </h2>
                            <p className="text-slate-500">
                                Contact our Data Protection Officer for any inquiries about how we handle your data.
                            </p>
                        </div>
                        <a
                            href="mailto:privacy@drstrip.com"
                            className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shrink-0"
                        >
                            privacy@drstrip.com
                        </a>
                    </motion.div>

                </div>
            </section>
        </div>
    );
}
