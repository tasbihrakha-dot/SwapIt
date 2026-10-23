require('dotenv').config();

const AppDataSource = require('../config/database');

async function testDatabase() {
    try {
        await AppDataSource.initialize();

        console.log('Database connected successfully!');

        const result = await AppDataSource.query(
            'SELECT current_database()'
        );

        console.log('Database name:', result[0].current_database);
    } catch (error) {
        console.error('Database connection failed:');
        console.error(error.message);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

testDatabase();