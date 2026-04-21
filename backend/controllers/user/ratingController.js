const Rating = require('../../models/Rating');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');

// @desc    Submit rating for completed appointment
// @route   POST /api/ratings
// @access  Private (Patient)
exports.submitRating = async (req, res) => {
    try {
        const { appointmentId, overallRating, serviceRatings, reviewText, wouldRecommend, visitReason } = req.body;
        const userId = req.user.id;

        // Validate appointment exists and belongs to user
        const appointment = await Appointment.findById(appointmentId).populate('doctorId');
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to rate this appointment' });
        }

        // Check if appointment is completed
        if (appointment.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Can only rate completed appointments' });
        }

        // Check if already rated
        if (appointment.isRated) {
            return res.status(400).json({ message: 'Appointment already rated' });
        }

        // REMOVED: 1-hour check for immediate testing and auto-popup requirement
        // const appointmentEndTime = new Date(appointment.endTime || appointment.appointmentDate);
        // if (Date.now() - appointmentEndTime < 3600000) { ... }

        // Validate rating
        if (overallRating < 1 || overallRating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Create rating
        const rating = new Rating({
            appointmentId,
            doctorId: appointment.doctorId._id,
            userId,
            overallRating,
            serviceRatings: serviceRatings || {},
            reviewText: reviewText?.substring(0, 1000),
            wouldRecommend: wouldRecommend !== false,
            visitReason,
            consultationType: appointment.consultationType
        });

        await rating.save();

        // Update appointment
        appointment.isRated = true;
        appointment.ratingId = rating._id;
        appointment.ratedAt = new Date();
        await appointment.save();

        // Update doctor ratings
        const allRatings = await Rating.find({ doctorId: appointment.doctorId._id });

        const avgRating = allRatings.reduce((sum, r) => sum + r.overallRating, 0) / allRatings.length;

        // Calculate service ratings average
        let serviceSum = { behavior: 0, professionalism: 0, hygiene: 0, punctuality: 0, communication: 0 };
        allRatings.forEach(r => {
            if (r.serviceRatings) {
                Object.keys(serviceSum).forEach(key => {
                    if (r.serviceRatings[key]) serviceSum[key] += r.serviceRatings[key];
                });
            }
        });

        const serviceCount = allRatings.filter(r => r.serviceRatings?.behavior).length;
        const avgServiceRating = serviceCount > 0
            ? Object.values(serviceSum).reduce((a, b) => a + b, 0) / (Object.keys(serviceSum).length * serviceCount)
            : 0;

        await Doctor.findByIdAndUpdate(
            appointment.doctorId._id,
            {
                'ratings.averageRating': avgRating,
                'ratings.totalRatings': allRatings.length,
                'ratings.totalReviews': allRatings.filter(r => r.reviewText).length,
                'ratings.serviceRating': avgServiceRating,
                'ratings.lastRatingDate': new Date()
            }
        );

        // Get updated doctor data
        const updatedDoctor = await Doctor.findById(appointment.doctorId._id).select('ratings');

        res.status(201).json({
            success: true,
            message: 'Rating submitted successfully',
            rating: {
                ...rating.toObject(),
                doctorRatings: updatedDoctor.ratings
            }
        });

    } catch (error) {
        console.error('Rating submission error:', error);
        res.status(500).json({ message: error.message || 'Error submitting rating' });
    }
};

// @desc    Get pending feedback for user
// @route   GET /api/ratings/pending
// @access  Private (Patient)
exports.getPendingFeedback = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find completed appointments that are not rated yet
        // Sort by appointmentDate (descending) to get the latest one
        console.log('Checking pending feedback for user:', userId);

        const pendingAppointment = await Appointment.findOne({
            userId,
            status: 'COMPLETED',
            isRated: false
        })
            .sort({ appointmentDate: -1 })
            .populate('doctorId', 'name doctorPhoto clinicAddress hospitalPhone specialization')
            .select('appointmentDate appointmentTime doctorId medicalHistory');

        console.log('Pending appointment found:', pendingAppointment ? pendingAppointment._id : 'None');

        if (!pendingAppointment) {
            return res.status(200).json({ success: true, pending: false });
        }

        res.json({
            success: true,
            pending: true,
            data: {
                appointmentId: pendingAppointment._id,
                doctorId: pendingAppointment.doctorId._id,
                doctorName: pendingAppointment.doctorId.name,
                doctorPhoto: pendingAppointment.doctorId.doctorPhoto,
                specialization: pendingAppointment.doctorId.specialization,
                hospitalName: pendingAppointment.doctorId.clinicAddress?.name || 'Clinic',
                appointmentDate: pendingAppointment.appointmentDate,
                appointmentTime: pendingAppointment.appointmentTime
            }
        });

    } catch (error) {
        console.error('Error fetching pending feedback:', error);
        res.status(500).json({ message: error.message || 'Error fetching pending feedback' });
    }
};

