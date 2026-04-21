# Healthcare Platform Backend

A comprehensive Node.js/Express backend for a healthcare application with appointment management, payment processing, doctor verification, and more.

---

## 📁 Folder Structure

```
backend/
├── config/                 # Configuration files (database, multer, etc.)
├── constants/              # Shared constants across the application
├── controllers/            # Business logic organized by domain
│   ├── admin/             # Admin management
│   ├── appointments/      # Appointment booking & management
│   ├── auth/              # Authentication & sessions
│   ├── blood/             # Blood donation management
│   ├── feedback/          # App feedback
│   ├── finance/           # Payments, settlements, fees
│   ├── health/            # Health readings & analysis
│   ├── misc/              # Audit, settings
│   ├── support/           # Support tickets
│   └── user/              # Users, doctors, ratings
├── decorators/            # Custom decorators & utilities
├── helpers/               # Helper functions & utilities
├── logs/                  # Application logs
├── middleware/            # Express middleware (auth, validation, security, etc.)
├── models/                # MongoDB schemas (User, Doctor, Appointment, etc.)
├── routes/                # API route definitions
├── scripts/               # Utility & testing scripts
│   ├── check_*.js         # Data verification scripts
│   ├── seed*.js           # Database seeding scripts
│   ├── test_*.js          # Testing scripts
│   └── verify_*.js        # Verification scripts
├── services/              # Business services organized by domain
│   ├── auth/              # Authentication services
│   ├── doctor/            # Doctor-related services (KYC, etc.)
│   ├── misc/              # Miscellaneous services (audit, cache)
│   ├── notification/      # Email & notifications
│   ├── payment/           # Payment gateway integrations
│   └── settlement/        # Settlement processing
├── types/                 # JSDoc type definitions & interfaces
├── uploads/               # File upload storage
├── utils/                 # Utility functions (socket, cron, emailService)
├── validation/            # Request validation schemas
├── .env                   # Environment variables
├── .env.example           # Environment variables template
├── .env.production        # Production environment variables
├── Dockerfile             # Docker configuration
├── package.json           # Dependencies & scripts
└── server.js              # Main application entry point
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.x
- MongoDB
- Redis (optional, for token blacklist)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Seed database
node scripts/seedAdmin.js

# Start server
npm start
```

### Development

```bash
npm run dev  # Start with nodemon
```

---

## 📋 Folder Descriptions

### **config/**
- `db.js` - MongoDB connection with validation
- `multer.js` - File upload configuration

