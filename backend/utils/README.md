# Utils

Utility functions and helpers for common operations.

## Structure

```
utils/
├── logger.js                 # Logging utility
├── errorMessages.js          # Standardized error messages
├── validators.js             # Custom validation functions
├── helpers.js                # General helper functions
├── constants.js              # Application constants
├── tokenUtils.js             # JWT token utilities
├── dateUtils.js              # Date/time utilities
├── formatters.js             # Data formatting utilities
└── README.md                 # This file
```

## Core Utilities

### Logger (`logger.js`)

Centralized logging with Winston:

```javascript
const logger = require('./utils/logger');

// Different log levels
logger.error('Database connection failed', { error: err });
logger.warn('Slow query detected', { query, duration: 2500 });
logger.info('User logged in', { userId: user.id });
logger.debug('Processing appointment', { appointmentId: 123 });
```

**Features:**
- Structured logging with metadata
- Multiple transports (console, file)
- Configurable log levels
- Error stack traces

### Validators (`validators.js`)

Custom validation functions:

```javascript
const { 
  isValidEmail, 
  isValidPhone, 
  isValidDate,
  isValidBloodGroup,
  isValidSpecialization
} = require('./utils/validators');

// Usage
if (!isValidEmail(email)) {
  throw new Error('Invalid email format');
}
```

### Error Messages (`errorMessages.js`)

Standardized error definitions:

```javascript
const errors = require('./utils/errorMessages');

// Usage
res.status(401).json({
  success: false,
  error: errors.UNAUTHORIZED,
  code: 'UNAUTHORIZED'
});
```

**Available Errors:**
- `UNAUTHORIZED` - Missing/invalid auth
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `DUPLICATE_ENTRY` - Resource already exists
- `SERVER_ERROR` - Internal server error

### Helpers (`helpers.js`)

General utility functions:

```javascript
const {
  generateOTP,
  sendEmail,
  formatPhoneNumber,
  sanitizeInput,
  calculateAge,
  getWeekdayName
} = require('./utils/helpers');

// Usage
const otp = generateOTP(6);          // Generate 6-digit OTP
const clean = sanitizeInput(input);  // Remove xss/sql injection
const age = calculateAge(birthDate); // Calculate age from date
```

### Token Utils (`tokenUtils.js`)

JWT token operations:

```javascript
const {
  generateTokens,
  verifyToken,
  decodeToken,
  blacklistToken,
  isTokenBlacklisted
} = require('./utils/tokenUtils');

// Generate tokens
const { accessToken, refreshToken } = generateTokens(userId);

// Verify token
const decoded = verifyToken(token, 'access');

// Blacklist token on logout
await blacklistToken(token);
```

### Date Utils (`dateUtils.js`)

Date and time utilities:

```javascript
const {
  getCurrentDate,
  addDays,
  getDateRange,
  formatDate,
  isDateInRange,
  getNextWeekday
} = require('./utils/dateUtils');

// Usage
const tomorrow = addDays(new Date(), 1);
const { start, end } = getDateRange('2024-01-15');
const isInRange = isDateInRange(date, startDate, endDate);
```

### Formatters (`formatters.js`)

Data formatting utilities:

```javascript
const {
  formatCurrency,
  formatPhoneNumber,
  formatAddress,
  formatDate,
  maskSensitiveData
} = require('./utils/formatters');

// Usage
const formatted = formatCurrency(1500, 'INR');  // ₹1,500.00
const phone = formatPhoneNumber('9876543210');  // 98765 43210
```

### Constants (`constants.js`)

Application-wide constants:

```javascript
const constants = require('./utils/constants');

// Usage
const { ROLES, STATUSES, BLOOD_GROUPS } = constants;

router.post('/appointments', (req, res) => {
  if (req.user.role === constants.ROLES.ADMIN) {
    // Admin logic
  }
});
```

**Common Constants:**
```javascript
ROLES = {
  USER: 'user',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
```

## Common Patterns

### Error Handling

```javascript
const { handleError } = require('./utils/errorHandler');

try {
  // Operation
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
} catch (error) {
  handleError(error, res);
}
```

### Async Wrapper

```javascript
const { asyncHandler } = require('./utils/asyncHandler');

const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.json({ success: true, data: user });
});
```

### Validation

```javascript
const { validateInput } = require('./utils/validators');

const schema = {
  email: { type: 'email', required: true },
  phone: { type: 'phone', required: true },
  age: { type: 'number', min: 18 }
};

validateInput(req.body, schema);
```

## Best Practices

1. **Single Responsibility** - Each utility has one job
2. **Reusability** - Common operations in utils
3. **Error Handling** - Proper error messages
4. **Documentation** - Clear JSDoc comments
5. **Testing** - Unit tests for utilities

## Adding New Utilities

### 1. Create the Utility File

```javascript
// utils/emailUtils.js
/**
 * Send email to user
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} template - Email template name
 * @param {object} data - Template data
 * @returns {Promise<boolean>}
 */
async function sendEmail(to, subject, template, data) {
  // Implementation
}

module.exports = { sendEmail };
```

### 2. Export from Utils Index

```javascript
// utils/index.js (if using barrel export)
module.exports = {
  logger: require('./logger'),
  emailUtils: require('./emailUtils'),
  validators: require('./validators'),
  // ... others
};
```

### 3. Use in Controllers/Services

```javascript
const { sendEmail } = require('../utils/emailUtils');

async function notifyUser(user, data) {
  await sendEmail(user.email, 'Appointment Booked', 'appointment', data);
}
```

## Common Utility Recipes

### Async Error Wrapper

```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
```

### Response Formatter

```javascript
const sendResponse = (res, statusCode, success, data, message) => {
  res.status(statusCode).json({
    success,
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

module.exports = { sendResponse };
```

### Rate Limit Generator

```javascript
const getRateLimitKey = (identifier, endpoint) => {
  return `${identifier}:${endpoint}:${Date.now()}`;
};

module.exports = { getRateLimitKey };
```

### Pagination Helper

```javascript
const getPaginationParams = (req, maxLimit = 50) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  
  if (limit > maxLimit) limit = maxLimit;
  if (page < 1) page = 1;
  
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

module.exports = { getPaginationParams };
```

## Testing Utilities

### Unit Test Example

```javascript
// tests/utils.test.js
const { isValidEmail } = require('../utils/validators');

describe('Validators', () => {
  it('should validate correct email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });
  
  it('should reject invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false);
  });
});
```

## Performance Considerations

1. **Caching** - Cache utility results when appropriate
2. **Avoid Loops** - Use array methods instead
3. **Memory** - Clean up large data structures
4. **Error Handling** - Don't swallow errors silently

## Troubleshooting

### Import Error: Cannot find module
```
Error: Cannot find module '../utils/helpers'

Fix:
1. Check file exists in utils/
2. Check spelling of filename
3. Check export syntax in file
```

### Utility Not Working as Expected
```
1. Check JSDoc comments for usage
2. Add console.log() to trace execution
3. Add unit test to verify behavior
4. Check error messages for clues
```

## Documentation Links

- [Winston Logger Docs](https://github.com/winstonjs/winston)
- [Date-fns Library](https://date-fns.org/)
- [Lodash Utilities](https://lodash.com/)
- [Express Validators](https://express-validator.github.io/docs/)
