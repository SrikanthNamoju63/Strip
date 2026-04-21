# Routes

API route definitions and endpoint structure.

## Structure

```
routes/
├── adminRoutes.js            # Admin management endpoints
├── authRoutes.js             # Authentication endpoints
├── appointmentRoutes.js      # Appointment CRUD endpoints
├── userRoutes.js             # User profile endpoints
├── doctorRoutes.js           # Doctor profile endpoints
├── healthRoutes.js           # Health data endpoints
├── paymentRoutes.js          # Payment endpoints
├── ratingRoutes.js           # Rating endpoints
├── settlementRoutes.js       # Settlement endpoints
├── bloodRoutes.js            # Blood bank endpoints
├── appFeedbackRoutes.js      # App feedback endpoints
├── supportRoutes.js          # Support ticket endpoints
├── feeConfigRoutes.js        # Fee configuration endpoints
├── auditRoutes.js            # Audit log endpoints
├── sessionRoutes.js          # Session management endpoints
└── README.md                 # This file
```

## API Endpoints by Domain

### Authentication (`authRoutes.js`)

```
POST   /api/auth/register          # Register new user
POST   /api/auth/login            # Login user
POST   /api/auth/refresh          # Refresh JWT token
POST   /api/auth/logout           # Logout user
POST   /api/auth/verify-email     # Verify email
POST   /api/auth/forgot-password  # Reset password request
```

**Middleware:** Rate limited, input validation
**Response:** JWT token, user data

### Users (`userRoutes.js`)

```
GET    /api/users/profile         # Get user profile
PUT    /api/users/profile         # Update profile
GET    /api/users/:id             # Get user details
PUT    /api/users/:id             # Update user
DELETE /api/users/:id             # Delete user (admin)
GET    /api/users                 # List users (admin)
POST   /api/users/upload-avatar   # Upload avatar
```

**Middleware:** Auth required
**Response:** User object

### Doctors (`doctorRoutes.js`)

```
GET    /api/doctors                # List doctors
GET    /api/doctors/:id            # Get doctor details
POST   /api/doctors                # Register doctor
PUT    /api/doctors/:id            # Update profile
DELETE /api/doctors/:id            # Delete doctor (admin)
GET    /api/doctors/:id/availability  # Get availability
GET    /api/doctors/:id/appointments  # Get doctor's appointments
POST   /api/doctors/:id/upload-documents  # Upload KYC docs
GET    /api/doctors/:id/kyc-status      # Check KYC status
```

**Middleware:** Auth required (some public)
**Response:** Doctor object, KYC status

### Appointments (`appointmentRoutes.js`)

```
POST   /api/appointments              # Book appointment (with transaction lock)
GET    /api/appointments              # Get user's appointments
GET    /api/appointments/:id          # Get appointment details
PUT    /api/appointments/:id          # Update appointment
DELETE /api/appointments/:id          # Cancel appointment
GET    /api/appointments/slots/:doctorId  # Get available slots
POST   /api/appointments/:id/reschedule   # Reschedule appointment
```

**Middleware:** Auth required, transaction lock on booking
**Response:** Appointment object, slot availability

### Health (`healthRoutes.js`)

```
GET    /api/health/readings              # Get health readings
POST   /api/health/readings              # Create reading
GET    /api/health/readings/:id          # Get reading
DELETE /api/health/readings/:id          # Delete reading
GET    /api/health/analysis              # Get health analysis
POST   /api/health/analysis/generate     # Generate analysis
GET    /api/health/predictions           # Get predictions
POST   /api/health/predictions/analyze   # Analyze health
```

**Middleware:** Auth required, rate limited
**Response:** Health data, analysis results

### Payments (`paymentRoutes.js`)

```
POST   /api/payments/create-checkout        # Create payment session
POST   /api/payments/verify                 # Verify payment (idempotent)
GET    /api/payments/history                # Payment history
GET    /api/payments/:id                    # Get payment details
POST   /api/payments/:id/refund             # Refund payment (idempotent)
GET    /api/payments/stats                  # Payment statistics (admin)
```

**Middleware:** Auth required, rate limited, idempotency checks
**Response:** Payment status, receipt data

### Settlements (`settlementRoutes.js`)

```
GET    /api/settlements                # List settlements (doctor/admin)
GET    /api/settlements/:id            # Settlement details
POST   /api/settlements                # Create settlement (admin)
PUT    /api/settlements/:id            # Update settlement
GET    /api/settlements/doctor/:id     # Doctor's settlements
POST   /api/settlements/:id/process    # Process settlement
```

**Middleware:** Auth required, role-based
**Response:** Settlement object, status

### Ratings (`ratingRoutes.js`)

