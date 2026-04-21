const User = require('../../models/User');

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateUserProfile = async (req, res) => {
    const { height, weight, gender, age, dob } = req.body;
    console.log('Update Profile Request Body:', req.body);
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (height !== undefined) user.height = height;
        if (weight !== undefined) user.weight = weight;
        if (gender !== undefined) user.gender = gender;
        if (age !== undefined) user.age = age;
        if (dob !== undefined) user.dob = dob;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Normalize path for URL
        const imagePath = req.file.path.replace(/\\/g, "/");

        user.profileImage = imagePath;
        await user.save();

        res.json({ profileImage: user.profileImage });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
