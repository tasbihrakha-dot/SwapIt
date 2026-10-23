require('dotenv').config();

const express = require('express');
const AppDataSource = require('../config/database');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const exchangeRoutes = require('./routes/exchangeRoutes');
const verifyToken = require('./middleware/authMiddleware');

const app = express();

app.use(express.json());

// Home route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to SwapIt API!',
    });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Product routes
app.use('/api/products', productRoutes);

// Exchange request routes
app.use('/api/exchanges', exchangeRoutes);

// Protected test route
app.get('/api/test-auth', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Authentication successful!',
        user: req.user,
    });
});

// Export the app so it can be tested later
module.exports = app;

// Start the server only when this file is run directly
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    AppDataSource.initialize()
        .then(() => {
            console.log('Database connected successfully!');

            app.listen(PORT, () => {
                console.log(`SwapIt server is running on port ${PORT}`);
            });
        })
        .catch((error) => {
            console.error(
                'Failed to connect to database:',
                error.message
            );

            process.exit(1);
        });
}