"use client";

import Link from "next/link";
import { UserPlus, HeartPulse, BarChart3, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PartnersPage() {
    return (
        <div className="pb-20 overflow-hidden">
            {/* Custom Hero for Partners */}
            <section className="bg-slate-50 relative hero-padding pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-100/30 rounded-bl-[10rem]"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-teal-100/30 rounded-tr-[10rem]"></div>

                <div className="container relative z-10 flex flex-col md:flex-row items-center gap-16">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 space-y-8"
                    >
                        <span className="inline-block py-2 px-4 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold tracking-widest uppercase mb-2">
                            For Healthcare Providers
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                            Focus on Patients, <br />
                            <span className="text-blue-600">We'll Handle the Rest.</span>
                        </h1>
                        <p className="text-xl text-slate-500 max-w-lg leading-relaxed">
                            Join thousands of top doctors and hospitals using Dr Strip to streamline operations and enhance patient experience using next-gen technology.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link href="/contact" className="btn bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2">
                                Join Network <ArrowRight size={20} />
                            </Link>
                            <Link href="/products" className="btn bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center">
                                Explore Features
                            </Link>
                        </div>

                        <div className="flex items-center gap-6 pt-4 text-sm font-medium text-slate-500">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-green-500" />
                                <span>No Setup Fees</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-green-500" />
                                <span>Instant Onboarding</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50, rotateY: -10 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{ duration: 1 }}
                        className="flex-1 w-full perspective-1000"
                    >
                        {/* Abstract Visual for Doctor Dashboard */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 relative max-w-lg mx-auto transform hover:rotate-y-6 transition-transform duration-500">
                            <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-8">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <HeartPulse size={28} />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-slate-100 rounded-md"></div>
                                    <div className="h-3 w-20 bg-slate-50 rounded-md"></div>
                                </div>
                                <div className="ml-auto bg-green-100 text-green-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">Active</div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-10">
                                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                                    <div className="text-blue-600 font-bold text-4xl mb-2">24</div>
                                    <div className="text-blue-400 text-xs font-bold uppercase tracking-wide">Appointments</div>
                                </div>
                                <div className="bg-teal-50/50 p-6 rounded-3xl border border-teal-100">
                                    <div className="text-teal-600 font-bold text-4xl mb-2">₹12k</div>
                                    <div className="text-teal-400 text-xs font-bold uppercase tracking-wide">Earnings</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="h-16 w-full bg-slate-50 rounded-2xl flex items-center px-6 gap-4 border border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                                    <div className="h-3 w-1/2 bg-slate-200 rounded-full"></div>
                                </div>
                                <div className="h-16 w-full bg-slate-50 rounded-2xl flex items-center px-6 gap-4 border border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                                    <div className="h-3 w-2/3 bg-slate-200 rounded-full"></div>
                                </div>
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -bottom-8 -right-8 bg-white p-5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce-slow">
                                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
                                    <BarChart3 size={24} />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Growth</div>
                                    <div className="font-bold text-slate-800 text-xl">+125%</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="container py-20">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-bold mb-4 text-slate-900">Why Partner With Us?</h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">We empower your practice with tools that drive growth and efficiency.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <BenefitCard
                        icon={<UserPlus size={32} className="text-white" />}
                        title="More Patients"
                        description="Increase your visibility and attract new patients through our robust discovery platform."
                        color="bg-blue-500"
                        delay={0}
                    />
                    <BenefitCard
                        icon={<Clock size={32} className="text-white" />}
                        title="Save Time"
                        description="Automated appointments, reminders, and digital records free up your staff's time."
                        color="bg-teal-500"
                        delay={0.1}
                    />
                    <BenefitCard
                        icon={<HeartPulse size={32} className="text-white" />}
                        title="Better Care"
                        description="Access patient history and vitals instantly to make informed medical decisions."
                        color="bg-rose-500"
                        delay={0.2}
                    />
                    <BenefitCard
                        icon={<BarChart3 size={32} className="text-white" />}
                        title="Grow Revenue"
                        description="Reduce no-shows and optimize clinic efficiency to maximize your practice's revenue."
                        color="bg-indigo-500"
                        delay={0.3}
                    />
                </div>
            </section>

            <section className="bg-slate-900 py-32 mt-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-10"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">Ready to upgrade your clinic?</h2>
                        <p className="text-slate-400 text-xl mb-12 leading-relaxed">
                            Registration is simple and takes less than 10 minutes. Our onboarding team will guide you through every step.
                        </p>

                        <div className="bg-white p-2 rounded-2xl max-w-lg mx-auto flex flex-col sm:flex-row gap-4 shadow-2xl">
                            <input type="email" placeholder="Enter your email address" className="flex-1 bg-transparent border-none px-6 py-4 outline-none text-lg text-slate-800 placeholder-slate-400" />
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-8 rounded-xl transition-colors whitespace-nowrap">
                                Get Started
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mt-6">
                            Join 500+ clinics already using Dr Strip
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

function BenefitCard({ icon, title, description, color, delay }: { icon: React.ReactNode, title: string, description: string, color: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="group"
        >
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg shadow-blue-900/5 group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-800">{title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                    {description}
                </p>
                <div className="mt-auto pt-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    <ArrowRight className="text-slate-300" />
                </div>
            </div>
        </motion.div>
    )
}
