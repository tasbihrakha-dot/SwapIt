const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Access denied. Token is required.',
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Invalid or expired token.',
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured.');

        return res.status(500).json({
            message: 'Server configuration error.',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(401).json({
                message: 'Invalid token payload.',
            });
        }

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token.',
        });
    }
}

module.exports = verifyToken;