const express = require('express');

const AppDataSource = require('../../config/database');
const ExchangeRequest = require('../entities/exchangeRequest');
const Product = require('../entities/product');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

const exchangeRepository = () =>
    AppDataSource.getRepository(ExchangeRequest);

const productRepository = () =>
    AppDataSource.getRepository(Product);

// Get exchange requests for the logged-in user
router.get('/', verifyToken, async (req, res) => {
    try {
        const requests = await exchangeRepository()
            .createQueryBuilder('exchange')
            .leftJoin('exchange.requester', 'requester')
            .leftJoinAndSelect('exchange.offeredProduct', 'offeredProduct')
            .leftJoinAndSelect('exchange.requestedProduct', 'requestedProduct')
            .leftJoin('offeredProduct.owner', 'offeredOwner')
            .leftJoin('requestedProduct.owner', 'requestedOwner')
            .select([
                'exchange.id',
                'exchange.priceDifference',
                'exchange.differencePayerId',
                'exchange.status',
                'exchange.createdAt',
                'requester.id',
                'requester.name',
                'offeredProduct.id',
                'offeredProduct.name',
                'offeredProduct.price',
                'offeredProduct.category',
                'offeredProduct.status',
                'requestedProduct.id',
                'requestedProduct.name',
                'requestedProduct.price',
                'requestedProduct.category',
                'requestedProduct.status',
            ])
            .where('requester.id = :userId', {
                userId: req.user.id,
            })
            .orWhere('offeredOwner.id = :userId', {
                userId: req.user.id,
            })
            .orWhere('requestedOwner.id = :userId', {
                userId: req.user.id,
            })
            .orderBy('exchange.createdAt', 'DESC')
            .getMany();

        return res.status(200).json(requests);
    } catch (error) {
        console.error('Get exchange requests error:', error.message);

        return res.status(500).json({
            message: 'Failed to retrieve exchange requests.',
        });
    }
});

// Create an exchange request.
// The first pending request reserves both products logically.
router.post('/', verifyToken, async (req, res) => {
    try {
        const { offeredProductId, requestedProductId } = req.body || {};

        if (
            offeredProductId === undefined ||
            offeredProductId === null ||
            String(offeredProductId).trim() === '' ||
            requestedProductId === undefined ||
            requestedProductId === null ||
            String(requestedProductId).trim() === ''
        ) {
            return res.status(400).json({
                message: 'Valid offered and requested product IDs are required.',
            });
        }

        const offeredId = Number(offeredProductId);
        const requestedId = Number(requestedProductId);

        if (
            !Number.isSafeInteger(offeredId) ||
            offeredId < 1 ||
            !Number.isSafeInteger(requestedId) ||
            requestedId < 1
        ) {
            return res.status(400).json({
                message: 'Valid offered and requested product IDs are required.',
            });
        }

        if (offeredId === requestedId) {
            return res.status(400).json({
                message: 'You cannot exchange a product for itself.',
            });
        }

        const result = await AppDataSource.transaction(
            async (manager) => {
                const products = manager.getRepository(Product);
                const requests = manager.getRepository(ExchangeRequest);

                // Lock products in a consistent order to reduce race conditions.
                const ids = [offeredId, requestedId].sort((a, b) => a - b);
                const lockedProducts = {};

                for (const id of ids) {
                    lockedProducts[id] = await products.findOne({
                        where: { id },
                        relations: { owner: true },
                        lock: { mode: 'pessimistic_write' },
                    });
                }

                const offeredProduct = lockedProducts[offeredId];
                const requestedProduct = lockedProducts[requestedId];

                if (!offeredProduct || !requestedProduct) {
                    return {
                        status: 404,
                        body: {
                            message: 'One or both products were not found.',
                        },
                    };
                }

                if (
                    Number(offeredProduct.owner.id) !== Number(req.user.id)
                ) {
                    return {
                        status: 403,
                        body: {
                            message: 'You can only offer your own products.',
                        },
                    };
                }

                if (
                    Number(requestedProduct.owner.id) === Number(req.user.id)
                ) {
                    return {
                        status: 400,
                        body: {
                            message: 'You cannot request your own product.',
                        },
                    };
                }

                if (
                    offeredProduct.status !== 'available' ||
                    requestedProduct.status !== 'available'
                ) {
                    return {
                        status: 400,
                        body: {
                            message: 'Both products must be available for exchange.',
                        },
                    };
                }

                // A product involved in any pending request cannot be used again.
                const existingRequest = await requests
                    .createQueryBuilder('exchange')
                    .where('exchange.status = :status', {
                        status: 'pending',
                    })
                    .andWhere(
                        `(
                            exchange.offeredProductId IN (:...ids)
                            OR exchange.requestedProductId IN (:...ids)
                        )`,
                        { ids }
                    )
                    .getOne();

                if (existingRequest) {
                    return {
                        status: 409,
                        body: {
                            message: 'One or both products are reserved by an earlier pending exchange request.',
                        },
                    };
                }

                const offeredPrice = Number(offeredProduct.price);
                const requestedPrice = Number(requestedProduct.price);

                if (
                    !Number.isFinite(offeredPrice) ||
                    offeredPrice <= 0 ||
                    !Number.isFinite(requestedPrice) ||
                    requestedPrice <= 0
                ) {
                    return {
                        status: 400,
                        body: {
                            message: 'Both products must have valid prices.',
                        },
                    };
                }

                const priceDifference = Number(
                    Math.abs(offeredPrice - requestedPrice).toFixed(2)
                );

                let differencePayerId = null;

                if (priceDifference > 0) {
                    differencePayerId =
                        offeredPrice < requestedPrice
                            ? Number(req.user.id)
                            : Number(requestedProduct.owner.id);
                }

                const newRequest = requests.create({
                    requester: { id: req.user.id },
                    offeredProduct: { id: offeredId },
                    requestedProduct: { id: requestedId },
                    priceDifference,
                    differencePayerId,
                    status: 'pending',
                });

                const savedRequest = await requests.save(newRequest);

                return {
                    status: 201,
                    body: {
                        message: 'Exchange request created successfully.',
                        exchangeRequest: {
                            id: savedRequest.id,
                            status: savedRequest.status,
                            offeredProductId: offeredId,
                            requestedProductId: requestedId,
                            priceDifference,
                            differencePayerId,
                        },
                    },
                };
            }
        );

        return res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Create exchange request error:', error.message);

        return res.status(500).json({
            message: 'Failed to create exchange request.',
        });
    }
});

