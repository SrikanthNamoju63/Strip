const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    ticketId: { type: String, unique: true, required: true }, // e.g. TKT-2023001
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    // A ticket can be from a user OR a doctor.

    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['PAYMENT', 'APPOINTMENT', 'DOCTOR', 'REFUND', 'BUG', 'OTHER'], required: true },

    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

    messages: [{
        senderId: { type: mongoose.Schema.Types.ObjectId }, // UserID or AdminID
        senderRole: { type: String, enum: ['USER', 'DOCTOR', 'ADMIN'] },
        message: String,
        attachments: [String],
        sentAt: { type: Date, default: Date.now }
    }],

    resolvedAt: { type: Date },
    closedAt: { type: Date },

}, { timestamps: true });

supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
