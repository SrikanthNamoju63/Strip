"use client";

import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
    return (
        <div className="pb-20 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="bg-slate-900 text-white hero-padding pb-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-10"></div>
                <div className="container relative z-10 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-bold mb-6"
                    >
                        Get in Touch
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-400 max-w-2xl mx-auto"
                    >
                        Have questions about our products or services? We're here to help you revolutionize healthcare.
                    </motion.p>
                </div>
            </div>

            <div className="container relative z-20 -mt-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-8 shadow-2xl rounded-3xl overflow-hidden bg-white">
                    {/* Contact Info Sidebar */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-10 lg:p-12 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute inset-0 bg-blue-500 opacity-20 mix-blend-overlay"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20"></div>

                        <div className="relative z-10 space-y-12">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
                                <p className="text-blue-100">Fill out the form and our team will get back to you within 24 hours.</p>
                            </div>

                            <div className="space-y-8">
                                <a href="mailto:contact@drstrip.com" className="flex items-start gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-100 text-sm uppercase tracking-wider mb-1">Email</h3>
                                        <p className="text-lg">contact@drstrip.com</p>
                                    </div>
                                </a>

                                <a href="tel:+911234567890" className="flex items-start gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-100 text-sm uppercase tracking-wider mb-1">Phone</h3>
                                        <p className="text-lg">+91 123 456 7890</p>
                                    </div>
                                </a>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-100 text-sm uppercase tracking-wider mb-1">Office</h3>
                                        <p className="text-lg">123 Tech Park, Healthcare City,<br />Innovation Hub, 500001</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-12 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-3 mb-4 text-blue-100">
                                <Clock size={20} />
                                <span className="font-semibold uppercase tracking-wider text-sm">Working Hours</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Mon - Fri</span>
                                    <span className="font-bold">9AM - 6PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Saturday</span>
                                    <span className="font-bold">10AM - 2PM</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2 p-10 lg:p-16 bg-white">
                        <form className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">First Name</label>
                                    <input type="text" className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-3 px-4 transition-colors rounded-t-lg" placeholder="John" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Last Name</label>
                                    <input type="text" className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-3 px-4 transition-colors rounded-t-lg" placeholder="Doe" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                                <input type="email" className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-3 px-4 transition-colors rounded-t-lg" placeholder="john@example.com" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Subject</label>
                                <div className="relative">
                                    <select className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-3 px-4 transition-colors rounded-t-lg appearance-none cursor-pointer">
                                        <option>General Inquiry</option>
                                        <option>Sales / Demo</option>
                                        <option>Partnership</option>
                                        <option>Support</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Message</label>
                                <textarea rows={4} className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-3 px-4 transition-colors rounded-t-lg resize-none" placeholder="Tell us how we can help..."></textarea>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-slate-800 transition-all hover:scale-[1.02] shadow-xl shadow-slate-900/10">
                                    Send Message
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
