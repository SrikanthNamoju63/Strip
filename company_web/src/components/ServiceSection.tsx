"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import React from "react";

interface ServiceSectionProps {
    title: string;
    description: string;
    features: string[];
    icon: React.ReactNode;
    direction: "ltr" | "rtl";
    color: string;
    idx: number;
}

export default function ServiceSection({ title, description, features, icon, direction, color, idx }: ServiceSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: idx * 0.1 }}
            className={`flex flex-col ${direction === "rtl" ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-16`}
        >
            <div className="flex-1 space-y-8">
                <div className={`w-20 h-20 rounded-2xl ${color} shadow-lg shadow-blue-500/20 flex items-center justify-center mb-6 transform rotate-3`}>
                    {icon}
                </div>
                <h2 className="text-4xl font-bold text-slate-800">{title}</h2>
                <p className="text-slate-500 text-xl leading-relaxed">{description}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 font-medium text-slate-700">
                            <div className={`w-6 h-6 rounded-full ${color}/10 flex items-center justify-center ${color.replace('bg-', 'text-')}`}>
                                <Check size={14} strokeWidth={3} />
                            </div>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex-1 w-full">
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500">
                    <div className={`absolute top-0 right-0 w-64 h-64 ${color} opacity-5 rounded-bl-full transition-transform duration-700 group-hover:scale-110`}></div>
                    <div className={`absolute bottom-0 left-0 w-48 h-48 ${color} opacity-5 rounded-tr-full transition-transform duration-700 group-hover:scale-110`}></div>

                    <div className="bg-slate-50 rounded-[2rem] aspect-[4/3] w-full flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
                        {/* Abstract UI Representation */}
                        <div className="relative z-10 w-3/4 h-3/4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl flex flex-col p-4 gap-3 transform group-hover:scale-105 transition-transform duration-500 hover:rotate-2">
                            {/* Header fake */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                <div className="h-2 w-20 bg-slate-200/50 rounded-full"></div>
                            </div>
                            {/* Body fake content */}
                            <div className="flex-1 flex gap-3">
                                <div className="w-1/3 h-full bg-slate-50/50 rounded-lg animate-pulse" style={{ animationDuration: '3s' }}></div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="h-2 w-full bg-slate-200/50 rounded-full"></div>
                                    <div className="h-2 w-4/5 bg-slate-200/50 rounded-full"></div>
                                    <div className="h-2 w-3/4 bg-slate-200/50 rounded-full"></div>
                                    <div className="mt-auto h-24 w-full bg-gradient-to-br from-white/20 to-transparent rounded-lg border border-white/20"></div>
                                </div>
                            </div>
                        </div>

                        {/* Abstract Shapes */}
                        <div className={`absolute top-10 left-10 w-20 h-20 ${color} opacity-10 rounded-full blur-xl`}></div>
                        <div className={`absolute bottom-10 right-10 w-32 h-32 ${color} opacity-10 rounded-full blur-2xl`}></div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
