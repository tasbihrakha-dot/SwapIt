const request = require('supertest');
const app = require('../src/server');

describe('SwapIt Server', () => {
test('should return a welcome message on the home route', async () => {
const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
        message: 'Welcome to SwapIt API!',
    });
});

test('should reject access to the authentication test route without a token', async () => {
    const response = await request(app).get('/api/test-auth');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
        message: 'Access denied. Token is required.',
    });
});

test('should reject creating a product without a token', async () => {
    const response = await request(app)
        .post('/api/products')
        .send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
        message: 'Access denied. Token is required.',
    });
});

test('should reject viewing exchange requests without a token', async () => {
    const response = await request(app).get('/api/exchanges');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
        message: 'Access denied. Token is required.',
    });
});

});