### **controllers/**
Domain-organized business logic handlers:
- **admin/** - Admin dashboard & management
- **auth/** - User login, registration, sessions
- **appointments/** - Appointment CRUD & management
- **finance/** - Payments, refunds, settlements, fee configuration
- **health/** - Health data tracking & analysis
- **user/** - User profiles, doctor profiles, ratings
- **blood/** - Blood donation system
- **support/** - Support ticket management
- **feedback/** - App feedback collection
- **misc/** - Audit logs, settings

### **middleware/**
- `authMiddleware.js` - Basic authentication
- `enhancedAuthMiddleware.js` - Enhanced auth with token blacklist & role checking
- `corsConfig.js` - CORS configuration with domain whitelist
- `rateLimiting.js` - Request rate limiting
- `errorHandler.js` - Global error handling
- `inputValidation.js` - Input validation & sanitization
- `securityHeaders.js` - Security headers (Helmet-based)
- `rbac.js` - Role-based access control

### **models/**
MongoDB schemas for all entities:
- User, Doctor, Admin, Appointment, Payment, Settlement
- Health data (HealthReading, HealthAnalysis, HealthPrediction)
- Ratings, Notifications, Audit logs, etc.

### **routes/**
API endpoint definitions organized by resource:
- `adminRoutes.js`, `authRoutes.js`, `appointmentRoutes.js`
- `paymentRoutes.js`, `doctorRoutes.js`, `userRoutes.js`
- `healthRoutes.js`, `bloodRoutes.js`, `settlementRoutes.js`
- etc.

### **services/**
Business logic services:
- **auth/** - Authentication & token services
- **payment/** - Stripe & Razorpay integrations
- **notification/** - Email & notification services
- **settlement/** - Settlement processing
- **doctor/** - Doctor KYC verification
- **misc/** - Cache, audit logging

### **scripts/**
Utility & test scripts:
- `seedAdmin.js` - Create initial admin user
- `resetAdmin.js` - Reset admin credentials
- `check_*.js` - Data verification & checking
- `test_*.js` - Testing endpoints & database
- `verify_*.js` - Verification utilities

### **utils/**
- `socket.js` - WebSocket (Socket.io) management
- `cron.js` - Scheduled cron jobs
- `emailService.js` - Email sending utilities

### **constants/**
Shared constants used across the application (error codes, status values, etc.)

### **validation/**
Request validation schemas and validators

### **types/**
JSDoc type definitions and interfaces documentation

### **middleware/**
- Security headers
- CORS configuration
- Input validation
- Rate limiting
- Authentication & authorization

---

## 🔐 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Token blacklist on logout
- ✅ Rate limiting on auth & payment endpoints
- ✅ Input validation & sanitization
- ✅ CORS whitelist (no wildcards)
- ✅ Helmet security headers
- ✅ Role-based access control (RBAC)
- ✅ MongoDB injection prevention
- ✅ XSS protection

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/session/logout` - Logout (blacklist token)
- `POST /api/session/refresh` - Refresh access token

### Appointments
- `GET /api/appointments/my` - Get user's appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/doctor/:id` - Get doctor's appointments
- `POST /api/appointments/:id/cancel` - Cancel appointment
- `POST /api/appointments/:id/reschedule` - Reschedule appointment

### Payments
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/webhook` - Payment gateway webhook
- `POST /api/payments/:id/refund` - Process refund

### Doctors
- `GET /api/doctors` - List doctors
- `POST /api/doctors` - Register doctor
- `GET /api/doctors/me` - Get doctor profile
- `PUT /api/doctors/me` - Update doctor profile
- `POST /api/doctors/:id/verify` - Verify doctor (admin only)

### Health
- `POST /api/health/data` - Save health reading
- `POST /api/health/analyze` - Analyze health data

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `POST /api/admin/login` - Admin login
- `GET /api/admin/doctors` - List all doctors (with status)

---

## 🔧 Environment Variables

See `.env.example` for all available variables:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `REDIS_HOST` / `REDIS_PORT` - Redis configuration
- `STRIPE_SECRET_KEY` - Stripe API key
- `RAZORPAY_KEY_ID` - Razorpay API key
- `CORS_ORIGINS` - Allowed front-end origins

---

## 📊 Database

Connected using MongoDB with Mongoose ORM. All models are documented in `models/` folder with proper indexes and validation.

**Key Collections:**
- users
- doctors
- appointments
- payments
- settlements
- health_readings
- audit_logs
- notifications

---

## 🧪 Testing

Run utility scripts from the `scripts/` folder:

```bash
# Check admin login
node scripts/check_admin_login.js

# Verify doctor data
node scripts/verify_doctors.js

# Test database connection
node scripts/test_db.js

# Check all endpoints
node scripts/test_endpoints.js
```

---

## 📦 Dependencies

Major packages used:
- **express** - Web framework
- **mongoose** - MongoDB ORM
- **jsonwebtoken** - JWT authentication
- **bcrypt** - Password hashing
- **socket.io** - Real-time communication
- **stripe** - Payment processing
- **redis** - Token blacklist & caching
- **nodemailer** - Email sending
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-validator** - Input validation

---

## 🚨 Error Handling

Global error handler in `middleware/errorHandler.js` catches all errors and returns standardized responses.

**Error Response Format:**
```json
{
  "error": "Error message",
  "status": 400,
  "details": []
}
```

---

## 🔄 Development Workflow

1. **Feature Branch:** Create `feature/feature-name`
2. **Organize:** Use appropriate folders (controllers, services, routes)
3. **Validate:** Add input validation in `validation/`
4. **Test:** Run scripts to test functionality
5. **Commit:** Follow conventional commits
6. **PR:** Merge to main after review

---

## 📝 Best Practices

1. Keep controllers thin - move logic to services
2. Use middleware for cross-cutting concerns
3. Always validate & sanitize inputs
4. Handle errors gracefully
5. Use constants for magic strings
6. Document complex logic with comments
7. Group related files by domain
8. Keep database transactions atomic
9. Log important operations
10. Test with edge cases

---

## 🆘 Troubleshooting

### MongoDB Connection Failed
- Check `MONGO_URI` in `.env`
- Ensure MongoDB is running
- Verify network access

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:5000 | xargs kill -9`

### Token Expired
- Implement token refresh flow
- See `middleware/enhancedAuthMiddleware.js`

### CORS Issues
- Check `CORS_ORIGINS` in `.env`
- Ensure front-end origin is whitelisted

---

## 📞 Support

For issues, refer to:
1. Error logs in `logs/error.log`
2. Console output during development
3. API response error messages
4. Database audit logs

---

## 📄 License

Proprietary - Healthcare Platform

---

**Last Updated:** February 2026
