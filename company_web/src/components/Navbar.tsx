"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Stethoscope, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DrStripLogo from "./DrStripLogo";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Services", href: "/services" },
        { name: "Products", href: "/products" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <header
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "glass shadow-md py-3" : "py-5 bg-transparent"
                }`}
        >
            <div className="container flex items-center justify-between">
                {/* Logo */}
                {/* Logo */}
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <DrStripLogo fontSize={26} />
                </Link>

                {/* Desktop Menu */}
                <nav className="hidden md:flex items-center gap-1 bg-white/50 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/60 shadow-sm">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${pathname === link.href
                                ? "text-blue-600 bg-blue-50/80 shadow-sm"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white"
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    <Link
                        href="/partners"
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        Partners
                    </Link>
                    <Link
                        href="/contact"
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:translate-y-0.5 hover:shadow-md transition-all flex items-center gap-2"
                    >
                        Get App
                        <ChevronRight size={16} className="opacity-60" />
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    onClick={() => setIsOpen(true)}
                >
                    <Menu size={28} />
                </button>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-[80%] max-w-sm bg-white z-50 shadow-2xl p-6 md:hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-xl font-bold text-slate-900">Menu</span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`px-4 py-4 rounded-xl text-lg font-medium transition-colors ${pathname === link.href
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <Link
                                    href="/contact"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
                                >
                                    Download App
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
