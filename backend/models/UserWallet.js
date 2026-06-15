const mongoose = require('mongoose');

/**
 * UserWallet Model
 * Manages user wallet balance, credits, and transaction history
 * Production-grade implementation with atomic operations
 */
const userWalletSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true,
        index: true
    },

    // Current Balances
    totalBalance: {
        type: Number,
        default: 0,
        min: 0
    },

    availableBalance: {
        type: Number,
        default: 0,
        min: 0
    },

    lockedBalance: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Balance locked for pending transactions'
    },

    rewardPoints: {
        type: Number,
        default: 0,
        min: 0
    },

    // Wallet Status
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'FROZEN', 'CLOSED'],
        default: 'ACTIVE',
        index: true
    },

    isKycCompleted: {
        type: Boolean,
        default: false
    },

    kycCompletedAt: Date,

    // Currency
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR']
    },

    // Wallet Features
    features: {
        allowTopUp: {
            type: Boolean,
            default: true
        },
        allowWithdrawal: {
            type: Boolean,
            default: true
        },
        allowTransfer: {
            type: Boolean,
            default: false
        },
        maxWithdrawalLimit: {
            type: Number,
            default: 100000
        },
        dailyWithdrawalLimit: {
            type: Number,
            default: 50000
        },
        monthlyWithdrawalLimit: {
            type: Number,
            default: 500000
        }
    },

    // Usage Tracking
    usage: {
        totalTransactions: {
            type: Number,
            default: 0
        },
        totalAmountSpent: {
            type: Number,
            default: 0
        },
        totalAmountReceived: {
            type: Number,
            default: 0
        },
        lastTransactionDate: Date,
        lastTopUpDate: Date,
        lastWithdrawalDate: Date,
        lastTransactionType: {
            type: String,
            enum: ['TOPUP', 'PAYMENT', 'REFUND', 'REWARD', 'WITHDRAWAL']
        }
    },

    // Withdrawal Details
    withdrawalDetails: {
        bankAccountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DoctorBankDetails',
            sparse: true
        },
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String
    },

    // Transaction History (Recent Transactions)
    transactions: [{
        transactionId: {
            type: String,
            unique: true,
            sparse: true
        },
        type: {
            type: String,
            enum: ['TOPUP', 'PAYMENT', 'REFUND', 'REWARD', 'WITHDRAWAL', 'ADJUSTMENT'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        description: String,
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            description: 'Reference to related document (Payment, Refund, etc.)'
        },
        status: {
            type: String,
            enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
            default: 'PENDING'
        },
        balanceBefore: Number,
        balanceAfter: Number,
        paymentGateway: {
            type: String,
            enum: ['RAZORPAY', 'STRIPE', 'INTERNAL', 'BANK_TRANSFER']
        },
        gatewayTransactionId: String,
        metadata: mongoose.Schema.Types.Mixed,
        performedBy: {
            type: String,
            enum: ['USER', 'ADMIN', 'SYSTEM'],
            default: 'USER'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Reward Points History
    rewardHistory: [{
        rewardId: String,
        amount: Number,
        reason: {
            type: String,
            enum: ['FIRST_APPOINTMENT', 'REFERRAL', 'LOYALTY', 'PROMOTION', 'CANCELLATION_COMPENSATION', 'OTHER']
        },
        expiryDate: Date,
        status: {
            type: String,
            enum: ['ACTIVE', 'REDEEMED', 'EXPIRED'],
            default: 'ACTIVE'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Limits and Restrictions
    limits: {
        dailyTransactionLimit: {
            type: Number,
            default: 10,
            description: 'Maximum number of transactions per day'
        },
        monthlyTransactionLimit: {
            type: Number,
            default: 200,
            description: 'Maximum number of transactions per month'
        },
        dailyTopUpLimit: {
            type: Number,
            default: 100000
        },
        monthlyTopUpLimit: {
            type: Number,
            default: 1000000
        }
    },

    // Usage Statistics
    statistics: {
        totalTopUps: {
            type: Number,
            default: 0
        },
        totalWithdrawals: {
            type: Number,
            default: 0
        },
        averageTransactionAmount: Number,
        lastUpdated: Date
    },

    // Verification Status
    verificationStatus: {
        emailVerified: {
            type: Boolean,
            default: false
        },
        phoneVerified: {
            type: Boolean,
            default: false
        },
        bankDetailsVerified: {
            type: Boolean,
            default: false
        },
        identityVerified: {
            type: Boolean,
            default: false
        }
    },

    // Freeze/Hold Information
    frozenInfo: {
        reason: String,
        frozenAt: Date,
        frozenBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        expectedUnfreezeDate: Date
    },

    // Notes and Metadata
    notes: {
        type: String,
        maxlength: 1000
    },

    internalNotes: {
        type: String,
        maxlength: 1000
    }

}, { 
    timestamps: true,
    collection: 'user_wallets'
});

// Indexes for production performance
userWalletSchema.index({ userId: 1, status: 1 });
userWalletSchema.index({ status: 1, createdAt: -1 });
userWalletSchema.index({ 'transactions.createdAt': -1 });
userWalletSchema.index({ availableBalance: -1 });
userWalletSchema.index({ isKycCompleted: 1 });
userWalletSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('UserWallet', userWalletSchema);
