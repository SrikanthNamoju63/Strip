const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// GET all active banners
router.get('/', async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true });

        // If no banners exist, seed some default ones (for demo purposes)
        if (banners.length === 0) {
            const defaultBanners = [
                {
                    imageUrl: "https://img.freepik.com/free-vector/flat-design-medical-webinar-template_23-2149021644.jpg",
                    title: "Online Consultations",
                    isActive: true
                },
                {
                    imageUrl: "https://img.freepik.com/free-vector/flat-medical-conference-webinar-template_23-2149622956.jpg",
                    title: "Health Checkups",
                    isActive: true
                },
                {
                    imageUrl: "https://img.freepik.com/free-vector/flat-world-blood-donor-day-horizontal-banner-template_23-2149397669.jpg",
                    title: "Blood Donation",
                    isActive: true
                }
            ];

            await Banner.insertMany(defaultBanners);
            return res.json({ success: true, data: defaultBanners });
        }

        res.json({ success: true, data: banners });
    } catch (error) {
        console.error("Error fetching banners:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;