// @desc    Get doctor ratings
// @route   GET /api/ratings/doctor/:doctorId
// @access  Public
exports.getDoctorRatings = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { page = 1, limit = 10, sortBy = 'recent' } = req.query;

        const skip = (page - 1) * limit;

        let sortOption = { createdAt: -1 }; // Recent by default
        if (sortBy === 'highest') sortOption = { overallRating: -1 };
        if (sortBy === 'lowest') sortOption = { overallRating: 1 };

        const ratings = await Rating.find({
            doctorId,
            isFlagged: false
        })
            .select('-adminNotes') // Hide admin notes from public
            .populate('userId', 'firstName lastName') // Only show name
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(skip)
            .exec();

        const totalCount = await Rating.countDocuments({
            doctorId,
            isFlagged: false
        });

        // Get doctor info for ratings summary
        const doctor = await Doctor.findById(doctorId).select('ratings');

        // Calculate category breakdowns
        const categoryBreakdown = {
            behavior: 0,
            professionalism: 0,
            hygiene: 0,
            punctuality: 0,
            communication: 0
        };

        ratings.forEach(rating => {
            if (rating.serviceRatings) {
                Object.keys(categoryBreakdown).forEach(key => {
                    if (rating.serviceRatings[key]) {
                        categoryBreakdown[key] += rating.serviceRatings[key];
                    }
                });
            }
        });

        const serviceRatingsCount = ratings.filter(r => r.serviceRatings?.behavior).length;
        if (serviceRatingsCount > 0) {
            Object.keys(categoryBreakdown).forEach(key => {
                categoryBreakdown[key] = (categoryBreakdown[key] / serviceRatingsCount).toFixed(1);
            });
        }

        // Rating distribution
        const distribution = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };
        ratings.forEach(rating => {
            distribution[rating.overallRating]++;
        });

        res.json({
            success: true,
            data: {
                doctorId,
                ratings,
                summary: doctor?.ratings || {},
                categoryBreakdown,
                distribution,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalRatings: totalCount
                }
            }
        });

    } catch (error) {
        console.error('Error fetching doctor ratings:', error);
        res.status(500).json({ message: error.message || 'Error fetching ratings' });
    }
};