// Accept a request and transfer product ownership.
router.patch('/:id/accept', verifyToken, async (req, res) => {
    try {
        const requestId = Number(req.params.id);

        if (!Number.isSafeInteger(requestId) || requestId < 1) {
            return res.status(400).json({
                message: 'Invalid exchange request ID.',
            });
        }

        const result = await AppDataSource.transaction(
            async (manager) => {
                const requests = manager.getRepository(ExchangeRequest);
                const products = manager.getRepository(Product);

                const request = await requests.findOne({
                    where: { id: requestId },
                    relations: {
                        requester: true,
                        offeredProduct: true,
                        requestedProduct: true,
                    },
                    lock: { mode: 'pessimistic_write' },
                });

                if (!request) {
                    return {
                        status: 404,
                        body: { message: 'Exchange request not found.' },
                    };
                }

                if (request.status !== 'pending') {
                    return {
                        status: 400,
                        body: {
                            message: 'This request has already been processed.',
                        },
                    };
                }

                const offeredId = Number(request.offeredProduct.id);
                const requestedId = Number(request.requestedProduct.id);
                const ids = [offeredId, requestedId].sort((a, b) => a - b);
                const lockedProducts = {};

                for (const id of ids) {
                    lockedProducts[id] = await products.findOne({
                        where: { id },
                        relations: { owner: true },
                        lock: { mode: 'pessimistic_write' },
                    });
                }

                const offeredProduct = lockedProducts[offeredId];
                const requestedProduct = lockedProducts[requestedId];

                if (!offeredProduct || !requestedProduct) {
                    return {
                        status: 404,
                        body: {
                            message: 'One or both products were not found.',
                        },
                    };
                }

                if (
                    Number(requestedProduct.owner.id) !== Number(req.user.id)
                ) {
                    return {
                        status: 403,
                        body: {
                            message: 'Only the requested product owner can accept this request.',
                        },
                    };
                }

                if (
                    Number(offeredProduct.owner.id) !==
                    Number(request.requester.id)
                ) {
                    return {
                        status: 400,
                        body: {
                            message: 'The offered product ownership has changed.',
                        },
                    };
                }

                if (
                    offeredProduct.status !== 'available' ||
                    requestedProduct.status !== 'available'
                ) {
                    return {
                        status: 409,
                        body: {
                            message: 'One or both products are no longer available.',
                        },
                    };
                }

                // Older pending requests take priority over newer conflicting requests.
                const olderRequest = await requests
                    .createQueryBuilder('exchange')
                    .where('exchange.status = :status', {
                        status: 'pending',
                    })
                    .andWhere('exchange.id < :requestId', { requestId })
                    .andWhere(
                        `(
                            exchange.offeredProductId IN (:...ids)
                            OR exchange.requestedProductId IN (:...ids)
                        )`,
                        { ids }
                    )
                    .getOne();

                if (olderRequest) {
                    return {
                        status: 409,
                        body: {
                            message: 'An older pending request involving one of these products must be processed first.',
                        },
                    };
                }

                const offeredPrice = Number(offeredProduct.price);
                const requestedPrice = Number(requestedProduct.price);

                if (
                    !Number.isFinite(offeredPrice) ||
                    offeredPrice <= 0 ||
                    !Number.isFinite(requestedPrice) ||
                    requestedPrice <= 0
                ) {
                    return {
                        status: 400,
                        body: {
                            message: 'Both products must have valid prices.',
                        },
                    };
                }

                // Recalculate the difference using the current prices.
                request.priceDifference = Number(
                    Math.abs(offeredPrice - requestedPrice).toFixed(2)
                );

                request.differencePayerId =
                    request.priceDifference === 0
                        ? null
                        : offeredPrice < requestedPrice
                            ? Number(request.requester.id)
                            : Number(requestedProduct.owner.id);

                const offeredOwner = offeredProduct.owner;
                const requestedOwner = requestedProduct.owner;

                offeredProduct.owner = requestedOwner;
                requestedProduct.owner = offeredOwner;

                offeredProduct.status = 'exchanged';
                requestedProduct.status = 'exchanged';
                request.status = 'accepted';

                await products.save([offeredProduct, requestedProduct]);
                await requests.save(request);

                return {
                    status: 200,
                    body: {
                        message: 'Exchange accepted and ownership transferred successfully.',
                        exchangeRequest: {
                            id: request.id,
                            status: request.status,
                            offeredProductId: offeredId,
                            requestedProductId: requestedId,
                            priceDifference: request.priceDifference,
                            differencePayerId: request.differencePayerId,
                        },
                        products: [
                            {
                                id: offeredProduct.id,
                                name: offeredProduct.name,
                                newOwnerId: offeredProduct.owner.id,
                                status: offeredProduct.status,
                            },
                            {
                                id: requestedProduct.id,
                                name: requestedProduct.name,
                                newOwnerId: requestedProduct.owner.id,
                                status: requestedProduct.status,
                            },
                        ],
                    },
                };
            }
        );

        return res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Accept exchange request error:', error.message);

        return res.status(500).json({
            message: 'Failed to accept exchange request.',
        });
    }
});

