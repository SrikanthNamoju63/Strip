const db = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * Initialize missing database tables
 */
async function initMissingTables() {
    try {
        console.log('Checking and creating missing tables...\n');

        // Read the SQL file
        const sqlFilePath = path.join(__dirname, '../database.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        // Extract CREATE TABLE statements for missing tables
        const missingTables = ['user_profiles', 'appointments'];
        
        // Split SQL into statements
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

        let created = 0;
        let errors = 0;

        for (const tableName of missingTables) {
            // Find CREATE TABLE statement for this table
            const createTableRegex = new RegExp(
                `DROP TABLE IF EXISTS ${tableName}[\\s\\S]*?CREATE TABLE ${tableName}[\\s\\S]*?(?=DROP TABLE|CREATE TABLE|--|$)`,
                'i'
            );
            
            const match = sql.match(createTableRegex);
            
            if (match) {
                try {
                    // Execute DROP TABLE IF EXISTS first
                    await db.simpleQuery(`DROP TABLE IF EXISTS ${tableName}`);
                    
                    // Execute CREATE TABLE
                    const createStatement = match[0].replace(/DROP TABLE IF EXISTS.*?;/i, '').trim();
                    await db.simpleQuery(createStatement);
                    
                    console.log(`✓ Created table: ${tableName}`);
                    created++;
                } catch (error) {
                    if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
                        console.log(`- Table ${tableName} already exists`);
                    } else {
                        console.error(`✗ Error creating ${tableName}:`, error.message);
                        errors++;
                    }
                }
            } else {
                console.warn(`⚠ Could not find CREATE TABLE statement for ${tableName}`);
            }
        }

        console.log(`\nSummary: Created ${created} tables, ${errors} errors`);
        
        // Verify tables now exist
        console.log('\nVerifying tables...');
        const tables = await db.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('user_profiles', 'appointments')
        `);
        
        const existingTableNames = tables.map(t => t.TABLE_NAME);
        console.log('Existing tables:', existingTableNames.join(', '));
        
        if (existingTableNames.length === 2) {
            console.log('\n✓ All required tables are now present!');
            return true;
        } else {
            console.log('\n⚠ Some tables are still missing. You may need to run the full database.sql file.');
            return false;
        }

    } catch (error) {
        console.error('Error initializing tables:', error.message);
        return false;
    } finally {
        // Close connection pool
        await db.pool.end();
        process.exit(0);
    }
}

// Run the initialization
initMissingTables();

