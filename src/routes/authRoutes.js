const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const AppDataSource = require('../../config/database');
const User = require('../entities/user');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body || {};

        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                message: 'Name, email, and password are required.',
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedName || !normalizedEmail || !password.trim()) {
            return res.status(400).json({
                message: 'Name, email, and password cannot be empty.',
            });
        }

        if (normalizedName.length > 100) {
            return res.status(400).json({
                message: 'Name must not exceed 100 characters.',
            });
        }

        if (normalizedEmail.length > 150) {
            return res.status(400).json({
                message: 'Email must not exceed 150 characters.',
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters.',
            });
        }

        if (Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({
                message: 'Password must not exceed 72 bytes.',
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                message: 'Please provide a valid email address.',
            });
        }

        const userRepository = AppDataSource.getRepository(User);

        const existingUser = await userRepository.findOneBy({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Email is already registered.',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = userRepository.create({
            name: normalizedName,
            email: normalizedEmail,
            password: hashedPassword,
        });

        await userRepository.save(newUser);

        return res.status(201).json({
            message: 'Account created successfully.',
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Email is already registered.',
            });
        }

        console.error('Register error:', error.message);

        return res.status(500).json({
            message: 'Something went wrong.',
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Email and password are required.',
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const userRepository = AppDataSource.getRepository(User);

        const user = await userRepository.findOneBy({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password.',
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Invalid email or password.',
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured.');

            return res.status(500).json({
                message: 'Server configuration error.',
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h',
            }
        );

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            message: 'Something went wrong.',
        });
    }
});

module.exports = router;