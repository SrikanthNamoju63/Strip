const db = require('../config/db');

(async () => {
    try {
        const tables = await db.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_TYPE = 'BASE TABLE' 
            ORDER BY TABLE_NAME
        `);
        
        console.log('\nAll database tables:');
        console.log('='.repeat(50));
        tables.forEach((t, i) => {
            console.log(`${i + 1}. ${t.TABLE_NAME}`);
        });
        console.log('='.repeat(50));
        console.log(`Total: ${tables.length} tables\n`);
        
        // Check critical tables
        const criticalTables = ['users', 'user_profiles', 'health_metrics', 'doctors', 'appointments', 'payments'];
        const existingTableNames = tables.map(t => t.TABLE_NAME);
        const missing = criticalTables.filter(t => !existingTableNames.includes(t));
        
        if (missing.length === 0) {
            console.log('✓ All critical tables are present!');
        } else {
            console.log(`⚠ Missing critical tables: ${missing.join(', ')}`);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.pool.end();
        process.exit(0);
    }
})();

