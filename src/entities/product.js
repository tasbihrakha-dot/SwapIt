const { EntitySchema } = require('typeorm');

const Product = new EntitySchema({
    name: 'Product',
    tableName: 'products',

    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true,
        },

        name: {
            type: 'varchar',
            length: 150,
            nullable: false,
        },

        price: {
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
},

        description: {
            type: 'text',
            nullable: true,
        },

        category: {
            type: 'varchar',
            length: 100,
            nullable: false,
        },

        condition: {
            type: 'varchar',
            length: 30,
            default: 'good',
        },

        status: {
            type: 'varchar',
            length: 30,
            default: 'available',
        },

        imageUrl: {
            type: 'varchar',
            nullable: true,
        },

        createdAt: {
            type: 'timestamp',
            createDate: true,
        },
    },

    relations: {
        owner: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: {
                name: 'ownerId',
            },
            nullable: false,
            onDelete: 'CASCADE',
        },
    },
});

module.exports = Product;