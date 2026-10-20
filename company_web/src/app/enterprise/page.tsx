"use client";

import { Building2, ShieldCheck, Zap, BarChart3, Users, Globe, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function EnterprisePage() {
    return (
        <div className="pb-20 overflow-hidden bg-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 bg-grid opacity-10"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/20 to-transparent"></div>

                <div className="container relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-8"
                        >
                            <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/20 text-blue-300 text-sm font-bold tracking-wide uppercase border border-blue-400/30">
                                For Healthcare Organizations
                            </span>
                            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                                Transform Your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                                    Healthcare Delivery
                                </span>
                            </h1>
                            <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                                Empower your hospital network, clinic chain, or health insurance firm with our comprehensive digital infrastructure designed for scale, security, and exceptional patient experiences.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/contact"
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2"
                                >
                                    Book a Demo <ArrowRight size={20} />
                                </Link>
                                <Link
                                    href="#features"
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-colors flex items-center justify-center"
                                >
                                    Explore Features
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-3xl blur-3xl opacity-20"></div>
                            <div className="relative bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl">
                                <div className="space-y-6">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-4 items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                                                <BarChart3 className="text-blue-400" size={24} />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-2 w-1/3 bg-slate-700 rounded"></div>
                                                <div className="h-2 w-full bg-slate-700/50 rounded"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-blue-600 text-white border-y border-blue-700">
                <div className="container">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: "99.99%", label: "Uptime SLA" },
                            { value: "50M+", label: "Patient Records" },
                            { value: "HIPAA", label: "Compliant" },
                            { value: "24/7", label: "Premium Support" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                                <div className="text-blue-200 font-medium">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features list */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="container">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Enterprise-Grade Infrastructure</h2>
                        <p className="text-lg text-slate-600">
                            Dr Strip provides everything your organization needs to manage operations, secure patient data, and improve clinical outcomes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Building2 size={32} />}
                            title="Multi-Branch Management"
                            description="Centrally manage multiple hospital and clinic locations from a single dashboard with granular access controls."
                            color="blue"
                        />
                        <FeatureCard
                            icon={<ShieldCheck size={32} />}
                            title="Advanced Security"
                            description="Military-grade encryption, role-based access control (RBAC), and full compliance with HIPAA and GDPR standards."
                            color="teal"
                        />
                        <FeatureCard
                            icon={<Zap size={32} />}
                            title="High Performance API"
                            description="Integrate seamlessly with your existing EHR/EMR systems and third-party tools via our robust REST APIs."
                            color="purple"
                        />
                        <FeatureCard
                            icon={<BarChart3 size={32} />}
                            title="Predictive Analytics"
                            description="Leverage AI-driven insights to forecast patient flow, optimize resource allocation, and identify health trends."
                            color="orange"
                        />
                        <FeatureCard
                            icon={<Users size={32} />}
                            title="Workforce Management"
                            description="Streamline doctor scheduling, payroll integration, and performance tracking across your entire network."
                            color="pink"
                        />
                        <FeatureCard
                            icon={<Globe size={32} />}
                            title="Telehealth Suite"
                            description="Deploy white-labeled, high-definition video consultations integrated directly into your custom patient portal."
                            color="cyan"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-teal-500/20"></div>
                        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                                Ready to scale your healthcare operations?
                            </h2>
                            <p className="text-xl text-slate-300">
                                Talk to our enterprise solutions team to get a custom deployment plan tailored to your organization's unique requirements.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                                <Link
                                    href="/contact"
                                    className="px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl transition-all shadow-xl"
                                >
                                    Contact Sales
                                </Link>
                                <a
                                    href="mailto:enterprise@drstrip.com"
                                    className="px-8 py-4 bg-transparent border border-white/30 text-white hover:bg-white/10 font-bold rounded-xl transition-all"
                                >
                                    Email Us directly
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
    const colorMap: Record<string, string> = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        teal: "text-teal-600 bg-teal-50 border-teal-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100",
        orange: "text-orange-600 bg-orange-50 border-orange-100",
        pink: "text-pink-600 bg-pink-50 border-pink-100",
        cyan: "text-cyan-600 bg-cyan-50 border-cyan-100"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-shadow group"
        >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}
