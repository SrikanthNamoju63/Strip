/**
 * Database Security & Relationship Validation Middleware
 * Ensures data integrity, access control, and secure relationships
 */

const crypto = require('crypto');

class DatabaseSecurityManager {
    constructor() {
        this.accessMatrix = {};
        this.relationshipRules = {};
        this.encryptionKeys = {};
    }

    // ==================== ACCESS CONTROL ====================

    /**
     * Define who can access which resources
     */
    defineAccessControl() {
        this.accessMatrix = {
            'USER': {
                'own_appointments': ['READ', 'CREATE', 'UPDATE', 'DELETE'],
                'own_profile': ['READ', 'UPDATE'],
                'own_wallet': ['READ'],
                'own_health': ['READ', 'CREATE', 'UPDATE'],
                'own_feedback': ['CREATE', 'READ'],
                'doctors': ['READ'],
                'ratings': ['CREATE', 'READ'],
                'support_tickets': ['CREATE', 'READ', 'UPDATE']
            },
            'DOCTOR': {
                'own_profile': ['READ', 'UPDATE'],
                'own_appointments': ['READ', 'UPDATE'],
                'own_availability': ['READ', 'UPDATE'],
                'own_bank_details': ['READ', 'UPDATE'],
                'own_ratings': ['READ'],
                'own_earnings': ['READ'],
                'patients_health': ['READ'],
                'support_tickets': ['READ', 'UPDATE']
            },
            'SUPER_ADMIN': {
                '*': ['READ', 'CREATE', 'UPDATE', 'DELETE']
            },
            'VERIFICATION_ADMIN': {
                'doctors': ['READ', 'UPDATE'],
                'doctor_documents': ['READ', 'UPDATE'],
                'audit_logs': ['READ']
            },
            'FINANCE_ADMIN': {
                'payments': ['READ'],
                'refunds': ['READ', 'UPDATE'],
                'settlements': ['READ', 'CREATE', 'UPDATE'],
                'revenue_ledger': ['READ'],
                'doctor_earnings': ['READ']
            },
            'SUPPORT_ADMIN': {
                'support_tickets': ['READ', 'UPDATE', 'CREATE'],
                'user_feedback': ['READ', 'UPDATE'],
                'users': ['READ'],
                'doctors': ['READ']
            }
        };
    }

    /**
     * Check if user can perform action
     */
    canAccess(userId, userRole, resource, action) {
        const roleAccess = this.accessMatrix[userRole];
        if (!roleAccess) return false;

        // Super admin can access everything
        if (userRole === 'SUPER_ADMIN') return true;

        // Check specific resource access
        const resourceAccess = roleAccess[resource];
        if (resourceAccess && resourceAccess.includes(action)) {
            return true;
        }

        return false;
    }

    // ==================== RELATIONSHIP VALIDATION ====================

