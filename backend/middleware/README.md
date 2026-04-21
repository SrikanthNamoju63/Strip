# Middleware

Cross-cutting concerns and request processing middleware.

## Structure

```
middleware/
├── adminAuth.js                # Admin authentication
├── authMiddleware.js           # Basic JWT authentication
├── enhancedAuthMiddleware.js   # Enhanced auth with token blacklist & roles
├── checkRole.js                # Role-based permission checking
├── corsConfig.js               # CORS configuration & whitelist
├── errorHandler.js             # Global error handling
├── inputValidation.js          # Input validation & sanitization
├── rateLimiting.js             # Rate limiting by endpoint
├── rbac.js                     # Role-based access control
├── securityHeaders.js          # Security headers (Helmet)
└── README.md                   # This file
```

## Key Middleware

### Authentication

#### `authMiddleware.js` - Basic Auth
Protected routes require valid JWT token in `Authorization` header.

```javascript
const auth = require('../middleware/authMiddleware');
router.get('/profile', auth, getProfile);
```

#### `enhancedAuthMiddleware.js` - Enhanced Auth
Adds token blacklist checking and role-based access control.

```javascript
const { authMiddleware, requireAdmin, requireDoctor } = require('../middleware/enhancedAuthMiddleware');

// Requires valid token
router.get('/users', authMiddleware, getUsers);

// Requires admin role
router.delete('/users/:id', authMiddleware, requireAdmin, deleteUser);

// Requires doctor role
router.post('/appointments', authMiddleware, requireDoctor, bookAppointment);
```

### Security

#### `corsConfig.js` - CORS Settings
Whitelist allowed origins for cross-origin requests.
- Development: `localhost:3000`, `localhost:5173`, `localhost:5174`
- Production: Only your domain names

#### `securityHeaders.js` - Security Headers
Sets security headers using Helmet:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

#### `inputValidation.js` - Input Validation
Sanitizes inputs against:
- XSS attacks (via XSS library)
- SQL injection (via mongo-sanitize)
- NoSQL injection

### Performance & Protection

#### `rateLimiting.js`
Rate limits by endpoint type:
- **Auth endpoints**: 5 attempts per 15 minutes
- **General API**: 100 requests per minute
- **Payment endpoints**: 1 per 30 seconds

```javascript
app.use('/api/auth/login', authLimiter);
app.use('/api/payments', paymentLimiter);
```

### Error Handling

#### `errorHandler.js` - Global Error Handler
Catches unhandled errors and returns standardized responses.

```javascript
app.use((err, req, res, next) => {
    // Error handling logic
    res.status(err.status || 500).json({ error: err.message });
});
```

## Application Order

Middleware is applied in this order (in `server.js`):

```
1. Request Size Limiting (DoS protection)
2. Body Parsing
3. Compression
4. Security Headers
5. CORS
6. Input Sanitization
7. Rate Limiting
8. Request Logging
9. Route Handlers
10. 404 Handler
11. Error Handler
```

## Middleware Stack Example

```javascript
// Protect sensitive endpoints
app.use('/api/admin', routerAuth, requireAdmin);
app.use('/api/payments', routeAuth, paymentLimiter);

// Public routes
app.use('/api/health', healthRoutes);

// Protected routes with auth
app.use('/api/users', authMiddleware);
```

## Creating Custom Middleware

```javascript
// middleware/customMiddleware.js
const customMiddleware = (req, res, next) => {
    // Do something with request
    if (someCondition) {
        next(); // Continue to next middleware
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
};

module.exports = customMiddleware;
```

## Best Practices

1. **Order Matters** - Security middleware should run first
2. **Keep it Simple** - Each middleware should have one responsibility
3. **Error Handling** - Always handle errors gracefully
4. **Logging** - Log important security events
5. **Testing** - Test middleware with edge cases
6. **Documentation** - Document what each middleware does

## Configuration

Most middleware is configurable via environment variables:

```env
# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
AUTH_RATE_LIMIT=5
API_RATE_LIMIT=100

# JWT
JWT_SECRET=your_secret_here
```

## Troubleshooting

### CORS Errors
- Check `CORS_ORIGINS` environment variable
- Ensure origin is in whitelist
- Verify request headers

### Rate Limited (429)
- Check rate limit settings
- Wait before retrying
- Use exponential backoff

### Authentication Failed (401)
- Verify token is in `Authorization` header
- Check token hasn't expired
- Ensure secret key matches
