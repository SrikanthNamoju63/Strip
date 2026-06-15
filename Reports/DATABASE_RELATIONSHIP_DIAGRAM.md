# Database Table Relationships & Data Flow Diagram

## 🔗 Complete Relationship Map

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              HEALTHCARE PLATFORM ECOSYSTEM                                   │
│                           31 Tables - Complete Integration                                   │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            CORE ENTITIES (Foundation Layer)                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐                      │
│  │     USER     │          │    DOCTOR    │          │    ADMIN     │                      │
│  ├──────────────┤          ├──────────────┤          ├──────────────┤                      │
│  │ ID (PK)      │          │ ID (PK)      │          │ ID (PK)      │                      │
│  │ Email (UQ)   │          │ Email (UQ)   │          │ Username(UQ) │                      │
│  │ Phone (UQ)   │          │ Phone (UQ)   │          │ Email (UQ)   │                      │
│  │ Name         │          │ Name         │          │ Role         │                      │
│  │ Role         │          │ Role         │          │ Permissions  │                      │
│  │ Address      │          │ Address      │          │ isActive     │                      │
│  │ BloodGroup   │          │ Specialization         │ createdBy → Self │                   │
│  │ Password     │          │ Registration# (UQ)     │ lastLogin    │                      │
│  │ ...etc       │          │ Verification Status    │ Password     │                      │
│  └──────────────┘          │ isVerified   │          └──────────────┘                      │
│         ▲                   │ isActive     │                 ▲                              │
│         │                   │ Facilities   │                 │                              │
│         │                   │ Education    │                 │                              │
│         │                   │ ...etc       │                 │                              │
│         │                   └──────────────┘                 │                              │
│         │                        ▲                          │                              │
│         └────────────────────────┼──────────────────────────┘                              │
│                                  │                                                         │
│                        (Core Users & Providers)                                            │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                        USER EXTENSIONS (User Profile Ecosystem)                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  USER (Primary) ═════════════════════════════════════════════════════════════════════════  │
│    │                                                                                        │
│    ├─→ UserWallet (1:1)                                                                    │
│    │   ├─ totalBalance, availableBalance, lockedBalance                                    │
│    │   ├─ transactions[] (history)                                                         │
│    │   └─ rewardPoints                                                                     │
│    │                                                                                        │
│    ├─→ UserActivity (1:M)                                                                  │
│    │   ├─ activityType (30+ types)                                                         │
│    │   ├─ resourceType                                                                     │
│    │   ├─ status, ipAddress, deviceInfo                                                    │
│    │   └─ anomalyScore, anomalousDetection                                                 │
│    │   [TTL: 1 year]                                                                       │
│    │                                                                                        │
│    ├─→ HealthReading (1:M) [Real-time]                                                     │
│    │   ├─ readingType (BP, HR, Glucose, etc)                                               │
│    │   ├─ value, unit, isNormal                                                            │
│    │   └─ Triggers: Abnormal → Notification                                                │
│    │                                                                                        │
│    ├─→ HealthAnalysis (1:M)                                                                │
│    │   ├─ Trend analysis (improving/declining)                                             │
│    │   ├─ Risk assessment                                                                  │
│    │   └─ Recommendations                                                                  │
│    │                                                                                        │
│    ├─→ HealthPrediction (1:M)                                                              │
│    │   ├─ ML-based predictions                                                             │
│    │   ├─ Risk scores                                                                      │
│    │   └─ Suggested interventions                                                          │
│    │                                                                                        │
│    ├─→ MedicineReminder (1:M)                                                              │
│    │   ├─ Medicine name, dosage, frequency                                                 │
│    │   └─ Reminder schedule                                                                │
│    │                                                                                        │
│    ├─→ BloodDonor (0:1) [Optional]                                                         │
│    │   ├─ bloodGroup, lastDonationDate                                                     │
│    │   ├─ isEligible, eligibilityReason                                                    │
│    │   └─ Tracks: Alcohol, Smoking status                                                  │
│    │                                                                                        │
│    └─→ Notification (1:M) [Real-time]                                                      │
│        ├─ All alerts, updates, messages                                                    │
│        ├─ read status, timestamps                                                          │
│        └─ Types: Payment, Health, Support, etc                                             │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       DOCTOR EXTENSIONS (Doctor Profile Ecosystem)                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  DOCTOR (Primary) ═════════════════════════════════════════════════════════════════════════ │
│    │                                                                                        │
│    ├─→ DoctorAvailability (1:1)                                                            │
│    │   ├─ weeklyAvailability[] (day, startTime, endTime, breaks)                           │
│    │   ├─ specialDates[] (exceptions, days off)                                            │
│    │   ├─ consultationModes[] (IN_PERSON, ONLINE, etc)                                     │
│    │   ├─ bufferTime, maxDailyLimit                                                        │
│    │   └─ isActive                                                                         │
│    │                                                                                        │
│    ├─→ DoctorBankDetails (1:1)                                                             │
│    │   ├─ accountNumber (UNIQUE, encrypted)                                                │
│    │   ├─ PAN, IFSC, GST (tax compliance)                                                  │
│    │   ├─ Aadhaar verification (KYC)                                                       │
│    │   ├─ razorpayAccountId, kycStatus                                                     │
│    │   ├─ settlementFrequency, minimumAmount                                               │
│    │   ├─ verificationStatus (PENDING/VERIFIED)                                            │
│    │   └─ updateHistory[] (audit trail)                                                    │
│    │                                                                                        │
│    ├─→ Rating (1:M) [After Appointment]                                                    │
│    │   ├─ overallRating (1-5), serviceRatings (detailed)                                    │
│    │   ├─ reviewText, wouldRecommend                                                       │
│    │   ├─ doctorResponse, helpful votes                                                    │
│    │   ├─ isVerified, isFlagged                                                            │
│    │   └─ Updates: Doctor.ratings.averageRating                                            │
│    │                                                                                        │
│    └─→ Notification (1:M) [Real-time]                                                      │
│        ├─ New appointments                                                                 │
│        ├─ Payment received                                                                 │
│        ├─ Settlement updates                                                               │
│        └─ New reviews                                                                      │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    APPOINTMENT ECOSYSTEM (Core Business Logic)                              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  USER ─→ DOCTOR: Appointment (1:M)                                                         │
│  Status Flow: PENDING_PAYMENT → LOCKED → PAID → CONFIRMED → COMPLETED                     │
│                                                                                             │
│  Appointment (Primary)                                                                      │
│    │                                                                                        │
│    ├─→ Payment (0:1) [Linked via appointmentId]                                            │
│    │   ├─ paymentMethod, amount                                                            │
│    │   ├─ paymentStatus (PENDING→CAPTURED→REFUNDED)                                        │
│    │   ├─ razorpayOrderId, razorpayPaymentId                                               │
│    │   ├─ transferStatus, settlementStatus                                                 │
│    │   └─ Webhooks: Idempotency key prevents duplicates                                    │
│    │                                                                                        │
│    ├─→ Refund (0:1) [Created if cancelled/failed]                                          │
│    │   ├─ Status: PENDING → APPROVED → PROCESSING → COMPLETED                              │
│    │   ├─ amount, reason                                                                   │
│    │   ├─ approvedBy (Admin), idempotencyKey                                               │
│    │   ├─ gatewayRefundId (from payment processor)                                         │
│    │   └─ Creates: UserWallet transaction, Notification                                    │
│    │                                                                                        │
│    ├─→ AppointmentReminder (0:M) [Real-time]                                               │
│    │   ├─ reminderType (PRE_APPOINTMENT, FOLLOW_UP)                                        │
│    │   ├─ reminderTime, channels (SMS, EMAIL, PUSH, WHATSAPP)                              │
│    │   ├─ deliveryStatus, deliveryLog[]                                                    │
│    │   ├─ userInteraction (opened, clicked, actionTaken)                                    │
│    │   └─ Auto-send 24h before                                                             │
│    │   [TTL: Auto-delete per expiryDate]                                                   │
│    │                                                                                        │
│    ├─→ MedicalReport (0:1) [After Appointment]                                             │
│    │   ├─ reportType, clinicalFindings                                                     │
│    │   ├─ prescriptions[], recommendations                                                 │
│    │   └─ doctorId, appointmentId                                                          │
│    │                                                                                        │
│    ├─→ Rating (0:1) [After Appointment]                                                    │
│    │   ├─ 30-day window to rate                                                            │
│    │   ├─ Updates: Doctor.ratings aggregate                                                │
│    │   └─ Unique constraint on (appointmentId)                                             │
│    │                                                                                        │
│    └─→ Notification (0:M) [Real-time]                                                      │
│        ├─ Appointment created                                                              │
│        ├─ Status changes                                                                   │
│        ├─ Reminders                                                                        │
│        └─ Completion notification                                                          │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ CASCADING OPERATIONS:                                                                │  │
│  │ Create Appointment:                                                                  │  │
│  │   → Create AppointmentReminder (24h before)                                          │  │
│  │   → Notify Doctor (real-time)                                                       │  │
│  │   → Log UserActivity                                                                │  │
│  │   → Emit WebSocket event                                                            │  │
│  │                                                                                      │  │
│  │ Payment Captured:                                                                   │  │
│  │   → Create RevenueLedger                                                            │  │
│  │   → Update Doctor earnings (pending settlement)                                     │  │
│  │   → Update Appointment status: CONFIRMED                                            │  │
│  │   → Send Notifications (both parties)                                               │  │
│  │   → Emit payment_captured event                                                     │  │
│  │                                                                                      │  │
│  │ Appointment Cancelled:                                                              │  │
│  │   → Calculate refund (0/50/100% based on timing)                                     │  │
│  │   → Create Refund request                                                           │  │
│  │   → Process refund (if approved)                                                    │  │
│  │   → Credit UserWallet                                                               │  │
│  │   → Deduct from Doctor earnings                                                     │  │
│  │   → Send Notifications (all parties)                                                │  │
│  │                                                                                      │  │
│  │ Appointment Completed:                                                              │  │
│  │   → Enable Rating (30-day window)                                                   │  │
│  │   → Trigger HealthAnalysis (if health data exists)                                  │  │
│  │   → Send follow-up notifications                                                    │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    FINANCIAL ECOSYSTEM (Money Flow & Settlements)                           │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│                  APPOINTMENT PAYMENT JOURNEY                                               │
│                                                                                             │
│  User Pays (15-min window)                                                                 │
│    ↓                                                                                        │
│  Payment (Status: PENDING)                                                                 │
│    ↓                                                                                        │
│  Call Razorpay API                                                                         │
│    ↓                                                                                        │
│  Gateway Response (Webhook)                                                                │
│    ↓                                                                                        │
│  Payment (Status: CAPTURED) ←→ RevenueLedger [Created]                                     │
│    │                              ├─ Gross amount                                          │
│    │                              ├─ Platform fee                                          │
│    │                              ├─ Commission                                            │
│    │                              ├─ Doctor payout                                         │
│    │                              └─ Net profit                                            │
│    │                                                                                        │
│    ├─→ Doctor (earnings updated)                                                           │
│    │   ├─ totalEarnings += amount                                                          │
│    │   ├─ pendingSettlement += amount                                                      │
│    │   └─ lastSettlementDate = now                                                         │
│    │                                                                                        │
│    ├─→ Appointment (status updated)                                                        │
│    │   └─ Status: CONFIRMED                                                               │
│    │                                                                                        │
│    └─→ Monthly Settlement Trigger                                                          │
│        ↓                                                                                    │
│    Settlement (Created)                                                                    │
│        ├─ doctorId, period, totalAmount                                                    │
│        ├─ bankDetails snapshot                                                             │
│        ├─ paymentIds[] (linked payments)                                                   │
│        ├─ Status: PENDING → INITIATED → PROCESSING → COMPLETED                             │
│        └─ approvedBy, approvedAt                                                           │
│        ↓                                                                                    │
│    Call Bank Transfer API                                                                  │
│        ├─ razorpayTransferId                                                               │
│        ├─ Bank details verification                                                        │
│        └─ Amount transfer                                                                  │
│        ↓                                                                                    │
│    Settlement Completed                                                                    │
│        ├─ Update all linked Payment records (settlementStatus: SETTLED)                    │
│        ├─ Update Doctor earnings (clear pending settlement)                                │
│        ├─ Create Notification (doctor gets paid)                                           │
│        └─ Create AuditLog (complete trace)                                                 │
│                                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ REFUND SCENARIO (Appointment Cancelled):                                           │  │
│  │                                                                                      │  │
│  │ Appointment Cancelled → Refund Created (PENDING)                                   │  │
│  │   ↓                                                                                 │  │
│  │ Admin Reviews & Approves → Refund (APPROVED)                                       │  │
│  │   ↓                                                                                 │  │
│  │ Call Payment Gateway (Razorpay) → Refund (PROCESSING)                              │  │
│  │   ↓ [Gateway Webhook Response]                                                    │  │
│  │ Refund (COMPLETED) → Credit UserWallet                                             │  │
│  │   ├─ UserWallet.availableBalance += amount                                         │  │
│  │   ├─ Create transaction record                                                     │  │
│  │   └─ Send Notification (refund received)                                           │  │
│  │                                                                                      │  │
│  │ Update Payment: Status = REFUNDED                                                   │  │
│  │ Update Doctor: pendingSettlement -= doctorShare                                     │  │
│  │ Update RevenueLedger: Status = REFUNDED (immutable, for records)                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    SUPPORT & ENGAGEMENT ECOSYSTEM                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  USER/DOCTOR                                                                               │
│    ├─→ SupportTicket (1:M)                                                                 │
│    │   ├─ ticketId, category, priority                                                    │
│    │   ├─ messages[] (conversation thread)                                                 │
│    │   ├─ assignedTo (Admin)                                                               │
│    │   ├─ Status: OPEN → IN_PROGRESS → RESOLVED → CLOSED                                  │
│    │   └─ resolvedAt, closedAt                                                             │
│    │                                                                                        │
│    ├─→ AppFeedback (1:M)                                                                   │
│    │   ├─ feedbackType (BUG, FEATURE, GENERAL, EXPERIENCE)                                 │
│    │   ├─ feedbackText, deviceInfo, appVersion                                             │
│    │   ├─ Status: OPEN → IN_PROGRESS → RESOLVED                                            │
│    │   └─ adminReply                                                                       │
│    │                                                                                        │
│    └─→ Notification (1:M) [Real-time]                                                      │
│        ├─ Multiple types: BLOOD, APPOINTMENT, MEDICINE, HEALTH, PAYMENT, SYSTEM           │
│        ├─ read status tracking                                                             │
│        └─ metadata for context                                                             │
│                                                                                             │
│  ADMIN                                                                                      │
│    ├─→ Campaign (1:M)                                                                      │
│    │   ├─ campaignCode (UNIQUE)                                                            │
│    │   ├─ type (EMAIL, SMS, PUSH, WHATSAPP)                                                │
│    │   ├─ purpose (PROMOTION, ANNOUNCEMENT, REMINDER, etc)                                 │
│    │   ├─ targetAudience (with filters)                                                    │
│    │   ├─ Status: DRAFT → SCHEDULED → SENDING → SENT                                       │
│    │   └─ content, attachments                                                             │
│    │                                                                                        │
│    └─→ Content (1:M)                                                                       │
│        ├─ contentType, title, description                                                  │
│        ├─ HTML/text content                                                                │
│        ├─ Status: DRAFT → PUBLISHED                                                        │
│        └─ SEO metadata                                                                     │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       BLOOD BANK ECOSYSTEM                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  BloodRequest (Created by User/Hospital)                                                   │
│    │                                                                                        │
│    ├─ bloodGroup (indexed)                                                                 │
│    ├─ unitsRequired                                                                        │
│    ├─ urgencyLevel (LOW, MEDIUM, HIGH)                                                     │
│    ├─ Status: OPEN → IN_PROGRESS → FULFILLED → CANCELLED                                   │
│    │                                                                                        │
│    └─→ Auto-Match with BloodDonor                                                          │
│        ├─ Find eligible donors with matching blood group                                   │
│        ├─ Send Notifications to donors (broadcast)                                         │
│        └─ matchedDonorId → BloodDonor                                                      │
│                                                                                             │
│  BloodDonor (User Profile Extension)                                                       │
│    │                                                                                        │
│    ├─ userId (UNIQUE, reference to User)                                                   │
│    ├─ bloodGroup (indexed for fast matching)                                               │
│    ├─ lastDonationDate                                                                     │
│    ├─ isEligible (eligibility status)                                                      │
│    ├─ eligibilityReason (if not eligible)                                                  │
│    ├─ Tracks: Alcohol, Smoking status                                                      │
│    └─ available flag                                                                       │
│                                                                                             │
│  BloodDonation (Donation Event)                                                            │
│    │                                                                                        │
│    ├─ donorId → BloodDonor                                                                 │
│    ├─ donationDate, location                                                               │
│    ├─ bloodType, unitsCollected                                                            │
│    ├─ healthScreening results                                                              │
│    ├─ Status: COMPLETED, SCHEDULED                                                         │
│    └─ campaignId (if part of campaign)                                                     │
│                                                                                             │
│  Campaign ←→ BloodDonation (Donation Events)                                               │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                     ADMIN & COMPLIANCE ECOSYSTEM                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  Admin (Primary)                                                                           │
│    │                                                                                        │
│    ├─→ Role-based (SUPER_ADMIN, VERIFICATION_ADMIN, FINANCE_ADMIN, SUPPORT_ADMIN)         │
│    ├─→ Permissions[] (granular access control)                                             │
│    ├─→ createdBy (Self-reference: who created this admin)                                  │
│    └─→ lastLogin (tracking)                                                                │
│                                                                                             │
│  AuditLog (Immutable Record)                                                               │
│    │                                                                                        │
│    ├─ module (DOCTOR, FINANCE, SETTINGS, etc)                                              │
│    ├─ action (VERIFY, APPROVE_REFUND, UPDATE_FEE, etc)                                     │
│    ├─ performedBy → Admin                                                                  │
│    ├─ targetId, targetModel (what was changed)                                             │
│    ├─ beforeValue, afterValue (snapshots)                                                  │
│    ├─ ipAddress, deviceInfo (tracking)                                                     │
│    ├─ metadata (additional context)                                                        │
│    └─ createdAt (immutable, no updates)                                                    │
│                                                                                             │
│    All sensitive operations logged:                                                        │
│    • Doctor verification status changes                                                    │
│    • Payment/Refund approvals                                                              │
│    • Settlement processing                                                                 │
│    • Fee configuration changes                                                             │
│    • User account actions                                                                  │
│                                                                                             │
│  FeeConfig (Pricing Management)                                                            │
│    │                                                                                        │
│    ├─ feeType (PLATFORM_FEE, COMMISSION, etc)                                              │
│    ├─ amount, percentage                                                                   │
│    ├─ isActive                                                                             │
│    └─ applicabilityRules                                                                   │
│                                                                                             │
│  SystemSetting (Global Configuration)                                                      │
│    │                                                                                        │
│    ├─ key (UNIQUE)                                                                         │
│    ├─ value                                                                                │
│    ├─ dataType                                                                             │
│    └─ description                                                                          │
│                                                                                             │
│  PaymentGatewayConfig                                                                      │
│    │                                                                                        │
│    ├─ gatewayType (RAZORPAY, STRIPE, PAYPAL)                                               │
│    ├─ apiKey, apiSecret (encrypted)                                                        │
│    ├─ webhookUrl, webhookSecret                                                            │
│    ├─ isActive                                                                             │
│    └─ settings (gateway-specific)                                                          │
│                                                                                             │
│  Coupon (Promotional Code)                                                                 │
│    │                                                                                        │
│    ├─ code (UNIQUE, indexed)                                                               │
│    ├─ discountType (PERCENT, FIXED)                                                        │
│    ├─ discountValue                                                                        │
│    ├─ validFrom, expiryDate                                                                │
│    ├─ maxUsage, usageCount                                                                 │
│    ├─ applicableOnAmount                                                                   │
│    └─ Status: ACTIVE, INACTIVE, EXPIRED                                                    │
│                                                                                             │
│  RefreshToken (Session Management)                                                         │
│    │                                                                                        │
│    ├─ userId/doctorId/adminId                                                              │
│    ├─ token (UNIQUE, encrypted)                                                            │
│    ├─ expiresAt (TTL for auto-cleanup)                                                     │
│    └─ revokedAt (for logout)                                                               │
│                                                                                             │
│  Backup (Data Recovery)                                                                    │
│    │                                                                                        │
│    ├─ backupName                                                                           │
│    ├─ status (PENDING, RUNNING, COMPLETED, FAILED)                                         │
│    ├─ scheduleId                                                                           │
│    ├─ startTime, endTime                                                                   │
│    ├─ storageLocation                                                                      │
│    └─ restorableCollections[]                                                              │
│                                                                                             │
│  InsurancePartner (Partnership)                                                            │
│    │                                                                                        │
│    ├─ partnerName, contactPerson                                                           │
│    ├─ integrationStatus                                                                    │
│    ├─ appointmentCount                                                                     │
│    └─ commissionRate                                                                       │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════════════

