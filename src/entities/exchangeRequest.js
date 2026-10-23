const { EntitySchema } = require('typeorm');

const ExchangeRequest = new EntitySchema({
    name: 'ExchangeRequest',
    tableName: 'exchange_requests',

    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true,
        },

        offeredProductId: {
            type: 'int',
            nullable: false,
        },

        requestedProductId: {
            type: 'int',
            nullable: false,
        },

        priceDifference: {
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
        },

        differencePayerId: {
            type: 'int',
            nullable: true,
        },

        status: {
            type: 'varchar',
            length: 20,
            default: 'pending',
        },

        createdAt: {
            type: 'timestamp',
            createDate: true,
        },
    },

    relations: {
        requester: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: {
                name: 'requesterId',
            },
            nullable: false,
            onDelete: 'CASCADE',
        },

        offeredProduct: {
            type: 'many-to-one',
            target: 'Product',
            joinColumn: {
                name: 'offeredProductId',
            },
            nullable: false,
            onDelete: 'CASCADE',
        },

        requestedProduct: {
            type: 'many-to-one',
            target: 'Product',
            joinColumn: {
                name: 'requestedProductId',
            },
            nullable: false,
            onDelete: 'CASCADE',
        },
    },
});

module.exports = ExchangeRequest;