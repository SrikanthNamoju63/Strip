# Models

MongoDB data models using Mongoose ODM.

## Structure

```
models/
├── Admin.js              # Admin user accounts
├── Appointment.js        # Doctor appointments
├── User.js               # Patient user accounts
├── Doctor.js             # Doctor profiles
├── Payment.js            # Payment transactions
├── Refund.js             # Refund records
├── Settlement.js         # Doctor payment settlements
├── HealthReading.js      # Health metrics (BP, glucose, etc.)
├── HealthAnalysis.js     # Health analysis reports
├── HealthPrediction.js   # AI-based health predictions
├── BloodDonor.js         # Blood donor profiles
├── BloodDonation.js      # Blood donation records
├── BloodRequest.js       # Blood requests
├── Rating.js             # Doctor ratings & reviews
├── SupportTicket.js      # Support tickets
├── AppFeedback.js        # App feedback/reviews
├── AuditLog.js           # Audit trail
├── Notification.js       # User notifications
├── MedicineReminder.js   # Medicine reminder schedules
├── RefreshToken.js       # Refresh token tracking
├── FeeConfig.js          # Doctor consultation fees
├── SystemSetting.js      # System settings
└── README.md             # This file
```

## Core Models

### User Management

#### `User.js` - Patient
```javascript
{
  email: String (unique),
  phone: String (unique),
  password: String (hashed),
  profile: {
    fullName: String,
    dateOfBirth: Date,
    gender: Enum['M','F','Other'],
    avatar: String
  },
  medicalHistory: [{
    condition: String,
    status: Enum['active','inactive'],
    startDate: Date
  }],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### `Doctor.js` - Doctor Profile
```javascript
{
  userId: ObjectId (ref: User),
  licenseNumber: String (unique),
  specialization: String,
  qualifications: [String],
  experience: Number (years),
  clinic: {
    name: String,
    address: String,
    phone: String
  },
  availability: [{
    day: String,
    slots: [String]
  }],
  kyc: {
    status: Enum['pending','verified','rejected'],
    documents: [String],
    verifiedAt: Date
  },
  rating: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### `Admin.js` - Admin Account
```javascript
{
  email: String (unique),
  password: String (hashed),
  role: Enum['super_admin','admin'],
  permissions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Appointments & Health

#### `Appointment.js` - Booking
```javascript
{
  user: ObjectId (ref: User),
  doctor: ObjectId (ref: Doctor),
  department: String,
  appointmentDate: Date,
  timeSlot: String,
  status: Enum['scheduled','completed','cancelled','no-show'],
  consultationType: Enum['online','offline'],
  notes: String,
  prescription: String,
  followUp: {
    required: Boolean,
    scheduledDate: Date
  },
  transactionLock: ObjectId,  // For preventing race conditions
  createdAt: Date,
  updatedAt: Date
}
```

#### `HealthReading.js` - Metrics
```javascript
{
  user: ObjectId (ref: User),
  readingType: Enum['bp','glucose','weight','temperature','heartRate'],
  value: Number,
  unit: String,
  timestamp: Date,
  notes: String,
  createdAt: Date
}
```

#### `HealthAnalysis.js` - Analysis
```javascript
{
  user: ObjectId (ref: User),
  readings: [ObjectId] (ref: HealthReading),
  analysis: {
    summary: String,
    recommendations: [String],
    riskLevel: Enum['low','medium','high'],
    followUpRequired: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Payments & Finance

#### `Payment.js` - Transaction
```javascript
{
  user: ObjectId (ref: User),
  doctor: ObjectId (ref: Doctor),
  appointment: ObjectId (ref: Appointment),
  amount: Number,
  currency: String,
  paymentMethod: Enum['card','upi','wallet'],
  provider: Enum['stripe','razorpay'],
  transactionId: String (unique),
  idempotencyKey: String (unique),  // For preventing duplicate charges
  status: Enum['pending','completed','failed'],
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### `Refund.js` - Refund
```javascript
{
  payment: ObjectId (ref: Payment),
  amount: Number,
  reason: String,
  status: Enum['pending','completed','failed'],
  transactionId: String (unique),
  idempotencyKey: String (unique),  // For preventing duplicate refunds
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### `Settlement.js` - Settlement
```javascript
{
  doctor: ObjectId (ref: Doctor),
  period: {
    startDate: Date,
    endDate: Date
  },
  payments: [ObjectId] (ref: Payment),
  grossAmount: Number,
  deductions: {
    platformFee: Number,
    taxes: Number,
    refunds: Number
  },
  netAmount: Number,
  status: Enum['pending','processing','completed','failed'],
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    holderName: String
  },
  transactionId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Blood Bank System

#### `BloodDonor.js` - Donor
```javascript
{
  title: String,
  name: String,
  bloodGroup: Enum['O+','O-','A+','A-','B+','B-','AB+','AB-'],
  email: String,
  phone: String,
  location: String,
  lastDonationDate: Date,
  isAvailable: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### `BloodDonation.js` - Donation Record
```javascript
{
  donor: ObjectId (ref: BloodDonor),
  bloodGroup: String,
  quantityML: Number,
  donationDate: Date,
  status: Enum['scheduled','completed','cancelled'],
  createdAt: Date,
  updatedAt: Date
}
```

#### `BloodRequest.js` - Request
```javascript
{
  patient: ObjectId (ref: User),
  bloodGroup: Required,
  urgency: Enum['normal','urgent','critical'],
  quantityML: Number,
  reason: String,
  status: Enum['pending','fulfilled','cancelled'],
  createdAt: Date,
  updatedAt: Date
}
```

### Engagement & Feedback

#### `Rating.js` - Review
```javascript
{
  user: ObjectId (ref: User),
  doctor: ObjectId (ref: Doctor),
  appointment: ObjectId (ref: Appointment),
  rating: Number (1-5),
  review: String,
  helpful: Number (count),
  createdAt: Date,
  updatedAt: Date
}
```

#### `SupportTicket.js` - Support
```javascript
{
  user: ObjectId (ref: User),
  email: String,
  subject: String,
  description: String,
  category: Enum['technical','billing','feedback','other'],
  priority: Enum['low','medium','high'],
  status: Enum['open','in-progress','resolved','closed'],
  attachments: [String],
  response: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Model Features

### Schema Options
All models use these common options:
```javascript
{
  timestamps: true,           // Adds createdAt, updatedAt
  collection: 'modelName',    // Explicit collection name
  validateBeforeSave: true,   // Validate before saving
  strict: true                // Only allow schema fields
}
```

### Indexing
Most models have indexes for:
- Foreign keys (for joins)
- Unique fields (email, phone, etc.)
- Frequently queried fields (status, date ranges)
- Compound indexes for performance

### Virtuals
Virtual fields for computed properties:
```javascript
// Example: User's age from dateOfBirth
userSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.profile.dateOfBirth.getFullYear();
});
```

### Pre/Post Hooks
Models use Mongoose hooks for:
- Password hashing (before save)
- Audit logging (after save)
- Cleanup (before delete)

## Best Practices

1. **Validation** - Define validation rules at schema level
2. **Indexing** - Index frequently queried fields
3. **Constraints** - Use unique/sparse indexes appropriately
4. **References** - Use ObjectId for relationships
5. **Timestamps** - Always track creation and updates
6. **Transactions** - Use MongoDB sessions for multi-document changes
7. **Testing** - Test schema with edge cases

## Querying Examples

```javascript
// Find user by email
const user = await User.findOne({ email: 'user@example.com' });

// Find appointments for a doctor
const appointments = await Appointment.find({
  doctor: doctorId,
  appointmentDate: { $gte: new Date() }
}).populate('user doctor');

// Aggregate payments by doctor
const stats = await Payment.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$doctor', total: { $sum: '$amount' } } }
]);
```

## Troubleshooting

### Connection Issues
- Check MongoDB URI in environment
- Verify connection options
- Check firewall/network access

### Validation Errors
- Check required fields are provided
- Verify data types match schema
- Review custom validation rules

### Query Performance
- Check indexes are created
- Use `.explain()` for query analysis
- Avoid N+1 queries with `.populate()`
