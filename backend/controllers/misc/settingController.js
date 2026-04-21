const SystemSetting = require('../../models/SystemSetting');
const AuditLog = require('../../models/AuditLog');

exports.getSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.find();
        // Convert array to object key-value for easy frontend use
        const config = {};
        settings.forEach(s => {
            config[s.key] = s.value;
        });
        res.json({ settings, config });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.updateSetting = async (req, res) => {
    try {
        // Support both single update { key, value } and bulk update { key1: val1, key2: val2 }
        let updates = {};
        if (req.body.key && req.body.value !== undefined) {
            updates[req.body.key] = req.body.value;
        } else {
            updates = req.body;
        }

        const results = [];

        for (const [key, value] of Object.entries(updates)) {
            // Skip if value is null/undefined unless we want to allow unsetting? 
            // Usually we might want to update empty strings etc.
            if (value === undefined) continue;

            let setting = await SystemSetting.findOne({ key });
            let oldValue = null;

            if (!setting) {
                // Create if not exists
                setting = new SystemSetting({
                    key,
                    value,
                    lastUpdatedBy: req.admin.id
                });
            } else {
                oldValue = setting.value;
                // Only update if changed
                if (String(oldValue) === String(value)) continue;

                setting.value = value;
                setting.lastUpdatedBy = req.admin.id;
            }

            await setting.save();
            results.push(setting);

            // Log Audit if changed
            if (oldValue !== value) {
                await AuditLog.create({
                    module: 'SETTINGS',
                    action: 'UPDATE_CONFIG',
                    performedBy: req.admin.id,
                    targetId: setting._id,
                    targetModel: 'SystemSetting',
                    beforeValue: { value: oldValue },
                    afterValue: { value: value },
                    metadata: `Key: ${key}`
                });
            }
        }

        res.json({ success: true, count: results.length, updates: results });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
