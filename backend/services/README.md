# Services

Business logic services organized by domain. Services handle complex operations and business rules.

## Structure

```
services/
├── auth/              # Authentication & token services
├── doctor/           # Doctor-related services (KYC verification)
├── misc/             # Miscellaneous (audit, cache)
├── notification/     # Email & notifications
│   └── index.js      # Main notification service
├── payment/          # Payment gateway integrations
│   ├── razorpayService.js
│   └── stripeService.js
└── settlement/       # Settlement processing
    └── index.js      # Main settlement service
```

## Responsibilities

### auth/
- JWT token generation & validation
- Refresh token handling
- Token blacklist management

### payment/
- Stripe integration
- Razorpay integration  
- Payment processing
- Refund handling

### notification/
- Email sending
- In-app notifications
- Push notifications (future)

### settlement/
- Settlement calculation
- Payout processing
- Commission calculation

### doctor/
- KYC verification
- Document validation
- Doctor profile updates

### misc/
- Audit logging
- Caching operations
- General utilities

## Pattern

Services should:
1. Have a single responsibility
2. Handle business logic independently
3. Be reusable across multiple controllers
4. Have proper error handling
5. Log important operations

### Example

```javascript
// services/payment/stripeService.js
class StripeService {
    async createPaymentIntent(amount, currency, metadata) {
        try {
            const intent = await stripe.paymentIntents.create({
                amount: amount * 100, // Convert to cents
                currency,
                metadata
            });
            return { success: true, clientSecret: intent.client_secret };
        } catch (error) {
            console.error('Stripe error:', error);
            throw new Error('Payment creation failed');
        }
    }

    async processRefund(paymentIntentId, amount) {
        // Process refund logic
    }
}

module.exports = new StripeService();
```

## Key Rules

1. **Single Responsibility** - Each service handles one domain
2. **Independence** - Services don't depend on controllers
3. **Error Handling** - Throw descriptive errors
4. **Logging** - Log all important operations
5. **Configuration** - Use environment variables for secrets
6. **Testing** - Services should be easily testable

## Usage in Controllers

```javascript
// controller.js
const paymentService = require('../services/payment/stripeService');

exports.initiatePayment = async (req, res) => {
    try {
        const result = await paymentService.createPaymentIntent(
            req.body.amount,
            'INR',
            { appointmentId: req.body.appointmentId }
        );
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```

## Conventions

- Services are instantiated as singletons
- Export service instances, not classes (for consistency)
- Group related services in domain folders
- Use consistent naming: `ServiceName.js` for classes