// @desc    Get appointment rating
// @route   GET /api/ratings/appointment/:appointmentId
// @access  Private
exports.getAppointmentRating = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const rating = await Rating.findOne({ appointmentId })
            .populate('doctorId', 'name specialization')
            .populate('userId', 'firstName lastName');

        if (!rating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        res.json({
            success: true,
            data: rating
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error fetching rating' });
    }
};

// @desc    Update rating
// @route   PUT /api/ratings/:ratingId
// @access  Private (Patient who submitted)
exports.updateRating = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const userId = req.user._id;
        const { overallRating, serviceRatings, reviewText, wouldRecommend } = req.body;

        const rating = await Rating.findById(ratingId);

        if (!rating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        if (rating.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this rating' });
        }

        // Check if rating is recent (within 24 hours)
        const hoursSinceCreation = (Date.now() - rating.createdAt) / (1000 * 60 * 60);
        if (hoursSinceCreation > 24) {
            return res.status(400).json({ message: 'Can only edit ratings within 24 hours' });
        }

        // Update fields
        if (overallRating) rating.overallRating = overallRating;
        if (serviceRatings) rating.serviceRatings = serviceRatings;
        if (reviewText) rating.reviewText = reviewText.substring(0, 1000);
        if (wouldRecommend !== undefined) rating.wouldRecommend = wouldRecommend;

        rating.updatedAt = new Date();
        await rating.save();

        // Recalculate doctor ratings
        const allRatings = await Rating.find({ doctorId: rating.doctorId });
        const avgRating = allRatings.reduce((sum, r) => sum + r.overallRating, 0) / allRatings.length;

        await Doctor.findByIdAndUpdate(
            rating.doctorId,
            {
                'ratings.averageRating': avgRating,
                'ratings.lastRatingDate': new Date()
            }
        );

        res.json({
            success: true,
            message: 'Rating updated successfully',
            data: rating
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error updating rating' });
    }
};

// @desc    Delete rating
// @route   DELETE /api/ratings/:ratingId
// @access  Private (Patient who submitted)
exports.deleteRating = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const userId = req.user._id;

        const rating = await Rating.findById(ratingId);

        if (!rating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        if (rating.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this rating' });
        }

        // Delete rating
        await Rating.findByIdAndDelete(ratingId);

        // Update appointment
        await Appointment.findByIdAndUpdate(
            rating.appointmentId,
            { isRated: false, ratingId: null, ratedAt: null }
        );

        // Recalculate doctor ratings
        const allRatings = await Rating.find({ doctorId: rating.doctorId });
        if (allRatings.length > 0) {
            const avgRating = allRatings.reduce((sum, r) => sum + r.overallRating, 0) / allRatings.length;
            await Doctor.findByIdAndUpdate(
                rating.doctorId,
                {
                    'ratings.averageRating': avgRating,
                    'ratings.totalRatings': allRatings.length,
                    'ratings.lastRatingDate': new Date()
                }
            );
        } else {
            await Doctor.findByIdAndUpdate(
                rating.doctorId,
                {
                    'ratings.averageRating': 0,
                    'ratings.totalRatings': 0
                }
            );
        }

        res.json({
            success: true,
            message: 'Rating deleted successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting rating' });
    }
};

// @desc    Add doctor response to rating
// @route   POST /api/ratings/:ratingId/respond
// @access  Private (Doctor)
exports.respondToRating = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const { text } = req.body;
        const doctorId = req.user._id;

        const rating = await Rating.findById(ratingId);

        if (!rating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        if (rating.doctorId.toString() !== doctorId.toString()) {
            return res.status(403).json({ message: 'Not authorized to respond to this rating' });
        }

        rating.doctorResponse = {
            text,
            respondedAt: new Date()
        };

        await rating.save();

        res.json({
            success: true,
            message: 'Response added successfully',
            data: rating
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error adding response' });
    }
};

// @desc    Get all ratings (Admin)
// @route   GET /api/ratings/admin/all
// @access  Private (Admin)
exports.getAllRatings = async (req, res) => {
    try {
        const { page = 1, limit = 20, sortBy = 'recent', doctorId } = req.query;
        const skip = (page - 1) * limit;

        let sortOption = { createdAt: -1 };
        if (sortBy === 'highest') sortOption = { overallRating: -1 };
        if (sortBy === 'lowest') sortOption = { overallRating: 1 };

        const query = {};
        if (doctorId) query.doctorId = doctorId;

        const ratings = await Rating.find(query)
            .populate('doctorId', 'name doctorPhoto specialization')
            .populate('userId', 'name email profileImage') // Assuming profileImage exists on User
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Rating.countDocuments(query);

        res.json({
            success: true,
            data: ratings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get ratings by user
// @route   GET /api/ratings/user/:userId
// @access  Private (Admin)
exports.getUserRatings = async (req, res) => {
    try {
        const { userId } = req.params;
        const ratings = await Rating.find({ userId })
            .populate('doctorId', 'name doctorPhoto specialization')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: ratings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle rating visibility (Hide/Unhide)
// @route   PUT /api/ratings/:ratingId/hide
// @access  Private (Admin)
exports.toggleRatingVisibility = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const rating = await Rating.findById(ratingId);

        if (!rating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        rating.isHidden = !rating.isHidden;
        await rating.save();

        res.json({
            success: true,
            message: `Rating ${rating.isHidden ? 'hidden' : 'visible'} successfully`,
            data: rating
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
