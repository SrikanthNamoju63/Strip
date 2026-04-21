/**
 * RefreshToken Model
 * Stores refresh tokens to enable token rotation and revocation
 * Fixes: Token blacklist gap for logout functionality
 */

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    // Reference to user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // The actual refresh token
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Device/User-Agent that issued this token
    userAgent: {
      type: String,
      required: false
    },

    // IP address where token was issued
    ipAddress: {
      type: String,
      required: false
    },

    // Token expiration date
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      expires: 0 // Auto-delete expired documents
    },

    // When token was revoked (logged out)
    revokedAt: {
      type: Date,
      default: null,
      index: true
    },

    // Reason for revocation
    revocationReason: {
      type: String,
      enum: ['user_logout', 'password_change', 'admin_revoke', 'security_breach', 'device_loss'],
      default: null
    },

    // For rotation: reference to new token
    replacedByTokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefreshToken',
      default: null
    },

    // Token status
    status: {
      type: String,
      enum: ['active', 'revoked', 'expired'],
      default: 'active',
      index: true
    },

    // Track if token has been used to refresh (refresh token rotation)
    refreshedAt: {
      type: Date,
      default: null
    },

    // Number of times this token has been used to refresh
    refreshCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    collection: 'refresh_tokens'
  }
);

/**
 * Indexes for performance
 */
refreshTokenSchema.index({ userId: 1, status: 1 });
refreshTokenSchema.index({ userId: 1, revokedAt: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

/**
 * Pre-save middleware to validate token
 */
refreshTokenSchema.pre('save', async function(next) {
  // If token is being revoked, set status to revoked
  if (this.revokedAt && !this.status.includes('revoked')) {
    this.status = 'revoked';
  }

  next();
});

/**
 * Statics for common operations
 */
refreshTokenSchema.statics = {
  /**
   * Create new refresh token
   */
  async createToken(userId, token, expiresAt, ipAddress, userAgent) {
    const refreshToken = await this.create({
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
      status: 'active'
    });
    return refreshToken;
  },

  /**
   * Mark token as revoked
   */
  async revokeToken(token, reason = 'user_logout') {
    return await this.findOneAndUpdate(
      { token, status: 'active' },
      {
        revokedAt: new Date(),
        revocationReason: reason,
        status: 'revoked'
      },
      { new: true }
    );
  },

  /**
   * Revoke all tokens for a user (security: password change, suspected breach)
   */
  async revokeAllUserTokens(userId, reason = 'security_breach') {
    return await this.updateMany(
      { userId, status: 'active' },
      {
        revokedAt: new Date(),
        revocationReason: reason,
        status: 'revoked'
      }
    );
  },

  /**
   * Check if token exists and is active
   */
  async isTokenValid(token) {
    const doc = await this.findOne({
      token,
      status: 'active',
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    });
    return !!doc;
  },

  /**
   * Get all active tokens for a user
   */
  async getUserActiveTokens(userId) {
    return await this.find({
      userId,
      status: 'active',
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
  },

  /**
   * Get specific device tokens
   */
  async getDeviceTokens(userId, userAgent) {
    return await this.find({
      userId,
      userAgent,
      status: 'active',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
  },

  /**
   * Clean up expired tokens
   * (though TTL index should handle this automatically)
   */
  async cleanupExpiredTokens() {
    const result = await this.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Cleaned up ${result.deletedCount} expired refresh tokens`);
    return result;
  }
};

/**
 * Instance methods
 */
refreshTokenSchema.methods = {
  /**
   * Check if this token is still valid
   */
  isValid() {
    return (
      this.status === 'active' &&
      !this.revokedAt &&
      this.expiresAt > new Date()
    );
  },

  /**
   * Revoke this token
   */
  async revoke(reason = 'user_logout') {
    this.revokedAt = new Date();
    this.revocationReason = reason;
    this.status = 'revoked';
    await this.save();
    return this;
  },

  /**
   * Mark as refreshed (token rotation)
   */
  async markRefreshed(newTokenId) {
    this.refreshedAt = new Date();
    this.refreshCount += 1;
    this.replacedByTokenId = newTokenId;
    await this.save();
    return this;
  }
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