TABLE CARDINALITY SUMMARY:

User (1) ─┬─→ (M) Appointment
          ├─→ (1) UserWallet
          ├─→ (M) UserActivity
          ├─→ (M) HealthReading
          ├─→ (M) HealthAnalysis
          ├─→ (M) HealthPrediction
          ├─→ (M) MedicineReminder
          ├─→ (0-1) BloodDonor
          ├─→ (M) Notification
          ├─→ (M) SupportTicket
          ├─→ (M) AppFeedback
          └─→ (M) BloodRequest

Doctor (1) ─┬─→ (M) Appointment
            ├─→ (1) DoctorAvailability
            ├─→ (1) DoctorBankDetails
            ├─→ (M) Rating
            ├─→ (M) Notification
            └─→ (M) Settlement

Appointment (1) ─┬─→ (0-1) Payment
                 ├─→ (0-1) Refund
                 ├─→ (M) AppointmentReminder
                 ├─→ (0-1) MedicalReport
                 ├─→ (0-1) Rating
                 └─→ (M) Notification

Payment (1) ─┬─→ (0-1) Refund
             ├─→ (1) RevenueLedger
             └─→ (0-1) Settlement

Admin (1) ─┬─→ (M) AuditLog
           ├─→ (M) SupportTicket (assigned)
           ├─→ (M) DoctorBankDetails (verified_by)
           └─→ (M) Doctor (verified_by)