    /**
     * Define and validate table relationships
     */
    defineRelationshipRules() {
        this.relationshipRules = {
            'Appointment': {
                'userId': {
                    model: 'User',
                    required: true,
                    onDelete: 'SET_NULL'
                },
                'doctorId': {
                    model: 'Doctor',
                    required: true,
                    onDelete: 'SET_NULL',
                    validate: 'isDoctorVerified'
                },
                'paymentId': {
                    model: 'Payment',
                    required: false,
                    onDelete: 'SET_NULL'
                },
                'ratingId': {
                    model: 'Rating',
                    required: false,
                    onDelete: 'SET_NULL'
                }
            },

            'Payment': {
                'userId': {
                    model: 'User',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'doctorId': {
                    model: 'Doctor',
                    required: true,
                    onDelete: 'SET_NULL'
                },
                'appointmentId': {
                    model: 'Appointment',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'settlementId': {
                    model: 'Settlement',
                    required: false,
                    onDelete: 'SET_NULL'
                }
            },

            'Refund': {
                'paymentId': {
                    model: 'Payment',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'appointmentId': {
                    model: 'Appointment',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'userId': {
                    model: 'User',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'doctorId': {
                    model: 'Doctor',
                    required: true,
                    onDelete: 'SET_NULL'
                },
                'approvedBy': {
                    model: 'Admin',
                    required: false,
                    onDelete: 'SET_NULL'
                }
            },

            'Rating': {
                'appointmentId': {
                    model: 'Appointment',
                    required: true,
                    unique: true,
                    onDelete: 'CASCADE'
                },
                'doctorId': {
                    model: 'Doctor',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'userId': {
                    model: 'User',
                    required: true,
                    onDelete: 'CASCADE'
                }
            },

            'Settlement': {
                'doctorId': {
                    model: 'Doctor',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'approvedBy': {
                    model: 'Admin',
                    required: false,
                    onDelete: 'SET_NULL'
                }
            },

            'DoctorAvailability': {
                'doctorId': {
                    model: 'Doctor',
                    required: true,
                    unique: true,
                    onDelete: 'CASCADE'
                },
                'lastUpdatedBy': {
                    model: 'Admin',
                    required: false,
                    onDelete: 'SET_NULL'
                }
            },

            'DoctorBankDetails': {
                'doctorId': {
                    model: 'Doctor',
                    required: true,
                    unique: true,
                    onDelete: 'CASCADE'
                },
                'verifiedBy': {
                    model: 'Admin',
                    required: false,
                    onDelete: 'SET_NULL'
                }
            },

            'UserActivity': {
                'userId': {
                    model: 'User',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'appointmentId': {
                    model: 'Appointment',
                    required: false,
                    onDelete: 'SET_NULL'
                },
                'doctorId': {
                    model: 'Doctor',
                    required: false,
                    onDelete: 'SET_NULL'
                }
            },

            'UserWallet': {
                'userId': {
                    model: 'User',
                    required: true,
                    unique: true,
                    onDelete: 'CASCADE'
                }
            },

            'AppointmentReminder': {
                'appointmentId': {
                    model: 'Appointment',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'userId': {
                    model: 'User',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'doctorId': {
                    model: 'Doctor',
                    required: true,
                    onDelete: 'CASCADE'
                }
            },

            'SupportTicket': {
                'userId': {
                    model: 'User',
                    required: false,
                    onDelete: 'SET_NULL'
                },
                'doctorId': {
                    model: 'Doctor',
                    required: false,
                    onDelete: 'SET_NULL'
                },
                'assignedTo': {
                    model: 'Admin',
                    required: false,
                    onDelete: 'SET_NULL'
                }
            },

            'BloodRequest': {
                'requesterUserId': {
                    model: 'User',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'matchedDonorId': {
                    model: 'BloodDonor',
                    required: false,
                    onDelete: 'SET_NULL'
                }
            },

            'BloodDonor': {
                'userId': {
                    model: 'User',
                    required: true,
                    unique: true,
                    onDelete: 'CASCADE'
                }
            },

            'Notification': {
                'userId': {
                    model: 'User',
                    required: false,
                    onDelete: 'CASCADE'
                }
            },

            'AuditLog': {
                'performedBy': {
                    model: 'Admin',
                    required: true,
                    onDelete: 'SET_NULL'
                }
            },

            'RevenueLedger': {
                'appointmentId': {
                    model: 'Appointment',
                    required: true,
                    onDelete: 'CASCADE'
                },
                'paymentId': {
                    model: 'Payment',
                    required: true,
                    unique: true,
                    onDelete: 'CASCADE'
                }
            }
        };
    }

    /**
     * Validate relationship before creating/updating
     */
    async validateRelationship(model, field, value, models) {
        const rule = this.relationshipRules[model]?.[field];
        if (!rule) return true;

        const referencedModel = models[rule.model];
        if (!referencedModel) return true;

        // Check if referenced record exists
        const referencedRecord = await referencedModel.findById(value);
        if (!referencedRecord) {
            throw new Error(`Invalid ${field}: Referenced ${rule.model} not found`);
        }

        // Run custom validators
        if (rule.validate) {
            return await this[rule.validate](value, referencedRecord, models);
        }

        return true;
    }

    /**
     * Custom validator: Doctor must be verified
     */
    async isDoctorVerified(doctorId, doctor) {
        if (doctor.verificationStatus !== 'VERIFIED') {
            throw new Error('Doctor is not verified');
        }
        if (!doctor.isActive) {
            throw new Error('Doctor account is inactive');
        }
        return true;
    }

    // ==================== DATA ENCRYPTION ====================

    /**
     * Encrypt sensitive fields
     */
    encryptSensitiveFields(model, data) {
        const sensitiveFields = {
            'User': ['passwordHash', 'phone', 'email'],
            'Doctor': ['passwordHash', 'personalPhone', 'email', 'bankDetails.accountNumber'],
            'DoctorBankDetails': ['accountNumber', 'panNumber', 'aadhaarNumber'],
            'Payment': ['razorpayPaymentId'],
            'Admin': ['passwordHash', 'email']
        };

        const fieldsToEncrypt = sensitiveFields[model] || [];
        const encrypted = { ...data };

        fieldsToEncrypt.forEach(field => {
            if (encrypted[field]) {
                encrypted[field] = this.encrypt(encrypted[field]);
            }
        });

        return encrypted;
    }

    /**
     * Decrypt sensitive fields
     */
    decryptSensitiveFields(model, data) {
        const sensitiveFields = {
            'User': ['passwordHash', 'phone', 'email'],
            'Doctor': ['passwordHash', 'personalPhone', 'email'],
            'DoctorBankDetails': ['accountNumber', 'panNumber', 'aadhaarNumber'],
            'Admin': ['passwordHash', 'email']
        };

        const fieldsToDecrypt = sensitiveFields[model] || [];
        const decrypted = { ...data };

        fieldsToDecrypt.forEach(field => {
            if (decrypted[field] && this.isEncrypted(decrypted[field])) {
                decrypted[field] = this.decrypt(decrypted[field]);
            }
        });

        return decrypted;
    }

    /**
     * Simple encryption (use proper library in production)
     */
    encrypt(text) {
        const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'default-key');
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `ENC:${encrypted}`;
    }

    /**
     * Simple decryption
     */
    decrypt(encryptedText) {
        const text = encryptedText.replace('ENC:', '');
        const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'default-key');
        let decrypted = decipher.update(text, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    /**
     * Check if text is encrypted
     */
    isEncrypted(text) {
        return typeof text === 'string' && text.startsWith('ENC:');
    }

    // ==================== AUDIT TRAIL ====================

    /**
     * Create audit log for sensitive operations
     */
    async logSensitiveOperation(adminId, action, model, targetId, beforeValue, afterValue, models) {
        const AuditLog = models.AuditLog;
        
        return await AuditLog.create({
            module: model,
            action,
            performedBy: adminId,
            targetId,
            targetModel: model,
            beforeValue,
            afterValue,
            timestamp: new Date()
        });
    }

    // ==================== DATA INTEGRITY ====================

    /**
     * Validate referential integrity
     */
    async validateReferentialIntegrity(models) {
        const issues = [];

        // Check for orphaned records
        const User = models.User;
        const Appointment = models.Appointment;

        const appointmentsWithoutUser = await Appointment.find({
            userId: { $exists: true }
        }).populate('userId', '_id');

        appointmentsWithoutUser.forEach(apt => {
            if (!apt.userId) {
                issues.push({
                    type: 'ORPHANED_RECORD',
                    model: 'Appointment',
                    recordId: apt._id,
                    issue: 'Appointment references non-existent User'
                });
            }
        });

        return issues;
    }

    /**
     * Check for data consistency
     */
    async validateDataConsistency(models) {
        const inconsistencies = [];

        const Doctor = models.Doctor;
        const DoctorBankDetails = models.DoctorBankDetails;

        // Check if all verified doctors have bank details
        const verifiedDoctors = await Doctor.find({ isVerified: true }).select('_id');
        
        for (const doctor of verifiedDoctors) {
            const bankDetails = await DoctorBankDetails.findOne({ doctorId: doctor._id });
            if (!bankDetails) {
                inconsistencies.push({
                    type: 'MISSING_RELATED_DATA',
                    model: 'Doctor',
                    recordId: doctor._id,
                    issue: 'Verified doctor has no bank details'
                });
            }
        }

        return inconsistencies;
    }

    // ==================== TRANSACTION SUPPORT ====================

    /**
     * Atomic appointment + payment operation
     */
    async createAppointmentWithPayment(appointmentData, paymentData, models, session) {
        try {
            const Appointment = models.Appointment;
            const Payment = models.Payment;

            // Both succeed or both fail
            const appointment = await Appointment.create([appointmentData], { session });
            const payment = await Payment.create([{
                ...paymentData,
                appointmentId: appointment[0]._id
            }], { session });

            return { appointment: appointment[0], payment: payment[0] };
        } catch (error) {
            throw new Error(`Atomic operation failed: ${error.message}`);
        }
    }

    /**
     * Atomic settlement operation
     */
    async createSettlementWithPaymentUpdate(settlementData, paymentIds, models, session) {
        try {
            const Settlement = models.Settlement;
            const Payment = models.Payment;

            const settlement = await Settlement.create([settlementData], { session });
            
            await Payment.updateMany(
                { _id: { $in: paymentIds } },
                { settlementStatus: 'SETTLED', settlementId: settlement[0]._id },
                { session }
            );

            return settlement[0];
        } catch (error) {
            throw new Error(`Settlement operation failed: ${error.message}`);
        }
    }
}

module.exports = DatabaseSecurityManager;
