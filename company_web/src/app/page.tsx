"use client";

import Link from "next/link";
import { ArrowRight, Activity, Calendar, Shield, Cpu, ChevronRight, Star, Users, Download } from "lucide-react";
import { motion } from "framer-motion";
import Testimonials from "./components/Testimonials";

export default function Home() {
  return (
    <div className="overflow-hidden">

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-full bg-slate-50 -z-20"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 -z-10 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/4 -z-10 animate-pulse-slow delay-200"></div>

        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-white border border-blue-100 rounded-full py-2 px-4 shadow-sm mb-8 animate-float">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="text-sm font-semibold text-slate-600 tracking-wide uppercase">Revolutionizing Healthcare</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Digital Healthcare <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                for Everyone.
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
              Dr Strip connects patients, doctors, and healthcare providers through innovative digital platforms. Experience the future of medical technology today.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/contact" className="btn btn-primary group">
                Book a Demo
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/partners" className="btn btn-secondary">
                Partner With Us
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 shadow-sm relative overflow-hidden">
                    {/* Placeholder avatars can be images */}
                    <div className={`w-full h-full bg-gradient-to-br from-slate-200 to-slate-300`}></div>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-yellow-500 mb-1">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} fill="currentColor" />)}
                </div>
                <p className="text-slate-600 font-medium text-sm">Trusted by <strong className="text-slate-900">1000+</strong> Doctors</p>
              </div>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-2xl shadow-blue-200/50 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* Abstract UI Mockup */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100/50">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Health Predict</h3>
                  <p className="text-slate-400 text-sm">Daily Vitals Monitoring</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                  <Activity size={24} />
                </div>
              </div>

              <div className="h-40 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl mb-6 border border-slate-100 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-blue-100/50 to-transparent"></div>
                <SVGGraph />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl">
                  <span className="text-teal-600 text-xs font-bold uppercase block mb-1">Heart Rate</span>
                  <span className="text-2xl font-bold text-teal-900">72 <span className="text-sm font-normal text-teal-600/70">bpm</span></span>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                  <span className="text-indigo-600 text-xs font-bold uppercase block mb-1">Blood Pressure</span>
                  <span className="text-2xl font-bold text-indigo-900">120/80</span>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 bg-white p-4 rounded-2xl shadow-xl z-20 flex items-center gap-3 border border-slate-50"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Shield size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">HIPAA Compliant</p>
                <p className="text-xs text-slate-500">100% Secure Data</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white relative">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-blue-600 font-bold tracking-wide uppercase text-sm mb-2 block">Our Solutions</span>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Comprehensive Healthcare Ecosystem</h2>
            <p className="text-slate-500 text-lg">We provide end-to-end digital solutions that bridge the gap between technology and patient care.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard
              icon={<Calendar className="text-blue-500" size={32} />}
              title="Appointments"
              description="Seamless scheduling platform for clinics and hospitals with AI-powered slot management."
              color="bg-blue-50"
              delay={0}
            />
            <ServiceCard
              icon={<Activity className="text-red-500" size={32} />}
              title="Blood Finder"
              description="Real-time blood bank inventory and intelligent donor matching algorithms."
              color="bg-red-50"
              delay={0.1}
            />
            <ServiceCard
              icon={<Shield className="text-teal-500" size={32} />}
              title="Insurance"
              description="Integrated verification and claims assistance with instant eligibility checks."
              color="bg-teal-50"
              delay={0.2}
            />
            <ServiceCard
              icon={<Cpu className="text-indigo-500" size={32} />}
              title="Software"
              description="Tailored web, mobile, and cloud software solutions for the medical industry."
              color="bg-indigo-50"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* App Highlight Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-blue-500 rounded-full blur-[100px]"></div>
          <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-cyan-500 rounded-full blur-[100px]"></div>
        </div>

        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="relative w-[300px] h-[600px] bg-slate-800 rounded-[3rem] border-[8px] border-slate-700 shadow-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 z-20 rounded-b-xl flex justify-center">
                  <div className="w-24 h-4 bg-slate-900 rounded-b-lg"></div>
                </div>
                {/* Phone Screen Content */}
                <div className="bg-white h-full w-full pt-10 px-4 overflow-hidden relative">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-slate-400 text-xs">Good Morning</h4>
                      <h3 className="text-slate-800 font-bold text-lg">Dr. Smith</h3>
                    </div>
                    <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="bg-blue-600 rounded-2xl p-5 text-white mb-6 shadow-lg shadow-blue-200">
                    <p className="opacity-80 text-xs mb-1">Next Appointment</p>
                    <p className="font-bold text-lg">Sarah Connor</p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20">
                      <span className="text-xs font-mono bg-white/20 px-2 py-1 rounded">10:00 AM</span>
                      <span className="text-xs">General Checkup</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="font-bold text-slate-800 text-sm">Upcoming</p>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-3 items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                        <div>
                          <div className="h-2 w-24 bg-slate-200 rounded mb-1"></div>
                          <div className="h-2 w-16 bg-slate-100 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-block bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-6 border border-white/10">
                Mobile First
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Your Health, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Right in Your Pocket.
                </span>
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Download the Dr Strip Health Predict app to manage appointments, track vitals, and access healthcare from anywhere. Real-time notifications and AI-driven insights at your fingertips.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {["Smart Booking", "Digital Records", "AI Symptom Checker", "Family Health", "Instant Prescriptions", "Video Consults"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/contact" className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20">
                <Download size={20} />
                Get the App
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container relative z-10">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-12 lg:p-20 text-center shadow-2xl relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-400 opacity-10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Ready to modernize your practice?</h2>
            <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">Join 1000+ doctors and hospitals using Dr Strip to streamline operations and improve patient outcomes.</p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                Contact Sales
              </Link>
              <Link href="/doctors" className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors">
                For Doctors
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function ServiceCard({ icon, title, description, color, delay }: { icon: React.ReactNode, title: string, description: string, color: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-blue-100 transition-all duration-300"
    >
      <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed mb-6">
        {description}
      </p>
      <Link href="/services" className="inline-flex items-center text-blue-600 font-bold text-sm hover:gap-2 transition-all group-hover:text-blue-700">
        Learn more <ChevronRight size={16} className="ml-1" />
      </Link>
    </motion.div>
  );
}

// Simple SVG Graph Component for visual flair
function SVGGraph() {
  return (
    <svg viewBox="0 0 500 200" className="w-full h-full text-blue-500/20 stroke-current fill-none" preserveAspectRatio="none">
      <path d="M0,150 C100,100 200,180 300,80 C400,20 500,100 500,100" strokeWidth="4" />
    </svg>
  )
}
