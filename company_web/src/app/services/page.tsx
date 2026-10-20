"use client";

import { Calendar, Activity, ShieldCheck, HeartPulse, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import ServiceSection from "@/components/ServiceSection";

export default function ServicesPage() {
    return (
        <div className="pb-20 overflow-hidden">
            <section className="relative hero-padding pb-40 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 bg-grid opacity-10"></div>
                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-900/50 to-transparent"></div>

                <div className="container relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl"
                    >
                        <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight">
                            For <span className="text-blue-400">Patients</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl leading-relaxed">
                            Experience healthcare that revolves around you. From booking appointments to monitoring your health, we put control back in your hands.
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
                    title="Easy Appointment Booking"
                    description="Skip the waiting room. Book appointments with top-rated doctors in your area with just a few taps. View real-time availability and manage your schedule effortlessly."
                    features={["Instant Booking", "Real-time Availability", "Smart Reminders", "Reschedule in Seconds"]}
                    icon={<Calendar size={32} className="text-white" />}
                    color="bg-blue-500"
                    direction="ltr"
                    idx={0}
                />

                {/* Service 2 */}
                <ServiceSection
                    title="Find Doctors by Specialization"
                    description="Looking for a specific specialist? Our advanced search lets you filter doctors by specialization, experience, and patient ratings to find the perfect match for your needs."
                    features={["Advanced Search Filters", "Verified Doctor Profiles", "Patient Reviews & Ratings", "Map View Integration"]}
                    icon={<Search size={32} className="text-white" />}
                    color="bg-indigo-500"
                    direction="rtl"
                    idx={1}
                />

                {/* Service 3 */}
                <ServiceSection
                    title="Blood Donor Finder"
                    description="In emergencies, every second counts. Quickly locate nearby blood donors and blood banks. Our network connects those in need with those ready to help."
                    features={["Real-time Donor location", "Direct Contact Options", "Emergency Alerts", "Donor Verification"]}
                    icon={<Activity size={32} className="text-white" />}
                    color="bg-rose-500"
                    direction="ltr"
                    idx={2}
                />

                {/* Service 4 */}
                <ServiceSection
                    title="Health Monitoring & Readings"
                    description="Keep track of your vital stats. Log and monitor your blood pressure, sugar levels, and other health metrics over time to stay on top of your well-being."
                    features={["Vital Sign Logging", "Trend Analysis Charts", "Health Reports", "Share with Doctors"]}
                    icon={<HeartPulse size={32} className="text-white" />}
                    color="bg-teal-500"
                    direction="rtl"
                    idx={3}
                />

                {/* Service 5 */}
                <ServiceSection
                    title="Insurance Integration"
                    description="Simplify your healthcare payments. Link your insurance provider to check eligibility and enjoy cashless transactions at network hospitals."
                    features={["Policy Linking", "Eligibility Check", "Cashless Claims", "Benefit Overview"]}
                    icon={<ShieldCheck size={32} className="text-white" />}
                    color="bg-purple-500"
                    direction="ltr"
                    idx={4}
                />
            </div>

            <section className="container mt-32">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] py-24 px-12 md:py-32 md:px-20 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-grid opacity-10"></div>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to take control?</h2>
                        <p className="text-blue-100 text-lg md:text-xl mb-10 leading-relaxed">
                            Download the mobile app today and experience the future of personal healthcare management.
                        </p>
                        <Link href="/download" className="inline-flex items-center gap-2 bg-white text-blue-700 px-10 py-5 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                            Download App <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
