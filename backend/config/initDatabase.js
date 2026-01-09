const db = require('./db');
const fs = require('fs');
const path = require('path');

/**
 * Initialize database schema from SQL file
 */
async function initDatabase() {
    try {
        console.log('Initializing database schema...');
        
        // Read SQL file
        const sqlFilePath = path.join(__dirname, '../database.sql');
        
        if (!fs.existsSync(sqlFilePath)) {
            console.warn('database.sql file not found. Skipping schema initialization.');
            return false;
        }

        const sql = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Split SQL into individual statements
        // Remove comments and split by semicolons
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => 
                stmt.length > 0 && 
                !stmt.startsWith('--') && 
                !stmt.startsWith('/*')
            );

        console.log(`Found ${statements.length} SQL statements to execute`);

        // Execute statements one by one
        let executed = 0;
        let errors = 0;

        for (const statement of statements) {
            if (statement.length < 10) continue; // Skip very short statements
            
            try {
                await db.simpleQuery(statement);
                executed++;
                
                // Log table creation
                if (statement.toUpperCase().includes('CREATE TABLE')) {
                    const tableMatch = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i);
                    if (tableMatch) {
                        console.log(`  Created table: ${tableMatch[1]}`);
                    }
                }
            } catch (error) {
                // Ignore "table already exists" errors
                if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
                    error.message.includes('already exists')) {
                    // Table already exists, that's okay
                    continue;
                }
                
                errors++;
                console.error(`  Error executing statement:`, error.message);
                if (process.env.NODE_ENV === 'development') {
                    console.error(`  Statement: ${statement.substring(0, 100)}...`);
                }
            }
        }

        console.log(`\nDatabase initialization complete:`);
        console.log(`   Executed: ${executed} statements`);
        if (errors > 0) {
            console.log(`   Errors: ${errors} (some may be expected if tables already exist)`);
        }

        return true;
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        return false;
    }
}

/**
 * Check if database tables exist
 */
async function checkDatabaseTables() {
    try {
        const tables = await db.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_TYPE = 'BASE TABLE'
        `);
        
        return tables.map(t => t.TABLE_NAME);
    } catch (error) {
        console.error('Error checking database tables:', error.message);
        return [];
    }
}

/**
 * Verify critical tables exist
 */
async function verifyDatabaseSchema() {
    const criticalTables = [
        'users',
        'user_profiles',
        'health_metrics',
        'doctors',
        'appointments',
        'payments'
    ];

    try {
        const existingTables = await checkDatabaseTables();
        const missingTables = criticalTables.filter(
            table => !existingTables.includes(table)
        );

        if (missingTables.length > 0) {
            console.warn(`Missing critical tables: ${missingTables.join(', ')}`);
            return false;
        }

        console.log('All critical database tables exist');
        return true;
    } catch (error) {
        console.error('Error verifying database schema:', error.message);
        return false;
    }
}

module.exports = {
    initDatabase,
    checkDatabaseTables,
    verifyDatabaseSchema
};

