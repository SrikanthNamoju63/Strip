const AppFeedback = require('../../models/AppFeedback');
const User = require('../../models/User');

// @desc    Submit app feedback
// @route   POST /api/app-feedback/submit
// @access  Private (User)
exports.submitFeedback = async (req, res) => {
    try {
        const { feedbackType, feedbackText, appVersion, deviceInfo } = req.body;
        const userId = req.user.id;

        // Fetch user details to ensure we have the latest info
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newFeedback = new AppFeedback({
            userId,
            userName: user.name,
            email: user.email,
            feedbackType,
            feedbackText,
            appVersion,
            deviceInfo
        });

        await newFeedback.save();

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: newFeedback
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Server error submitting feedback' });
    }
};

// @desc    Get all app feedback (Admin)
// @route   GET /api/app-feedback
// @access  Private (Admin)
exports.getAllFeedback = async (req, res) => {
    try {
        // Admin check is handled by middleware but good to be safe
        // Filters can be passed via query
        const { type, status, userId } = req.query;
        let query = {};

        if (type) query.feedbackType = type;
        if (status) query.status = status;
        if (userId) query.userId = userId;

        const feedbacks = await AppFeedback.find(query).sort({ createdAt: -1 });

        res.json(feedbacks);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Server error fetching feedback' });
    }
};

// @desc    Update feedback status
// @route   PUT /api/app-feedback/:id/status
// @access  Private (Admin)
exports.updateFeedbackStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const feedback = await AppFeedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        if (!['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        feedback.status = status;
        await feedback.save();

        res.json({ success: true, data: feedback });
    } catch (error) {
        console.error('Error updating feedback status:', error);
        res.status(500).json({ message: 'Server error updating status' });
    }
};

// @desc    Reply to feedback
// @route   PUT /api/app-feedback/:id/reply
// @access  Private (Admin)
exports.replyToFeedback = async (req, res) => {
    try {
        const { reply } = req.body;
        const feedback = await AppFeedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        feedback.adminReply = reply;
        // Optionally update status to resolved or in progress if needed, but let's keep it manual as per req

        await feedback.save();

        res.json({ success: true, data: feedback });
    } catch (error) {
        console.error('Error replying to feedback:', error);
        res.status(500).json({ message: 'Server error replying to feedback' });
    }
};