═══════════════════════════════════════════════════════════════════════════════════════════════

INDEXES (150+ for Performance):

PRIMARY KEYS:          All _id fields
UNIQUE INDEXES:        email, phone, registrationNumber, ticketId, accountNumber, code
COMPOUND INDEXES:      (userId, doctorId), (userId, createdAt), (doctorId, appointmentDate)
GEOSPATIAL:           clinicAddress.coordinates (2dsphere)
TTL INDEXES:          UserActivity (1 year), AppointmentReminder (expiryDate)
DESCENDING:           createdAt, lastLogin, appointmentDate, ratings
SPARSE:                socialMediaHandle, alternateEmail, middleName

═══════════════════════════════════════════════════════════════════════════════════════════════

REAL-TIME EVENTS FLOWING BETWEEN TABLES:

Appointment.insert         → AppointmentReminder.create, Notification.create, UserActivity.create
Payment.update(CAPTURED)   → RevenueLedger.create, Doctor.update, Notification.create, Settlement.trigger
Refund.update(COMPLETED)   → UserWallet.update, Payment.update, Notification.create
Settlement.create          → Doctor.update(earnings), Payment.updateMany(settled), Notification.create
HealthReading.insert       → HealthAnalysis.queue, Notification.create (if abnormal), UserActivity.create
Rating.insert              → Doctor.ratings.update (average), Notification.create (doctor response)
SupportTicket.messages     → Notification.create, SupportTicket.update(status)
BloodRequest.insert        → BloodDonor.find(match), Notification.create(broadcast), Coupon.apply
UserActivity.*             → EventQueue.push, AuditLog.create (if admin)
DoctorAvailability.update  → Notification.create (to users), event broadcast

