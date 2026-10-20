"use client";

import { Target, Lightbulb, Users, History, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <div className="pb-20 overflow-hidden">
            {/* Hero Section */}
            <section className="relative hero-padding pb-32 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
                <div className="absolute inset-0 bg-grid opacity-10"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/20 to-transparent"></div>

                <div className="container relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <span className="inline-block py-1.5 px-4 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase mb-6 shadow-sm border border-blue-200/50">
                            Our Story
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 mb-6 tracking-tight leading-tight">
                            Redefining <span className="text-blue-600">Healthcare Access</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                            Dr Strip is bridging the gap between patients and providers with next-generation technology designed for humanity.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="container relative -mt-16 z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/20 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 group"
                    >
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Target size={32} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">Our Mission</h2>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            To empower patients with control over their health data and provide doctors with intelligent tools to deliver better care. We simplify every interaction in the ecosystem.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[2.5rem] border border-slate-700/50 shadow-xl shadow-slate-900/20 hover:shadow-2xl transition-all duration-300 group text-white"
                    >
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-white/10">
                            <Lightbulb size={32} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-white">Our Vision</h2>
                        <p className="text-slate-200 text-lg leading-relaxed">
                            To be the world's most trusted digital healthcare partner, creating a seamless network where finding a doctor or tracking vitals is instant and effortless.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Story Section */}
            <section className="container py-32">
                <div className="flex flex-col md:flex-row items-center gap-20">
                    <motion.div
                        className="flex-1 space-y-8"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider text-sm">
                            <History size={16} />
                            <span>History</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                            From a Simple Idea to a <br className="hidden md:block" />
                            <span className="relative z-10 inline-block">
                                <span className="relative z-10">Global Ecosystem</span>
                                <span className="absolute bottom-1 left-0 w-full h-3 bg-blue-100 -z-0"></span>
                            </span>
                        </h2>
                        <div className="space-y-6 text-lg text-slate-600">
                            <p>
                                Founded by a team of healthcare professionals and tech enthusiasts, Dr Strip began with a simple observation: the healthcare experience was fragmented.
                            </p>
                            <p>
                                We set out to build a unified platform. Starting with a simple doctor appointment system, we have grown into a comprehensive ecosystem that includes AI diagnostics, insurance support, and a blood donor network.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button className="flex items-center gap-2 text-blue-600 font-bold hover:gap-4 transition-all group">
                                Read full story <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        className="flex-1 w-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="relative aspect-square">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[3rem] rotate-6 opacity-20 blur-xl"></div>
                            <div className="absolute inset-0 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                                <div className="absolute inset-0 bg-grid opacity-5"></div>
                                {/* Visual Representation */}
                                <div className="relative z-10 grid grid-cols-2 gap-4 p-8 w-full max-w-sm rotate-[-6deg]">
                                    <div className="bg-blue-50 p-4 rounded-xl shadow-lg animate-pulse">
                                        <div className="h-2 w-16 bg-blue-200 rounded mb-2"></div>
                                        <div className="h-20 bg-blue-100 rounded"></div>
                                    </div>
                                    <div className="bg-teal-50 p-4 rounded-xl shadow-lg mt-8">
                                        <div className="h-2 w-16 bg-teal-200 rounded mb-2"></div>
                                        <div className="h-16 bg-teal-100 rounded"></div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-xl shadow-lg -mt-4">
                                        <div className="h-2 w-16 bg-purple-200 rounded mb-2"></div>
                                        <div className="h-24 bg-purple-100 rounded"></div>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-xl shadow-lg mt-4">
                                        <div className="h-2 w-16 bg-orange-200 rounded mb-2"></div>
                                        <div className="h-14 bg-orange-100 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

                <div className="container relative z-10">
                    <motion.div
                        className="text-center mb-16 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 mb-4">Core Values</h2>
                        <p className="text-lg text-slate-600">The principles that guide every decision we make at Dr Strip.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ValueCard
                            title="Patient First"
                            description="Every decision we make starts with the question: How does this improve the patient experience?"
                            color="bg-blue-500"
                            delay={0}
                        />
                        <ValueCard
                            title="Innovation"
                            description="We constantly challenge the status quo to find smarter, faster, and more effective solutions."
                            color="bg-purple-500"
                            delay={0.1}
                        />
                        <ValueCard
                            title="Integrity"
                            description="Trust is the foundation of healthcare. We adhere to the highest standards of data privacy and ethics."
                            color="bg-teal-500"
                            delay={0.2}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function ValueCard({ title, description, color, delay }: { title: string, description: string, color: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
            <div className={`w-2 h-12 ${color} rounded-full mb-6`}></div>
            <h3 className="text-2xl font-bold mb-4 text-slate-800">{title}</h3>
            <p className="text-slate-500 leading-relaxed">{description}</p>
        </motion.div>
    )
}
