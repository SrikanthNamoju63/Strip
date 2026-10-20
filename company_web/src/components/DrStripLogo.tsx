"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

interface DrStripLogoProps {
    fontSize?: number;
    className?: string; // Allow passing external classes for flexibility
}

const DrStripLogo = ({ fontSize = 40, className = "" }: DrStripLogoProps) => {
    // Colors derived from the image analysis / Super Admin Web
    const darkBlue = "#003366"; // "Dr" color
    const tealCyan = "#009999"; // "Strip" color

    const textStyle = {
        fontSize: `${fontSize}px`,
        fontWeight: 'bold',
        lineHeight: 1.0,
    };

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const letterVariants: Variants = {
        hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
                duration: 0.4
            }
        }
    };

    return (
        <motion.div
            className={`flex items-center justify-center ${outfit.className} ${className}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.span style={{ ...textStyle, color: darkBlue }} variants={letterVariants}>D</motion.span>
            <motion.span style={{ ...textStyle, color: darkBlue }} variants={letterVariants}>r</motion.span>
            <span style={{ width: fontSize * 0.2 }}></span>
            <motion.span style={{ ...textStyle, color: tealCyan }} variants={letterVariants}>S</motion.span>
            <motion.span style={{ ...textStyle, color: tealCyan }} variants={letterVariants}>t</motion.span>
            <motion.span style={{ ...textStyle, color: tealCyan }} variants={letterVariants}>r</motion.span>
            <motion.span style={{ ...textStyle, color: tealCyan }} variants={letterVariants}>i</motion.span>
            <motion.span style={{ ...textStyle, color: tealCyan }} variants={letterVariants}>p</motion.span>
        </motion.div>
    );
};

export default DrStripLogo;
