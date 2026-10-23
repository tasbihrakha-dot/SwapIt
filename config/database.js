const { DataSource } = require('typeorm');
require('dotenv').config();

const User = require('../src/entities/user');
const Product = require('../src/entities/product');
const ExchangeRequest = require('../src/entities/exchangeRequest');

const AppDataSource = new DataSource({
    type: 'postgres',

    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    entities: [
        User,
        Product,
        ExchangeRequest,
    ],

    synchronize: true,
    logging: true,
});

module.exports = AppDataSource;