═══════════════════════════════════════════════════════════════════════════════════════════════

SECURITY & CASCADING:

ON DELETE:
  • User deleted → UserWallet (CASCADE), UserActivity (CASCADE), Appointments (SET_NULL), Notifications (CASCADE)
  • Doctor deleted → DoctorAvailability (CASCADE), DoctorBankDetails (CASCADE), Ratings (CASCADE), Settlements (SET_NULL)
  • Appointment deleted → Reminders (CASCADE), Ratings (CASCADE), Payment (CASCADE), MedicalReports (CASCADE)
  • Payment deleted → Refunds (CASCADE), RevenueLedger (CASCADE), Settlements (SET_NULL)

TRANSACTIONS:
  • Appointment + Payment (atomic: both succeed or both fail)
  • Settlement + Payment updates (atomic: all updates together)
  • Refund + Wallet credit (atomic: fund user or reverse refund)

═══════════════════════════════════════════════════════════════════════════════════════════════

END OF DATABASE RELATIONSHIP MAP
```

---

## Key Insights

1. **User-Centric Design**: All extensions flow from User (8 related tables)
2. **Doctor-Centric Earnings**: Doctor earnings calculated from Payment → RevenueLedger → Settlement
3. **Real-Time Cascade**: Database changes trigger automatic updates across related tables
4. **Financial Integrity**: Payment → Refund → Wallet → Settlement forms immutable audit trail
5. **Health Intelligence**: Health readings automatically trigger analysis & predictions
6. **Support Network**: Multiple support channels (tickets, feedback, campaigns, notifications)
7. **Compliance Ready**: Full audit trail, encryption, access control, data validation

---

**Generated:** June 14, 2026  
**Diagram Version:** 1.0  
**Last Updated:** Complete
