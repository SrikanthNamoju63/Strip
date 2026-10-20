"use client";

import Link from "next/link";
import { Check, ArrowRight, Smartphone, Monitor, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductsPage() {
    return (
        <div className="pb-20 overflow-hidden">
            <section className="relative hero-padding pb-24 overflow-hidden bg-slate-50">
                <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50 to-transparent"></div>

                <div className="container relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 mb-6 tracking-tight">
                            Our Products
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
                            Tech-driven solutions designed to simplify healthcare management. <br className="hidden md:block" />
                            Built for patients, doctors, and hospitals.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="container py-12 space-y-40">
                {/* Product 1: Health Predict App */}
                <ProductSection
                    title="Health Predict App"
                    tagline="For Patients"
                    description="A comprehensive mobile application for patients to book appointments, track vitals, and receive AI-driven health insights. It puts your health data back in your hands."
                    features={[
                        "Easy Doctor Booking",
                        "Real-time Vital Tracking",
                        "Medication Reminders",
                        "Secure Health Records"
                    ]}
                    icon={<Smartphone size={24} />}
                    imageAlign="right"
                    ctaText="Download App"
                    ctaLink="/contact"
                    gradient="from-blue-500 to-cyan-500"
                    idx={0}
                />

                {/* Product 2: Doctor Panel */}
                <ProductSection
                    title="Dr Strip Doctor Panel"
                    tagline="For Professionals"
                    description="A powerful web-based dashboard for doctors to manage appointments, view patient history, and prescribe medication digitally. Optimize your practice with data-driven insights."
                    features={[
                        "Smart Appointment Calendar",
                        "Digital Prescription Pad",
                        "Patient History Timeline",
                        "Earnings & Analytics"
                    ]}
                    icon={<Monitor size={24} />}
                    imageAlign="left"
                    ctaText="For Doctors"
                    ctaLink="/partners"
                    gradient="from-teal-500 to-emerald-500"
                    idx={1}
                />

                {/* Product 3: Admin Platform */}
                <ProductSection
                    title="Super Admin Platform"
                    tagline="For Enterprises"
                    description="An enterprise-grade administration suite for hospitals and healthcare networks to manage multiple doctors, departments, and patient flows efficiently."
                    features={[
                        "Multi-Doctor Management",
                        "Department & Resource Allocation",
                        "Financial Reporting",
                        "Role-Based Access Control"
                    ]}
                    icon={<LayoutDashboard size={24} />}
                    imageAlign="right"
                    ctaText="Request Demo"
                    ctaLink="/contact"
                    gradient="from-indigo-500 to-purple-500"
                    idx={2}
                />
            </div>

            {/* Bottom CTA */}
            <section className="container mt-20 mb-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-slate-900 rounded-[3rem] py-24 px-12 md:py-32 md:px-20 text-center text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-900/40 to-purple-900/40 opacity-50"></div>
                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <h2 className="text-4xl font-bold">Ready to transform your healthcare experience?</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/contact" className="btn bg-blue-600 hover:bg-blue-500 text-white border-none py-4 px-10 text-lg rounded-xl shadow-lg shadow-blue-900/50">
                                Contact Sales
                            </Link>
                            <Link href="/about" className="btn bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 py-4 px-10 text-lg rounded-xl">
                                Learn More
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}

function ProductSection({ title, tagline, description, features, imageAlign, ctaText, ctaLink, gradient, idx, icon }: { title: string, tagline: string, description: string, features: string[], imageAlign: "left" | "right", ctaText: string, ctaLink: string, gradient: string, idx: number, icon: any }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: idx * 0.1 }}
            className={`flex flex-col ${imageAlign === "left" ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-16 lg:gap-24`}
        >
            <div className={`flex-1 space-y-8 ${imageAlign === "left" ? "lg:text-right" : ""}`}>
                <div>
                    <span className={`inline-flex items-center gap-2 py-1 px-3 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider mb-4 ${imageAlign === "left" ? "flex-row-reverse" : ""}`}>
                        {icon}
                        {tagline}
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 leading-tight">{title}</h2>
                </div>

                <p className="text-slate-500 text-xl leading-relaxed">
                    {description}
                </p>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${imageAlign === "left" ? "justify-items-end" : ""}`}>
                    {features.map((feature, i) => (
                        <div key={i} className={`flex items-center gap-3 ${imageAlign === "left" ? "flex-row-reverse text-right" : ""}`}>
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                <Check size={12} strokeWidth={3} />
                            </div>
                            <span className="font-medium text-slate-700">{feature}</span>
                        </div>
                    ))}
                </div>

                <div className={imageAlign === "left" ? "flex justify-end" : ""}>
                    <Link href={ctaLink} className={`inline-flex items-center gap-2 text-white bg-slate-900 hover:bg-slate-800 px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 shadow-xl shadow-slate-900/10 ${imageAlign === "left" ? "flex-row-reverse" : ""}`}>
                        {ctaText} <ArrowRight size={20} />
                    </Link>
                </div>
            </div>

            <div className="flex-1 w-full relative group perspective-1000">
                <div className={`w-full aspect-[4/3] rounded-3xl shadow-2xl bg-gradient-to-br ${gradient} p-1 flex items-center justify-center relative overflow-hidden transform transition-all duration-700 ease-out hover:rotate-y-6 hover:scale-[1.02]`}>
                    <div className="bg-white/10 w-full h-full rounded-[1.3rem] backdrop-blur-sm flex items-center justify-center relative overflow-hidden border border-white/20">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        {/* Fake UI Elements */}
                        <div className="w-3/4 h-3/4 bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">
                            <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-3 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="flex-1 p-6 relative">
                                <div className="h-4 w-1/3 bg-slate-100 rounded mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-2 w-full bg-slate-50 rounded"></div>
                                    <div className="h-2 w-full bg-slate-50 rounded"></div>
                                    <div className="h-2 w-2/3 bg-slate-50 rounded"></div>
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <div className="h-24 bg-blue-50 rounded-lg"></div>
                                    <div className="h-24 bg-purple-50 rounded-lg"></div>
                                </div>

                                {/* Floating Element */}
                                <div className="absolute bottom-6 right-6 w-12 h-12 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center text-white">
                                    <Check size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative blob */}
                <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-20 -z-10`}></div>
            </div>
        </motion.div>
    );
}