// Reject a request and release its products for future requests.
router.patch('/:id/reject', verifyToken, async (req, res) => {
    try {
        const requestId = Number(req.params.id);

        if (!Number.isSafeInteger(requestId) || requestId < 1) {
            return res.status(400).json({
                message: 'Invalid exchange request ID.',
            });
        }

        const result = await AppDataSource.transaction(
            async (manager) => {
                const requests = manager.getRepository(ExchangeRequest);
                const products = manager.getRepository(Product);

                const request = await requests.findOne({
                    where: { id: requestId },
                    relations: {
                        requester: true,
                        offeredProduct: true,
                        requestedProduct: true,
                    },
                    lock: { mode: 'pessimistic_write' },
                });

                if (!request) {
                    return {
                        status: 404,
                        body: { message: 'Exchange request not found.' },
                    };
                }

                if (request.status !== 'pending') {
                    return {
                        status: 400,
                        body: {
                            message: 'This request has already been processed.',
                        },
                    };
                }

                const offeredId = Number(request.offeredProduct.id);
                const requestedId = Number(request.requestedProduct.id);
                const ids = [offeredId, requestedId].sort((a, b) => a - b);
                const lockedProducts = {};

                for (const id of ids) {
                    lockedProducts[id] = await products.findOne({
                        where: { id },
                        relations: { owner: true },
                        lock: { mode: 'pessimistic_write' },
                    });
                }

                const offeredProduct = lockedProducts[offeredId];
                const requestedProduct = lockedProducts[requestedId];

                if (!offeredProduct || !requestedProduct) {
                    return {
                        status: 404,
                        body: {
                            message: 'One or both products were not found.',
                        },
                    };
                }

                if (
                    Number(requestedProduct.owner.id) !== Number(req.user.id)
                ) {
                    return {
                        status: 403,
                        body: {
                            message: 'Only the requested product owner can reject this request.',
                        },
                    };
                }

                request.status = 'rejected';
                await requests.save(request);

                // Products stay available; other pending requests, if any,
                // continue to reserve them until those requests are processed.

                return {
                    status: 200,
                    body: {
                        message: 'Exchange request rejected successfully.',
                        exchangeRequest: {
                            id: request.id,
                            status: request.status,
                        },
                    },
                };
            }
        );

        return res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Reject exchange request error:', error.message);

        return res.status(500).json({
            message: 'Failed to reject exchange request.',
        });
    }
});

module.exports = router;