"use client";

import { Server, Smartphone, Globe, Lock, Cpu, Check, ArrowRight, ShieldCheck, Zap, Database } from "lucide-react";
import { motion } from "framer-motion";

export default function TechnologyPage() {
    return (
        <div className="overflow-hidden">
            {/* Page Header */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[120px] opacity-20 translate-x-1/3 -translate-y-1/3 animate-pulse-slow"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[100px] opacity-20 -translate-x-1/3 translate-y-1/3"></div>
                    <div className="absolute inset-0 bg-[url('https://api.placeholder.com/grid')] opacity-10"></div>
                </div>

                <div className="container relative z-10 text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-blue-300 text-sm font-bold uppercase tracking-wider mb-6 border border-white/10">
                            <Cpu size={16} />
                            State of the Art
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
                            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Scale & Security</span>
                        </h1>
                        <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
                            Our platform relies on a modern, high-performance tech stack designed to handle millions of interactions with bank-grade security and 99.9% uptime.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="container py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                    <TechCard
                        icon={<Smartphone size={32} className="text-white" />}
                        title="Mobile Experience"
                        description="Native performance using Flutter for a seamless experience on both iOS and Android. Real-time updates via WebSockets."
                        color="bg-gradient-to-br from-blue-500 to-blue-600"
                        delay={0.1}
                    />
                    <TechCard
                        icon={<Globe size={32} className="text-white" />}
                        title="Web Platforms"
                        description="Fast, SEO-optimized web applications built with Next.js and React. Responsive design ensuring access on any device."
                        color="bg-gradient-to-br from-teal-400 to-teal-600"
                        delay={0.2}
                    />
                    <TechCard
                        icon={<Server size={32} className="text-white" />}
                        title="Cloud Infrastructure"
                        description="Scalable backend architecture running on AWS/GCP, ensuring 99.9% uptime and low-latency data access globally."
                        color="bg-gradient-to-br from-indigo-500 to-indigo-700"
                        delay={0.3}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-2 block">Security First</span>
                        <h2 className="text-4xl font-bold text-slate-900 mt-2 mb-6">Fortress-Grade Data Protection</h2>
                        <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                            Healthcare data is sensitive. We employ state-of-the-art encryption and security protocols to ensure patient confidentiality and data integrity at every layer of our stack.
                        </p>

                        <div className="space-y-6">
                            <SecurityPoint
                                title="End-to-End Encryption"
                                description="All data communication between our apps and servers is encrypted using TLS 1.3 standards. Data at rest is AES-256 encrypted."
                            />
                            <SecurityPoint
                                title="HIPAA/GDPR Compliance"
                                description="Our data handling practices adhere to strict global healthcare compliance regulations, ensuring legal and ethical standards."
                            />
                            <SecurityPoint
                                title="Secure Authentication"
                                description="Multi-factor authentication (MFA) and distinct role-based access control (RBAC) ensure only authorized personnel access sensitive data."
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-gradient-to-br from-blue-50 to-white rounded-[2.5rem] p-12 border border-blue-100 shadow-2xl flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden group"
                    >
                        {/* Interactive Lock Animation Container */}
                        <div className="absolute inset-0 bg-[url('https://api.placeholder.com/grid')] opacity-5 pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>

                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl relative z-10 group-hover:scale-110 transition-transform duration-500 border border-blue-50">
                            <Lock size={56} strokeWidth={1.5} className="group-hover:text-blue-500 transition-colors" />
                            <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-200 animate-spin-slow" style={{ animationDuration: '10s' }}></div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold mb-3 text-slate-800">Your Data is Safe</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                We undergo regular security audits and penetration testing to keep our digital fortress secure against evolving threats.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <section className="bg-slate-50 border-t border-slate-200 py-24">
                <div className="container text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Powered By Best-in-Class Tech</h2>
                        <p className="text-slate-500 mb-12 max-w-2xl mx-auto">We leverage the most advanced and reliable frameworks to build our ecosystem.</p>

                        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                            <TechBadge name="React" icon={<Zap size={16} />} color="text-blue-500" />
                            <TechBadge name="Next.js" icon={<Globe size={16} />} color="text-slate-900" />
                            <TechBadge name="Node.js" icon={<Server size={16} />} color="text-green-600" />
                            <TechBadge name="Flutter" icon={<Smartphone size={16} />} color="text-cyan-500" />
                            <TechBadge name="MongoDB" icon={<Database size={16} />} color="text-green-500" />
                            <TechBadge name="AWS" icon={<Cpu size={16} />} color="text-orange-500" />
                            <TechBadge name="Socket.io" icon={<Zap size={16} />} color="text-slate-800" />
                            <TechBadge name="Redis" icon={<Database size={16} />} color="text-red-500" />
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

function TechCard({ icon, title, description, color, delay }: { icon: React.ReactNode, title: string, description: string, color: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.6 }}
            whileHover={{ y: -10 }}
            className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-start h-full group"
        >
            <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-slate-500 leading-loose text-lg">{description}</p>
        </motion.div>
    )
}

function SecurityPoint({ title, description }: { title: string, description: string }) {
    return (
        <div className="flex gap-5 p-5 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all border border-transparent hover:border-slate-100 group">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 mt-1 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
                <h4 className="font-bold text-slate-900 mb-2 text-lg group-hover:text-teal-700 transition-colors">{title}</h4>
                <p className="text-slate-500 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

function TechBadge({ name, icon, color }: { name: string, icon?: React.ReactNode, color?: string }) {
    return (
        <span className={`text-base font-bold px-6 py-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-blue-300 hover:shadow-md transition-all cursor-default flex items-center gap-2 hover:-translate-y-1`}>
            <span className={color}>{icon}</span>
            {name}
        </span>
    )
}
