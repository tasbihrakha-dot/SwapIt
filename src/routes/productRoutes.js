const express = require('express');

const AppDataSource = require('../../config/database');
const Product = require('../entities/product');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

const productRepository = () =>
    AppDataSource.getRepository(Product);

const productSelect = {
    id: true,
    name: true,
    price: true,
    description: true,
    category: true,
    condition: true,
    status: true,
    imageUrl: true,
    createdAt: true,
    owner: {
        id: true,
        name: true,
    },
};

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await productRepository().find({
            relations: {
                owner: true,
            },
            select: productSelect,
            order: {
                createdAt: 'DESC',
            },
        });

        return res.status(200).json(products);
    } catch (error) {
        console.error('Get products error:', error.message);

        return res.status(500).json({
            message: 'Failed to retrieve products.',
        });
    }
});

// Get one product by ID
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                message: 'Invalid product ID.',
            });
        }

        const product = await productRepository().findOne({
            where: { id },
            relations: {
                owner: true,
            },
            select: productSelect,
        });

        if (!product) {
            return res.status(404).json({
                message: 'Product not found.',
            });
        }

        return res.status(200).json(product);
    } catch (error) {
        console.error('Get product error:', error.message);

        return res.status(500).json({
            message: 'Failed to retrieve product.',
        });
    }
});

// Create a new product
router.post('/', verifyToken, async (req, res) => {
    try {
        const body = req.body || {};

        const {
            name,
            description,
            category,
            condition,
            imageUrl,
            price,
        } = body;

        if (
            typeof name !== 'string' ||
            !name.trim() ||
            typeof category !== 'string' ||
            !category.trim()
        ) {
            return res.status(400).json({
                message: 'Product name and category are required.',
            });
        }

        if (name.trim().length > 150) {
            return res.status(400).json({
                message: 'Product name must not exceed 150 characters.',
            });
        }

        if (category.trim().length > 100) {
            return res.status(400).json({
                message: 'Category must not exceed 100 characters.',
            });
        }

        if (
            price === undefined ||
            price === null ||
            (typeof price !== 'number' && typeof price !== 'string') ||
            String(price).trim() === '' ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0 ||
            Number(price) > 99999999.99
        ) {
            return res.status(400).json({
                message: 'A valid positive price is required.',
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== 'string'
        ) {
            return res.status(400).json({
                message: 'Description must be text.',
            });
        }

        if (
            typeof description === 'string' &&
            description.length > 10000
        ) {
            return res.status(400).json({
                message: 'Description is too long.',
            });
        }

        if (
            imageUrl !== undefined &&
            imageUrl !== null &&
            typeof imageUrl !== 'string'
        ) {
            return res.status(400).json({
                message: 'Image URL must be text.',
            });
        }

        if (
            typeof imageUrl === 'string' &&
            imageUrl.trim() !== ''
        ) {
            try {
                const parsedUrl = new URL(imageUrl.trim());

                if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                    throw new Error('Unsupported URL protocol.');
                }
            } catch {
                return res.status(400).json({
                    message: 'Image URL must be a valid HTTP or HTTPS URL.',
                });
            }
        }

        const allowedConditions = [
            'new',
            'like_new',
            'good',
            'fair',
        ];

        const selectedCondition =
            condition === undefined ? 'good' : condition;

        if (
            typeof selectedCondition !== 'string' ||
            !allowedConditions.includes(selectedCondition)
        ) {
            return res.status(400).json({
                message: 'Invalid product condition.',
            });
        }

        const product = productRepository().create({
            name: name.trim(),
            description:
                typeof description === 'string' && description.trim()
                    ? description.trim()
                    : null,
            category: category.trim(),
            condition: selectedCondition,
            imageUrl:
                typeof imageUrl === 'string' && imageUrl.trim()
                    ? imageUrl.trim()
                    : null,
            price: Number(Number(price).toFixed(2)),
            owner: {
                id: req.user.id,
            },
        });

        const savedProduct = await productRepository().save(product);

        return res.status(201).json({
            message: 'Product created successfully.',
            product: {
                id: savedProduct.id,
                name: savedProduct.name,
                price: savedProduct.price,
                description: savedProduct.description,
                category: savedProduct.category,
                condition: savedProduct.condition,
                status: savedProduct.status,
                imageUrl: savedProduct.imageUrl,
                createdAt: savedProduct.createdAt,
                owner: {
                    id: req.user.id,
                    name: req.user.name,
                },
            },
        });
    } catch (error) {
        console.error('Create product error:', error.message);

        return res.status(500).json({
            message: 'Failed to create product.',
        });
    }
});

module.exports = router;