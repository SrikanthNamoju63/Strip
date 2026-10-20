"use client";

import { Briefcase, Heart, Cpu, Globe, Rocket, ArrowRight, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CareersPage() {
    return (
        <div className="pb-20 overflow-hidden bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-blue-600 text-white">
                <div className="absolute inset-0 bg-grid opacity-10"></div>

                <div className="container relative z-10 text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <span className="inline-block py-1.5 px-4 rounded-full bg-white/20 text-white text-sm font-bold tracking-wide uppercase border border-white/30 backdrop-blur-sm">
                            Join Our Mission
                        </span>
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                            Build the Future of <br className="hidden md:block" />
                            <span className="text-blue-200">Healthcare Tech</span>
                        </h1>
                        <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
                            We are looking for passionate builders, designers, and problem solvers to help us make quality healthcare accessible to everyone.
                        </p>
                        <div className="pt-6">
                            <Link
                                href="#open-roles"
                                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-lg inline-flex items-center gap-2"
                            >
                                View Open Roles <ArrowRight size={20} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Why Join Us Section */}
            <section className="py-24 bg-white relative">
                <div className="container">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Dr Strip?</h2>
                        <p className="text-lg text-slate-600">
                            We offer more than just a job. We offer a chance to do meaningful work that impacts millions of lives globally.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <BenefitCard
                            icon={<Rocket size={32} />}
                            title="Impact at Scale"
                            description="Every line of code you write and every design you create directly improves someone's healthcare journey."
                            color="blue"
                            delay={0}
                        />
                        <BenefitCard
                            icon={<Heart size={32} />}
                            title="Inclusive Culture"
                            description="We thrive on diversity. A collaborative, ego-free workplace where everyone's voice is heard."
                            color="pink"
                            delay={0.1}
                        />
                        <BenefitCard
                            icon={<Cpu size={32} />}
                            title="Modern Tech Stack"
                            description="Work with cutting-edge tools. We use Next.js, Node, AI/ML, and modern cloud infrastructure."
                            color="teal"
                            delay={0.2}
                        />
                    </div>
                </div>
            </section>

            {/* Open Roles Section */}
            <section id="open-roles" className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="container max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                        <div>
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">Open Positions</h2>
                            <p className="text-lg text-slate-600">
                                Find your next career-defining role at Dr Strip.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-white border border-slate-300 text-slate-700 py-2.5 px-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm">
                                <option>All Departments</option>
                                <option>Engineering</option>
                                <option>Design</option>
                                <option>Product</option>
                                <option>Marketing</option>
                            </select>
                            <select className="bg-white border border-slate-300 text-slate-700 py-2.5 px-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm">
                                <option>All Locations</option>
                                <option>Remote</option>
                                <option>New York, US</option>
                                <option>London, UK</option>
                                <option>Bangalore, IN</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <JobCard
                            title="Senior Full Stack Engineer"
                            department="Engineering"
                            location="Remote"
                            type="Full-time"
                        />
                        <JobCard
                            title="Product Designer (UI/UX)"
                            department="Design"
                            location="New York, US / Remote"
                            type="Full-time"
                        />
                        <JobCard
                            title="Lead Mobile Developer (Flutter)"
                            department="Engineering"
                            location="Remote"
                            type="Full-time"
                        />
                        <JobCard
                            title="Product Marketing Manager"
                            department="Marketing"
                            location="London, UK"
                            type="Full-time"
                        />
                        <JobCard
                            title="Backend Developer (Node.js/Nest)"
                            department="Engineering"
                            location="Bangalore, IN / Remote"
                            type="Full-time"
                        />
                    </div>

                    <div className="mt-12 text-center p-8 bg-blue-50 rounded-3xl border border-blue-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Don't see your role?</h3>
                        <p className="text-slate-600 mb-6">
                            We're always looking for talented people. Send us your resume and we'll keep you in mind.
                        </p>
                        <a
                            href="mailto:careers@drstrip.com"
                            className="inline-flex px-6 py-3 bg-white text-blue-600 border border-blue-200 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                        >
                            Email us: careers@drstrip.com
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

function BenefitCard({ icon, title, description, color, delay }: { icon: React.ReactNode, title: string, description: string, color: string, delay: number }) {
    const colorMap: Record<string, string> = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        pink: "text-pink-600 bg-pink-50 border-pink-100",
        teal: "text-teal-600 bg-teal-50 border-teal-100",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
        >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">{title}</h3>
            <p className="text-slate-600 leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}

function JobCard({ title, department, location, type }: { title: string, department: string, location: string, type: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
            <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                    {title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Briefcase size={16} className="text-slate-400" />
                        {department}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-slate-400" />
                        {location}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock size={16} className="text-slate-400" />
                        {type}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white font-medium rounded-xl transition-colors md:opacity-0 group-hover:opacity-100 focus:opacity-100 w-full md:w-auto">
                    Apply Now
                </button>
            </div>
        </motion.div>
    );
}
