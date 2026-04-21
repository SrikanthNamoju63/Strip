# Scripts

Utility, testing, and maintenance scripts organized by purpose.

## Structure

```
scripts/
├── check_*.js         # Data verification & validation scripts
├── seed*.js           # Database initialization & seeding
├── test_*.js          # Testing & endpoint checks
├── verify_*.js        # Verification utilities
├── createIndexes.js   # Database index creation
└── README.md          # This file
```

## Scripts Overview

### Seeding & Setup

#### `seedAdmin.js`
Creates initial admin user for the system.
```bash
node scripts/seedAdmin.js
# Requires: ADMIN_PASSWORD environment variable
```

#### `resetAdmin.js`
Resets admin credentials.
```bash
node scripts/resetAdmin.js
```

#### `createIndexes.js`
Creates necessary MongoDB indexes for performance.
```bash
node scripts/createIndexes.js
```

### Verification & Checking

#### `check_admin_login.js`
Verifies admin can login successfully.
```bash
node scripts/check_admin_login.js
```

#### `verify_doctors.js`
Verifies doctor records and their data integrity.
```bash
node scripts/verify_doctors.js
```

#### `check_doctor_data.js`
Checks doctor data consistency.
```bash
node scripts/check_doctor_data.js
```

#### `check_doctors.js`
General doctor data checking script.
```bash
node scripts/check_doctors.js
```

#### `check_doctors_script.js`
Additional doctor checking utilities.
```bash
node scripts/check_doctors_script.js
```

#### `verify_finance.js`
Verifies financial data and settlements.
```bash
node scripts/verify_finance.js
```

### Testing

#### `test_db.js`
Tests database connectivity and basic operations.
```bash
node scripts/test_db.js
```

#### `test_endpoints.js`
Tests API endpoints for basic functionality.
```bash
node scripts/test_endpoints.js
```

## NPM Scripts

Add scripts to `package.json` for easy execution:

```json
{
  "scripts": {
    "seed": "node scripts/seedAdmin.js",
    "check-admin": "node scripts/check_admin_login.js",
    "check-doctors": "node scripts/verify_doctors.js",
    "test-db": "node scripts/test_db.js",
    "verify-finance": "node scripts/verify_finance.js"
  }
}
```

Usage:
```bash
npm run seed
npm run check-admin
npm run check-doctors
```

## Best Practices

1. **Configuration** - Use environment variables, not hardcoded values
2. **Error Handling** - Clear error messages and logging
3. **Idempotency** - Scripts should be safe to run multiple times
4. **Documentation** - Include comments explaining functionality
5. **Exit Codes** - Use proper exit codes (0 for success, 1 for failure)

## Script Template

```javascript
// scripts/your_script.js
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        // Your logic here

        console.log('✓ Script completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
```

## Development Workflow

1. **Initial Setup**: Run `seedAdmin.js` to create admin
2. **Verification**: Run `check_*.js` scripts to verify data
3. **Testing**: Run `test_*.js` scripts before deployment
4. **Maintenance**: Run `verify_*.js` scripts periodically

## Troubleshooting

### "Connection timeout"
- Check MongoDB is running
- Verify MONGO_URI is correct

### "ADMIN_PASSWORD not set"
- Set environment variable: `export ADMIN_PASSWORD="your_password"`
- Or add to `.env` file

### "Document not found"
- Run `seedAdmin.js` first
- Check database is populated

## Adding New Scripts

1. Create file in `scripts/` folder
2. Follow naming convention: `{verb}_{subject}.js`
3. Add to `package.json` scripts section
4. Document in this README
5. Use template structure for consistency
