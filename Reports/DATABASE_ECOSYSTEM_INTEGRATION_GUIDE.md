# Database Ecosystem Integration Guide

**Last Updated:** June 14, 2026  
**Status:** Production Ready - All 31 Tables Fully Integrated  

---

## Table of Contents
1. [Overview](#overview)
2. [Ecosystem Architecture](#ecosystem-architecture)
3. [Real-Time Connections](#real-time-connections)
4. [Security Implementation](#security-implementation)
5. [Data Flow Examples](#data-flow-examples)
6. [Integration Patterns](#integration-patterns)
7. [Error Handling](#error-handling)
8. [Monitoring & Debugging](#monitoring--debugging)

---

## Overview

The healthcare platform database consists of **31 interconnected tables** working as a unified ecosystem where:

- **Data flows in real-time** via MongoDB change streams
- **Actions cascade automatically** through hooks and middleware
- **Security is enforced** at every relationship
- **Audit trails track** all operations
- **Transactions ensure** data consistency

### Key Components:
1. **DatabaseEcosystemManager** - Core orchestrator
2. **RealTimeEventSystem** - Live event streaming
3. **DatabaseSecurityManager** - Access control & encryption
4. **Model Hooks** - Automatic cascading operations

---

## Ecosystem Architecture

### Tier 1: Core Entities
```
┌─────────────────────────────────────────────────────┐
│              CORE ENTITIES (Root Level)             │
├─────────────────────────────────────────────────────┤
│ • User (patient, donor, family)                    │
│ • Doctor (healthcare provider)                     │
│ • Admin (system administrator)                     │
│ • SystemSetting (global configuration)             │
└─────────────────────────────────────────────────────┘
```

### Tier 2: Associated Data
```
┌──────────────────────────────────────────────────────┐
│        ASSOCIATED DATA (Profiles & Config)          │
├──────────────────────────────────────────────────────┤
│ USER EXTENSIONS:          │ DOCTOR EXTENSIONS:       │
│ • UserWallet              │ • DoctorAvailability     │
│ • UserActivity            │ • DoctorBankDetails      │
│ • BloodDonor              │ • Rating (aggregate)     │
│ • HealthReading           │ • Settlement (earnings)  │
│ • HealthAnalysis          │                          │
│ • HealthPrediction        │ ADMIN EXTENSIONS:        │
│ • MedicalReport           │ • RefreshToken           │
│ • MedicineReminder        │ • AuditLog               │
└──────────────────────────────────────────────────────┘
```

### Tier 3: Transactional Data
```
┌──────────────────────────────────────────────────────┐
│     TRANSACTIONAL DATA (Business Operations)        │
├──────────────────────────────────────────────────────┤
│ • Appointment (booking)                             │
│   ├─ Payment (transaction)                          │
│   │   ├─ Refund (reversal)                         │
│   │   ├─ RevenueLedger (accounting)                │
│   │   └─ Settlement (doctor payout)                │
│   ├─ Rating (feedback)                             │
│   ├─ AppointmentReminder (notifications)           │
│   └─ MedicalReport (clinical)                      │
└──────────────────────────────────────────────────────┘
```

### Tier 4: Support & Marketing
```
┌──────────────────────────────────────────────────────┐
│      SUPPORT & ENGAGEMENT (Customer Ops)            │
├──────────────────────────────────────────────────────┤
│ • Notification (all user alerts)                    │
│ • SupportTicket (customer service)                 │
│ • AppFeedback (feedback collection)                │
│ • Campaign (marketing)                             │
│ • Content (educational)                            │
│ • Coupon (promotions)                              │
│ • BloodRequest (blood bank)                        │
│ • BloodDonation (donation tracking)                │
└──────────────────────────────────────────────────────┘
```

### Tier 5: Configuration & Security
```
┌──────────────────────────────────────────────────────┐
│      CONFIGURATION & COMPLIANCE (Admin)              │
├──────────────────────────────────────────────────────┤
│ • FeeConfig (pricing)                              │
│ • PaymentGatewayConfig (payment setup)             │
│ • InsurancePartner (partnerships)                  │
│ • Backup (data recovery)                           │
└──────────────────────────────────────────────────────┘
```

---

## Real-Time Connections

### Event Flow Architecture

```
EVENT TRIGGER (Database Change)
        ↓
   Change Stream Detector
        ↓
   Event Handler (RealTimeEventSystem)
        ↓
   ┌─────────┬──────────┬────────────┬──────────┐
   ↓         ↓          ↓            ↓          ↓
 Notify   Update   Trigger      Send Alert  Create
 Users   Related  Workflow      Admin       Audit Log
         Tables
```

### Real-Time Event Types

#### 1. **Appointment Events**
```javascript
// When new appointment created:
Appointment.insert → 
  ✓ Create AppointmentReminder (24h before)
  ✓ Create Notification (doctor receives alert)
  ✓ Log UserActivity (user action tracked)
  ✓ Emit to WebSocket (real-time update)

// When appointment status changes:
Appointment.update(status) →
  ✓ Notify user and doctor
  ✓ Update doctor's appointment count
  ✓ If CANCELLED → trigger refund workflow
  ✓ If COMPLETED → enable rating
  ✓ Log all changes
```

#### 2. **Payment Events**
```javascript
// When payment is captured:
Payment.update(status='CAPTURED') →
  ✓ Create RevenueLedger entry (financial record)
  ✓ Update Doctor earnings (pending settlement)
  ✓ Create Notification (both parties)
  ✓ Update Appointment status
  ✓ Emit payment_success event
  ✓ Schedule auto-settlement if threshold reached

// When payment fails:
Payment.update(status='FAILED') →
  ✓ Notify user (payment failed)
  ✓ Mark Appointment as unpaid
  ✓ Log failed payment
  ✓ Send retry notification after 5 min
```

#### 3. **Settlement Events**
```javascript
// When settlement is created:
Settlement.insert →
  ✓ Update all related Payment records
  ✓ Update Doctor's earnings (clear pending)
  ✓ Create financial audit entry
  ✓ Notify doctor (settlement ready)
  ✓ Log admin action

// When settlement is completed:
Settlement.update(status='COMPLETED') →
  ✓ Notify doctor (funds transferred)
  ✓ Update Doctor earnings snapshot
  ✓ Create settlement confirmation
  ✓ Log bank transfer details
```

#### 4. **Health & Alert Events**
```javascript
// When health reading is recorded:
HealthReading.insert →
  ✓ Check if abnormal
  ✓ If abnormal → Create alert Notification
  ✓ Store in HealthAnalysis queue
  ✓ If trend detected → trigger HealthPrediction
  ✓ Emit to user in real-time
  ✓ Log to UserActivity

// Abnormal reading triggers:
  → Immediate Notification to user
  → Doctor alert if severe
  → Wellness reminder
  → Follow-up appointment suggestion
```

#### 5. **Support & Ticketing Events**
```javascript
// When support ticket created:
SupportTicket.insert →
  ✓ Assign to available admin
  ✓ Create Notification (admin)
  ✓ Log to audit trail
  ✓ Set auto-escalation timer

// When ticket message added:
SupportTicket.messages.push →
  ✓ Notify recipient immediately
  ✓ Update ticket status
  ✓ Log message in audit
  ✓ Reset response timer

// When ticket resolved:
SupportTicket.update(status='CLOSED') →
  ✓ Notify user/doctor
  ✓ Request feedback
  ✓ Calculate resolution time
  ✓ Update admin metrics
  ✓ Create audit log
```

#### 6. **Wallet Events**
```javascript
// When wallet balance updated:
UserWallet.update(balance) →
  ✓ Emit wallet_updated event
  ✓ Store transaction in history
  ✓ Update user notification
  ✓ Check low balance threshold
  ✓ If low → send top-up reminder

// When refund credited to wallet:
Refund.update(status='COMPLETED') →
  ✓ Credit wallet immediately
  ✓ Update available balance
  ✓ Create transaction entry
  ✓ Send confirmation notification
```

---

## Security Implementation

### Access Control Matrix

```
┌──────────────────┬──────┬────────┬────────┬──────────┐
│ Resource         │ USER │ DOCTOR │ ADMIN  │ SUPER    │
├──────────────────┼──────┼────────┼────────┼──────────┤
│ Own Profile      │ R/W  │ R/W    │ R      │ R/W      │
│ Other Profiles   │ R    │ R      │ R      │ R/W      │
│ Appointments     │ Own  │ Own    │ All    │ All      │
│ Payments         │ Own  │ Own    │ All    │ All      │
│ Settlements      │ Own  │ Own    │ View   │ All      │
│ Bank Details     │ -    │ Own    │ View   │ All      │
│ Audit Logs       │ -    │ -      │ View   │ All      │
│ Settings         │ -    │ -      │ -      │ R/W      │
└──────────────────┴──────┴────────┴────────┴──────────┘
```

### Validation Rules

#### Referential Integrity
```javascript
// Doctor verification required for appointments
Appointment.create({
  doctorId: '123'  // Must be VERIFIED status
})

// Payment must link to valid appointment
Payment.create({
  appointmentId: '456'  // Must exist
  userId: '789'          // Must match appointment
})

// Refund ties payment and appointment
Refund.create({
  paymentId: '111',      // Must be captured
  appointmentId: '112'   // Must match payment
})

// Settlement needs verified bank details
Settlement.create({
  doctorId: '222'  // Must have verified DoctorBankDetails
})
```

#### Data Consistency Rules
```javascript
// Appointment payment status flow:
PENDING_PAYMENT → LOCKED → PAID → CONFIRMED → COMPLETED
     (15 min)    (user has 15m to pay)

// Payment capture flow:
PENDING → AUTHORIZED → CAPTURED → SETTLED

// Refund processing flow:
PENDING → APPROVED → PROCESSING → COMPLETED
         (admin review)

// Doctor verification flow:
PENDING → VERIFIED (or REJECTED/SUSPENDED)
```

### Encryption & Sensitive Data

```javascript
ENCRYPTED FIELDS:
├─ User: passwordHash, phone, email
├─ Doctor: passwordHash, personalPhone, bankDetails.accountNumber
├─ Admin: passwordHash, email
└─ Payment: razorpayPaymentId

AUDIT TRACKED:
├─ All bank detail changes
├─ Doctor verification status changes
├─ Payment refunds
├─ Settlement processing
├─ Admin actions
└─ User sensitive operations
```

---

## Data Flow Examples

### Example 1: Complete Appointment Journey

```
USER BOOKS APPOINTMENT
├─ Check doctor verification ✓
├─ Validate available slots ✓
├─ Create Appointment record
│  └─ Status: PENDING_PAYMENT
│  └─ Set 15-minute payment window
│
├─ PAYMENT INITIATED
│  ├─ Create Payment record
│  │  └─ Generate Razorpay order
│  ├─ Send Notification → user
│  ├─ Log UserActivity → PAYMENT_INITIATED
│  └─ Emit WebSocket event
│
├─ PAYMENT GATEWAY CALLBACK
│  ├─ Verify webhook signature
│  ├─ Update Payment status: CAPTURED
│  ├─ Create RevenueLedger entry
│  ├─ Update Doctor earnings
│  │  ├─ earnings.pendingSettlement += amount
│  │  ├─ earnings.appointmentCount += 1
│  │  └─ earnings.lastSettlementDate = now
│  ├─ Update Appointment status: CONFIRMED
│  ├─ Create AppointmentReminder (24h before)
│  │  ├─ Channel: SMS, PUSH_NOTIFICATION
│  │  ├─ Status: SCHEDULED
│  │  └─ Emit reminder_created event
│  ├─ Send Notifications
│  │  ├─ To User: "Payment received, appointment confirmed"
│  │  ├─ To Doctor: "New appointment on [date]"
│  │  └─ To Admin: Log in audit
│  ├─ Log UserActivity → PAYMENT_SUCCESS
│  └─ Emit payment_captured event
│
├─ APPOINTMENT DAY (24h before)
│  ├─ RealTimeEventSystem detects reminder time
│  ├─ Send reminder via all channels
│  ├─ Update AppointmentReminder: isSent = true
│  └─ Log delivery details
│
├─ APPOINTMENT DAY (execution)
│  ├─ Generate QR code for check-in
│  ├─ Update Appointment: checkInTime = now
│  ├─ Notify doctor (patient arriving)
│  ├─ Update status: CHECKED_IN → IN_PROGRESS → COMPLETED
│  └─ Create MedicalReport (if generated)
│
├─ POST-APPOINTMENT
│  ├─ Enable Rating (30 days to rate)
│  │  ├─ Send Notification → rate appointment
│  │  └─ Trigger HealthAnalysis if health readings exist
│  ├─ If rating submitted
│  │  ├─ Create Rating record
│  │  ├─ Update Doctor ratings aggregate
│  │  │  ├─ averageRating = (sum / count)
│  │  │  ├─ totalRatings += 1
│  │  │  ├─ serviceRating = avg of categories
│  │  │  └─ lastRatingDate = now
│  │  └─ Log UserActivity → RATING_SUBMITTED
│  └─ Mark Appointment as COMPLETED
│
└─ SETTLEMENT (monthly)
   ├─ Aggregate all captured payments
   ├─ Calculate net amount (fees - refunds - commission)
   ├─ Create Settlement record
   ├─ Update all Payment records: settlementStatus = SETTLED
   ├─ Log audit: SETTLEMENT_CREATED
   ├─ Notify doctor
   └─ Process bank transfer via Razorpay

Status Tracking: User Activity logs all steps
Audit Trail: Every change recorded with admin, timestamp, reason
Real-Time: WebSocket updates sent at each milestone
```

### Example 2: Refund Processing

```
APPOINTMENT CANCELLED BY USER
├─ User initiates cancellation
│  └─ Create UserActivity → APPOINTMENT_CANCEL
│
├─ Check cancellation policy
│  ├─ If < 2 hours before: 0% refund
│  ├─ If 2-24 hours: 50% refund
│  └─ If > 24 hours: 100% refund
│
├─ Update Appointment
│  ├─ Status: CANCELLED_BY_USER
│  ├─ cancellation.cancelledAt = now
│  ├─ cancellation.reason = "User request"
│  ├─ cancellation.refundPercent = calculated%
│  └─ Trigger refund workflow
│
├─ CREATE REFUND REQUEST
│  ├─ Create Refund record
│  │  ├─ Status: PENDING
│  │  ├─ Amount: calculated based on %
│  │  ├─ Reason: "User cancellation"
│  │  ├─ Generate idempotencyKey (prevent duplicates)
│  │  └─ Log in UserActivity
│  ├─ Send Notification
│  │  ├─ To User: "Refund requested, pending admin approval"
│  │  ├─ To Doctor: "Appointment cancelled"
│  │  └─ To Admin: "Review refund request"
│  └─ Log audit: REFUND_INITIATED
│
├─ ADMIN REVIEW (Auto or Manual)
│  ├─ Check refund rules
│  ├─ If valid: Update Refund
│  │  ├─ Status: APPROVED
│  │  ├─ approvedBy = admin ID
│  │  ├─ Log audit: REFUND_APPROVED
│  │  └─ Trigger payment gateway
│  └─ If invalid: Set Status: REJECTED
│
├─ REFUND PROCESSING
│  ├─ Call Razorpay refund API
│  │  ├─ Use idempotencyKey for safety
│  │  ├─ Get gatewayRefundId
│  │  └─ Store in Refund record
│  ├─ Update Refund
│  │  ├─ Status: PROCESSING
│  │  ├─ gatewayRefundId = "rfnd_xxx"
│  │  └─ processedAt = now
│  └─ Log audit: REFUND_PROCESSING
│
├─ REFUND COMPLETED (Webhook from gateway)
│  ├─ Verify webhook signature
│  ├─ Update Refund
│  │  ├─ Status: COMPLETED
│  │  ├─ completedAt = now
│  │  └─ Log in audit
│  ├─ Credit UserWallet
│  │  ├─ Find wallet by userId
│  │  ├─ Add transaction: REFUND, amount
│  │  ├─ Update availableBalance += amount
│  │  └─ Log transaction history
│  ├─ Update Payment
│  │  ├─ Status: REFUNDED
│  │  ├─ refundAmount = amount
│  │  ├─ refundedAt = now
│  │  └─ Log audit
│  ├─ Update Doctor earnings
│  │  ├─ pendingSettlement -= doctorShare
│  │  ├─ Update AppointmentCount
│  │  └─ Log change
│  ├─ Create Notification
│  │  ├─ To User: "Refund of ₹X credited to wallet"
│  │  ├─ To Doctor: "Refund of ₹X deducted from earnings"
│  │  └─ To Admin: Log in system
│  ├─ Emit WebSocket event: refund_completed
│  └─ Log UserActivity: REFUND_COMPLETED

Idempotency: Duplicate refund requests ignored
Audit Trail: Every step recorded with exact amounts
Real-Time: All parties notified immediately
Wallet: Refund appears in real-time
```

### Example 3: Real-Time Health Monitoring

```
USER RECORDS HEALTH READING
├─ HealthReading.insert
│  ├─ recordedAt = now
│  ├─ userId = user ID
│  ├─ readingType = "blood_pressure", "heart_rate", etc
│  └─ value, unit, source = "mobile_app"
│
├─ REAL-TIME PROCESSING (Change Stream)
│  ├─ Check if reading is abnormal
│  │  ├─ Compare against thresholds
│  │  ├─ Check user's baseline
│  │  ├─ isNormal = false if abnormal
│  │  └─ severity = "LOW", "MEDIUM", "HIGH"
│  │
│  ├─ If ABNORMAL
│  │  ├─ Create Notification (ALERT)
│  │  │  ├─ Title: "Health Alert - Abnormal Reading"
│  │  │  ├─ Message: specific guidance
│  │  │  └─ Severity: severity level
│  │  ├─ Emit WebSocket → user device (real-time)
│  │  ├─ Send SMS if HIGH severity
│  │  ├─ Log UserActivity → HEALTH_ALERT
│  │  └─ If very high → Suggest immediate doctor contact
│  │
│  └─ TRIGGER ANALYSIS (if 5+ readings this month)
│     ├─ Create HealthAnalysis record
│     │  ├─ Analyze trend (improving/declining)
│     │  ├─ Risk assessment
│     │  ├─ AI recommendations
│     │  └─ Lifestyle suggestions
│     ├─ If risk detected
│     │  ├─ Create HealthPrediction
│     │  ├─ Send detailed report to user
│     │  └─ Suggest doctor appointment
│     └─ Log activity: HEALTH_ANALYSIS_CREATED
│
├─ UPDATE USER PROFILE
│  ├─ Add to HealthReading collection
│  ├─ Update User.health aggregate (in cache)
│  └─ Emit health_reading_recorded event
│
└─ MONTHLY HEALTH REPORT
   ├─ Aggregate all readings
   ├─ Generate trend graphs
   ├─ Create wellness summary
   ├─ Send report via Notification
   ├─ Store in UserActivity
   └─ Suggest follow-up appointments if needed

Real-Time: Mobile app shows reading instantly
Analysis: Automatic after threshold
Alerts: Immediate for abnormal readings
Doctor: Can see patient health trends
Audit: All readings tracked in UserActivity
```

---

## Integration Patterns

### Pattern 1: Event-Driven Cascading

When a primary event occurs, automatically trigger dependent operations:

```javascript
// Example: Payment Captured
Payment.post('save', async (payment) => {
    if (payment.paymentStatus === 'CAPTURED') {
        // 1. Financial Record
        await RevenueLedger.create({...});
        
        // 2. Doctor Earnings Update
        await Doctor.findByIdAndUpdate(payment.doctorId, {
            $inc: {'earnings.pendingSettlement': payment.doctorAmount}
        });
        
        // 3. Appointment Confirmation
        await Appointment.findByIdAndUpdate(payment.appointmentId, {
            status: 'CONFIRMED'
        });
        
        // 4. Reminders
        await AppointmentReminder.create({...});
        
        // 5. Notifications
        await Notification.create([...]);
        
        // 6. Real-time Event
        eventSystem.emit('payment_captured', payment);
        
        // 7. Audit
        await AuditLog.create({...});
    }
});
```

### Pattern 2: Atomic Transactions

For multi-table operations that must succeed together:

```javascript
// Create appointment + payment in single transaction
const session = await mongoose.startSession();
session.startTransaction();

try {
    const appointment = await Appointment.create([{...}], {session});
    const payment = await Payment.create([{
        appointmentId: appointment[0]._id,
        ...
    }], {session});
    
    await session.commitTransaction();
    
    // After successful commit, emit events
    eventSystem.emit('appointment_created', appointment[0]);
    
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

### Pattern 3: Eventual Consistency

For operations that can complete asynchronously:

```javascript
// Create appointment - payment can come later
Appointment.create({status: 'PENDING_PAYMENT'});

// Payment arrives within 15 minutes
// When payment confirmed, rest updates cascade automatically
Payment.post('save', async (payment) => {
    // This triggers all dependent operations
    // Even if they're slightly delayed
});

// Real-time system watches and propagates changes
changeStream.on('change', (changeEvent) => {
    // Forward to all interested parties
});
```

### Pattern 4: One-to-Many Notifications

Send to multiple recipients with different message variants:

```javascript
// When appointment status changes
async function notifyAppointmentStatusChange(appointment, newStatus) {
    // Notify user with patient-focused message
    await Notification.create({
        recipientId: appointment.userId,
        message: `Your appointment on ${date} has been ${newStatus}`
    });
    
    // Notify doctor with clinical focus
    await Notification.create({
        recipientId: appointment.doctorId,
        message: `Patient appointment on ${date} has been ${newStatus}`
    });
    
    // Notify admin for monitoring
    if (newStatus === 'CANCELLED') {
        await Notification.create({
            recipientId: adminId,
            type: 'SYSTEM',
            message: `Appointment ${appointmentId} cancelled`
        });
    }
    
    // Emit real-time WebSocket events
    eventSystem.emitToUser(appointment.userId, 'appointment_updated', {...});
    eventSystem.emitToDoctor(appointment.doctorId, 'appointment_updated', {...});
}
```

---

## Error Handling

### Error Recovery Strategies

```javascript
// 1. IDEMPOTENCY: Duplicate prevention
const existingRefund = await Refund.findOne({idempotencyKey});
if (existingRefund) return existingRefund; // Don't create duplicate

// 2. RETRY LOGIC: Failed operations
const MAX_RETRIES = 3;
let attempts = 0;
while (attempts < MAX_RETRIES) {
    try {
        await processSettlement();
        break;
    } catch (error) {
        attempts++;
        await delay(1000 * attempts); // Exponential backoff
        if (attempts === MAX_RETRIES) {
            // Log for manual review
            await ErrorLog.create({...});
        }
    }
}

// 3. FALLBACK: Alternative processing
try {
    await processViaRazorpay();
} catch (error) {
    // Fallback to manual processing
    await Settlement.create({
        status: 'MANUAL_REVIEW',
        reason: error.message
    });
}

// 4. ROLLBACK: Transaction abort
session.abortTransaction(); // Undo all changes
await AuditLog.create({
    action: 'TRANSACTION_ROLLED_BACK',
    reason: error.message
});
```

---

## Monitoring & Debugging

### Key Metrics to Monitor

```javascript
// 1. APPOINTMENT METRICS
- Total appointments created
- Appointment cancellation rate
- Average time to payment
- Payment success rate
- Refund percentage

// 2. FINANCIAL METRICS
- Total revenue
- Doctor earnings (pending/settled)
- Commission collected
- Refund rate
- Settlement frequency

// 3. HEALTH METRICS
- Health reading frequency
- Alert rate (abnormal readings)
- Analysis completion rate
- Prediction accuracy

// 4. SYSTEM METRICS
- API response time
- Event processing latency
- Change stream lag
- Error rate by operation
- Database query performance

// 5. USER METRICS
- Active users
- Appointment completion rate
- Rating submission rate
- Support ticket resolution time
```

### Debug Tools

```javascript
// View relationship validation
await securityManager.validateReferentialIntegrity(models);
// Returns array of orphaned records

// Check data consistency
await securityManager.validateDataConsistency(models);
// Returns array of inconsistencies

// Trace event flow
eventSystem.getEventHistory(limit=100);
// Returns recent event records

// Audit trail search
await AuditLog.find({
    targetModel: 'Payment',
    createdAt: {$gte: startDate}
});

// Change stream monitoring
models.Appointment.watch().on('change', (event) => {
    console.log('Appointment changed:', event.operationType, event.fullDocument);
});
```

---

## Implementation Checklist

- [x] All 31 models created with relationships
- [x] DatabaseEcosystemManager service implemented
- [x] RealTimeEventSystem with change streams
- [x] DatabaseSecurityManager with RBAC
- [x] Hooks for automatic cascading
- [x] Event emission for WebSocket integration
- [x] Audit trail for all operations
- [x] Transaction support for atomic operations
- [x] Error handling and recovery
- [x] Real-time notifications
- [x] Access control matrix
- [x] Referential integrity validation
- [x] Data consistency checks
- [x] Idempotency keys for duplicate prevention
- [x] TTL indexes for auto-cleanup

---

## Next Steps

1. **Initialize Ecosystem on Startup:**
```javascript
const DatabaseEcosystemManager = require('./DatabaseEcosystemManager');
const RealTimeEventSystem = require('./RealTimeEventSystem');

const ecosystem = new DatabaseEcosystemManager();
await ecosystem.initializeModels();
ecosystem.setupEcosystemHooks();

const realtimeSystem = new RealTimeEventSystem(io);
realtimeSystem.initializeChangeStreams(ecosystem.models);
```

2. **Setup Security Manager:**
```javascript
const DatabaseSecurityManager = require('./DatabaseSecurityManager');

const security = new DatabaseSecurityManager();
security.defineAccessControl();
security.defineRelationshipRules();
```

3. **Create Middleware for Routes:**
```javascript
app.use(async (req, res, next) => {
    if (req.user) {
        const canAccess = security.canAccess(
            req.user.id,
            req.user.role,
            req.resource,
            req.action
        );
        if (!canAccess) return res.status(403).send('Access denied');
    }
    next();
});
```

4. **Monitor and Log:**
```javascript
// Setup logging for all database operations
mongoose.set('debug', true);

// Monitor real-time events
realtimeSystem.on('payment_captured', (event) => {
    logger.info('Payment captured:', event);
});
```

---

**Last Updated:** June 14, 2026  
**Maintained By:** Healthcare Platform Engineering Team  
**Version:** 1.0 Production Ready
