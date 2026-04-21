# Controllers

Business logic handlers organized by domain.

## Structure

```
controllers/
├── admin/              # Admin management
├── appointments/       # Appointment CRUD & management
├── auth/              # Authentication & sessions
│   ├── index.js       # Auth controller
│   └── sessionController.js
├── blood/             # Blood donation management
├── feedback/          # App feedback collection
├── finance/           # Payments, refunds, fees, settlements
│   ├── feeConfigController.js
│   ├── index.js       # Finance controller
│   ├── paymentController.js
│   └── settlementController.js
├── health/            # Health data tracking & analysis
├── misc/              # Audit, settings
├── support/           # Support ticket management
└── user/              # Users, doctors, ratings
    ├── doctorController.js
    ├── index.js       # User controller
    └── ratingController.js
```

## Naming Convention

- Use `index.js` as the main controller export for each domain
- Use descriptive file names for auxiliary controllers: `doctorController.js`, `ratingController.js`

## Pattern

Each controller should:
1. Handle a specific HTTP request
2. Validate input (with middleware)
3. Call appropriate service layer functions
4. Return standardized response
5. Handle errors gracefully

### Example

```javascript
exports.bookAppointment = async (req, res) => {
    try {
        // Input validation already done by middleware
        const { doctorId, appointmentDate, appointmentTime } = req.body;
        const userId = req.user.id;

        // Call service layer
        const appointment = await appointmentService.bookAppointment({
            userId, doctorId, appointmentDate, appointmentTime
        });

        // Success response
        res.json({ success: true, data: appointment });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
```

## Key Rules

1. **Thin Controllers** - Keep logic minimal, delegate to services
2. **Consistent Responses** - Always return structured JSON
3. **Error Handling** - Catch errors and return appropriate status codes
4. **Validation** - Trust that middleware has validated inputs
5. **Logging** - Log important actions for audit trails

## Imports

Routes import controllers like:
```javascript
const authController = require('../controllers/auth');
const { bookAppointment } = require('../controllers/appointments');
const paymentController = require('../controllers/finance/paymentController');
```