```
GET    /api/ratings/doctor/:id            # Get doctor ratings
POST   /api/ratings                       # Create rating
GET    /api/ratings/:id                   # Get rating
PUT    /api/ratings/:id                   # Update rating
DELETE /api/ratings/:id                   # Delete rating
GET    /api/ratings/user/:userId          # User's ratings
```

**Middleware:** Auth required
**Response:** Rating object, average rating

### Blood Bank (`bloodRoutes.js`)

```
GET    /api/blood/donors                # List donors
POST   /api/blood/donors                # Register donor
GET    /api/blood/donors/:id            # Donor details
PUT    /api/blood/donors/:id            # Update donor
DELETE /api/blood/donors/:id            # Delete donor

GET    /api/blood/donations             # Donation list
POST   /api/blood/donations             # Create donation
GET    /api/blood/donations/:id         # Donation details

GET    /api/blood/requests              # Request list
POST   /api/blood/requests              # Create request
PUT    /api/blood/requests/:id          # Update request

GET    /api/blood/availability          # Blood availability
```

**Middleware:** Auth required (some public)
**Response:** Blood donor/donation/request objects

### Support (`supportRoutes.js`)

```
GET    /api/support/tickets                # List tickets (admin) / user's (user)
POST   /api/support/tickets                # Create ticket
GET    /api/support/tickets/:id            # Get ticket
PUT    /api/support/tickets/:id            # Update ticket
DELETE /api/support/tickets/:id            # Delete ticket
POST   /api/support/tickets/:id/respond    # Add response
```

**Middleware:** Auth required
**Response:** Support ticket object

### Admin (`adminRoutes.js`)

```
GET    /api/admin/users                    # List all users
GET    /api/admin/stats                    # Statistics
POST   /api/admin/settings                 # Update settings
GET    /api/admin/audit-logs               # View audit logs
POST   /api/admin/verify-doctor            # Verify doctor KYC
DELETE /api/admin/users/:id                # Delete user
```

**Middleware:** Admin auth required
**Response:** Admin dashboard data

### Sessions (`sessionRoutes.js`)

```
GET    /api/sessions                       # List active sessions
POST   /api/sessions/:id/revoke            # Revoke session
DELETE /api/sessions/:id                   # Delete session
POST   /api/sessions/logout-all            # Logout all sessions
```

**Middleware:** Auth required
**Response:** Session list

## Route Structure Pattern

```javascript
// routes/exampleRoutes.js
const express = require('express');
const { authMiddleware, requireAdmin } = require('../middleware/enhancedAuthMiddleware');
const { getExample, createExample, updateExample } = require('../controllers/example');

const router = express.Router();

// Public endpoint
router.get('/', getExample);

// Protected endpoints
router.post('/', authMiddleware, createExample);
router.put('/:id', authMiddleware, updateExample);

// Admin-only endpoint
router.delete('/:id', authMiddleware, requireAdmin, deleteExample);

module.exports = router;
```

## Server.js Route Registration

```javascript
// server.js
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/settlements', require('./routes/settlementRoutes'));
app.use('/api/blood', require('./routes/bloodRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
```

## Response Format

All endpoints follow standardized response format:

**Success (200**):
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

**Error (4xx/5xx)**:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input |
| CONFLICT | 409 | Resource conflict |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal error |

## Best Practices

1. **Naming** - Use resource nouns, not verbs
   - ✅ POST `/appointments` not `/createAppointment`
   - ✅ DELETE `/appointments/:id` not `/removeAppointment`

2. **Nesting** - Keep nesting shallow (max 2 levels)
   - ✅ `/api/doctors/:id/appointments`
   - ❌ `/api/doctors/:id/appointments/:apptId/feedback/:feedbackId`

3. **Versioning** - Use version in URL if needed
   - `/api/v1/users` for API v1
   - `/api/v2/users` for API v2

4. **Pagination** - Use query parameters
   - `/api/users?page=1&limit=20`
   - `/api/appointments?start=2024-01-01&end=2024-12-31`

5. **Filtering** - Use query parameters
   - `/api/appointments?status=completed`
   - `/api/doctors?specialization=cardiology`

## Testing Routes

```bash
# Health check
curl http://localhost:3000/api/health/status

# Authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get appointments (with auth)
curl http://localhost:3000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Issues

### 404 Not Found
- Verify route is registered in server.js
- Check route path spelling
- Ensure middleware order is correct

### 401 Unauthorized
- Token missing or invalid
- Token expired - refresh needed
- Secret key mismatch

### 403 Forbidden
- User lacks required role/permission
- Check RBAC middleware
- Verify user role in database

### 429 Too Many Requests
- Rate limit exceeded
- Wait before retrying
- Use exponential backoff
