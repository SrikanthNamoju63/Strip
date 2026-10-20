"use client";

import { Stethoscope, LayoutDashboard, CalendarCheck, Clock, TrendingUp, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import ServiceSection from "@/components/ServiceSection";

export default function DoctorsPage() {
    return (
        <div className="pb-20 overflow-hidden">
            <section className="relative hero-padding pb-40 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 bg-grid opacity-10"></div>
                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-teal-900/50 to-transparent"></div>

                <div className="container relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl"
                    >
                        <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight">
                            For <span className="text-teal-400">Doctors</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl leading-relaxed">
                            Empowering healthcare providers with modern tools. Streamline your practice, manage appointments, and grow your patient base with ease.
                        </p>
                    </motion.div>
                </div>

                {/* Curved divider */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                    <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[60px] fill-white">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
                    </svg>
                </div>
            </section>

            <div className="container space-y-40 -mt-20 relative z-20">
                {/* Service 1 */}
                <ServiceSection
                    title="Quick & Detailed Registration"
                    description="Join our network in minutes. Our streamlined registration process captures your professional details, qualifications, and clinic information to create a comprehensive profile."
                    features={["Paperless Onboarding", "Document Upload & Verification", "Profile Customization", "Instant Activation"]}
                    icon={<Stethoscope size={32} className="text-white" />}
                    color="bg-teal-500"
                    direction="ltr"
                    idx={0}
                />

                {/* Service 2 */}
                <ServiceSection
                    title="Comprehensive Dashboard"
                    description="Get a bird's-eye view of your practice. Our intuitive dashboard provides real-time insights into your upcoming appointments, earnings, and patient statistics."
                    features={["Appointment Overview", "Daily Schedule", "Patient Analytics", "Performance Metrics"]}
                    icon={<LayoutDashboard size={32} className="text-white" />}
                    color="bg-blue-500"
                    direction="rtl"
                    idx={1}
                />

                {/* Service 3 */}
                <ServiceSection
                    title="Smart Appointment Management"
                    description="Manage your schedule with precision. View, accept, or reschedule appointments effortlessly. Automated notifications keep your patients informed."
                    features={["Calendar View", "One-Click Status Updates", "Patient History Access", "No-show Management"]}
                    icon={<CalendarCheck size={32} className="text-white" />}
                    color="bg-indigo-500"
                    direction="ltr"
                    idx={2}
                />

                {/* Service 4 */}
                <ServiceSection
                    title="Flexible Availability Settings"
                    description="Your time, your rules. Set your consulting hours, mark holidays, and manage buffer times between appointments to maintain a healthy work-life balance."
                    features={["Customizable Slots", "Break Time Management", "Holiday Mode", "Automated Slot Generation"]}
                    icon={<Clock size={32} className="text-white" />}
                    color="bg-orange-500"
                    direction="rtl"
                    idx={3}
                />

                {/* Service 5 */}
                <ServiceSection
                    title="Earnings & Analytics"
                    description="Track your financial growth. Monitor your daily, weekly, and monthly earnings with detailed reports and payout histories."
                    features={["Revenue Tracking", "Payout History", "Consultation Fee Management", "Financial Reports"]}
                    icon={<TrendingUp size={32} className="text-white" />}
                    color="bg-emerald-500"
                    direction="ltr"
                    idx={4}
                />

                {/* Service 6 */}
                <ServiceSection
                    title="Patient Feedback & Reviews"
                    description="Build your reputation. Collect and view patient feedback to improve your services and attract more patients through verified ratings."
                    features={["Verified Patient Reviews", "Rating System", "Feedback Management", "Reputation Building"]}
                    icon={<MessageSquare size={32} className="text-white" />}
                    color="bg-purple-500"
                    direction="rtl"
                    idx={5}
                />
            </div>

            <section className="container mt-32">
                <div className="bg-gradient-to-r from-teal-600 to-green-700 rounded-[3rem] py-24 px-12 md:py-32 md:px-20 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-grid opacity-10"></div>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Grow your practice today</h2>
                        <p className="text-teal-100 text-lg md:text-xl mb-10 leading-relaxed">
                            Join thousands of doctors who are digitizing their practice with our platform.
                        </p>
                        <Link href="/doctor-registration.html" target="_blank" className="inline-flex items-center gap-2 bg-white text-teal-700 px-10 py-5 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                            Register Now <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
