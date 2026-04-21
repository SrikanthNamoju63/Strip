const AuditLog = require('../../models/AuditLog');

/**
 * Log an admin action
 * @param {Object} params - The log parameters
 * @param {string} params.module - The module name (DOCTOR, FINANCE, etc)
 * @param {string} params.action - The action name (VERIFY, SUSPEND, etc)
 * @param {string} params.adminId - The Admin ID performing the action
 * @param {string} params.targetId - The ID of the target object
 * @param {string} params.targetModel - The model of the target object (Doctor, Payment)
 * @param {Object} [params.before] - Snapshot before change
 * @param {Object} [params.after] - Snapshot after change
 * @param {string} [params.metadata] - Extra info/reason
 * @param {string} [params.ip] - IP Address
 */
exports.logAction = async ({ module, action, adminId, targetId, targetModel, before, after, metadata, ip }) => {
    try {
        const log = new AuditLog({
            module,
            action,
            performedBy: adminId,
            targetId,
            targetModel,
            beforeValue: before,
            afterValue: after,
            metadata,
            ipAddress: ip
        });

        await log.save();
        return log;
    } catch (err) {
        console.error('Audit Log Error:', err);
        // Don't crash the main flow if logging fails, but log to console
    }
};
