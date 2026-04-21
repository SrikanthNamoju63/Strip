const AuditLog = require('../../models/AuditLog');

exports.getLogs = async (req, res) => {
    try {
        const { module, adminId, limit = 50 } = req.query;
        let query = {};
        if (module) query.module = module;
        if (adminId) query.performedBy = adminId;

        const logs = await AuditLog.find(query)
            .populate('performedBy', 'username role')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
