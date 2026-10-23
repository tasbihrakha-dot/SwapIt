const jwt = require('jsonwebtoken');
const verifyToken = require('../src/middleware/authMiddleware');

describe('Authentication Middleware', () => {
beforeAll(() => {
process.env.JWT_SECRET = 'swapit-test-secret';
});

test('should return 401 when token is missing', () => {
    const req = {
        headers: {},
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Token is required.',
    });
    expect(next).not.toHaveBeenCalled();
});

test('should allow a valid token', () => {
    const token = jwt.sign(
        { id: 1, role: 'user' },
        process.env.JWT_SECRET
    );

    const req = {
        headers: {
            authorization: `Bearer ${token}`,
        },
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    const next = jest.fn();

    verifyToken(req, res, next);

    expect(req.user.id).toBe(1);
    expect(req.user.role).toBe('user');
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
});

test('should return 401 when token is invalid', () => {
    const req = {
        headers: {
            authorization: 'Bearer invalid-token',
        },
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token.',
    });
    expect(next).not.toHaveBeenCalled();
});

});