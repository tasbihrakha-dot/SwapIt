const { EntitySchema } = require('typeorm');

const User = new EntitySchema({
    name: 'User',
    tableName: 'users',

    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true,
        },

        name: {
            type: 'varchar',
            length: 100,
            nullable: false,
        },

        email: {
            type: 'varchar',
            length: 150,
            unique: true,
            nullable: false,
        },

        password: {
            type: 'varchar',
            nullable: false,
        },

        role: {
            type: 'varchar',
            length: 20,
            default: 'user',
        },

        createdAt: {
            type: 'timestamp',
            createDate: true,
        },
    },
});

module.exports = User;