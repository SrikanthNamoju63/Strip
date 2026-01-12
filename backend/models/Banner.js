const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    redirectUrl: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Banner', bannerSchema);
