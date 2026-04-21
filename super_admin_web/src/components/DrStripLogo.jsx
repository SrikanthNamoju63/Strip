import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DrStripLogo = ({ fontSize = 40 }) => {
    // Colors derived from the image analysis
    const darkBlue = "#003366"; // "Dr" color
    const tealCyan = "#009999"; // "Strip" color

    const textStyle = {
        fontSize: `${fontSize}px`,
        fontWeight: 'bold',
        lineHeight: 1.0,
        fontFamily: "'Outfit', sans-serif" // Assuming Outfit font is available globally
    };

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const letterVariants = {
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
            className="flex items-center justify-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.span style={{ ...textStyle, color: darkBlue }} variants={letterVariants}>Dr</motion.span>
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
