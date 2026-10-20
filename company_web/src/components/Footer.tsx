import Link from "next/link";
import { Stethoscope, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import DrStripLogo from "./DrStripLogo";

export default function Footer() {
    return (
        <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
                    {/* Brand */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <DrStripLogo fontSize={26} />
                        </Link>
                        <p className="text-slate-500 leading-relaxed text-sm max-w-xs">
                            Revolutionizing the healthcare ecosystem with cutting-edge technology. Connecting patients, providers, and innovators.
                        </p>
                        <div className="flex gap-4">
                            <SocialLink icon={<Facebook size={18} />} href="#" />
                            <SocialLink icon={<Twitter size={18} />} href="#" />
                            <SocialLink icon={<Instagram size={18} />} href="#" />
                            <SocialLink icon={<Linkedin size={18} />} href="#" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-6 text-lg">Company</h3>
                        <ul className="space-y-4">
                            <FooterLink href="/about">About Us</FooterLink>
                            <FooterLink href="/careers">Careers</FooterLink>
                            <FooterLink href="/blog">Our Blog</FooterLink>
                            <FooterLink href="/contact">Contact Support</FooterLink>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-6 text-lg">Solutions</h3>
                        <ul className="space-y-4">
                            <FooterLink href="/services">For Patients</FooterLink>
                            <FooterLink href="/doctors">For Doctors</FooterLink>
                            <FooterLink href="/enterprise">Enterprise</FooterLink>
                            <FooterLink href="/technology">Technology</FooterLink>
                        </ul>
                    </div>

                    {/* Newsletter / Contact */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-6 text-lg">Stay Updated</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Subscribe to our newsletter for the latest healthcare tech updates.
                        </p>
                        <form className="flex gap-2 mb-8">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white border border-slate-200 px-4 py-2.5 rounded-lg text-sm w-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            <button className="bg-slate-900 text-white p-2.5 rounded-lg hover:bg-blue-600 transition-colors">
                                <ArrowRight size={18} />
                            </button>
                        </form>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-500 text-sm">
                                <Mail size={16} className="text-blue-500" />
                                <span>contact@drstrip.com</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 text-sm">
                                <Phone size={16} className="text-blue-500" />
                                <span>+1 (555) 123-4567</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Dr Strip Healthcare Inc. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ icon, href }: { icon: React.ReactNode; href: string }) {
    return (
        <a
            href={href}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-300"
        >
            {icon}
        </a>
    );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <li>
            <Link
                href={href}
                className="text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium flex items-center gap-1 group"
            >
                <span className="w-0 group-hover:w-2 h-0.5 bg-blue-500 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                {children}
            </Link>
        </li>
    )
}
