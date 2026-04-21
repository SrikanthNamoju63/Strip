/**
 * Backup Model
 * Tracks database and file backups
 */

const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
  // Backup Identification
  backupId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // Backup Type
  type: { 
    type: String, 
    enum: ['FULL', 'INCREMENTAL', 'DATABASE', 'FILES', 'CONFIG'],
    required: true
  },
  
  // Backup Status
  status: { 
    type: String, 
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'VERIFIED'],
    default: 'PENDING'
  },
  
  // Backup Details
  description: { 
    type: String 
  },
  
  // Source Information
  source: {
    database: { type: Boolean, default: false },
    collections: [{ type: String }],
    filePaths: [{ type: String }],
    configFiles: [{ type: String }]
  },
  
  // Storage Information
  storage: {
    location: { 
      type: String, 
      enum: ['LOCAL', 'S3', 'GCP', 'AZURE', 'FTP'],
      required: true
    },
    path: { type: String },
    bucket: { type: String },
    region: { type: String },
    fileName: { type: String },
    fileSize: { type: Number }, // in bytes
    checksum: { type: String },
    encryptionEnabled: { type: Boolean, default: true }
  },
  
  // Timing
  startedAt: { 
    type: Date 
  },
  
  completedAt: { 
    type: Date 
  },
  
  duration: { 
    type: Number // in seconds
  },
  
  // Retention
  retentionDays: { 
    type: Number, 
    default: 30 
  },
  
  expiresAt: { 
    type: Date 
  },
  
  // Statistics
  stats: {
    totalDocuments: { type: Number, default: 0 },
    totalFiles: { type: Number, default: 0 },
    totalSize: { type: Number, default: 0 }, // in bytes
    compressedSize: { type: Number, default: 0 }, // in bytes
    compressionRatio: { type: Number, default: 0 }
  },
  
  // Verification
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    testRestoreStatus: { 
      type: String, 
      enum: ['NOT_TESTED', 'IN_PROGRESS', 'SUCCESS', 'FAILED']
    },
    testRestoreNotes: { type: String }
  },
  
  // Error Information
  error: {
    message: { type: String },
    code: { type: String },
    stack: { type: String }
  },
  
  // Schedule Reference (if automated)
  scheduleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BackupSchedule' 
  },
  
  // Manual or Automated
  isAutomated: { 
    type: Boolean, 
    default: false 
  },
  
  // Initiated By
  initiatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin'
  },
  
  // Tags
  tags: [{ 
    type: String 
  }],
  
  // Notes
  notes: { 
    type: String 
  }

}, { timestamps: true });

// Indexes
backupSchema.index({ status: 1, type: 1 });
backupSchema.index({ expiresAt: 1 });
backupSchema.index({ createdAt: -1 });

// Pre-save to calculate duration
backupSchema.pre('save', function(next) {
  if (this.completedAt && this.startedAt) {
    this.duration = Math.floor((this.completedAt - this.startedAt) / 1000);
  }
  if (this.retentionDays && !this.expiresAt) {
    this.expiresAt = new Date();
    this.expiresAt.setDate(this.expiresAt.getDate() + this.retentionDays);
  }
  next();
});

// Virtual for formatted size
backupSchema.virtual('formattedSize').get(function() {
  const bytes = this.stats.compressedSize || this.stats.totalSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

module.exports = mongoose.model('Backup', backupSchema);
