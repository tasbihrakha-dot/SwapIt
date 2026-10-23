SwapIt — Product Exchange API

SwapIt is a backend REST API for a product exchange platform. It allows users to create accounts, browse products, and request exchanges with other users.

The project is built with Node.js, Express.js, TypeORM, and PostgreSQL.

Features

- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Product listing and product details.
- Authenticated product creation.
- Exchange request creation and listing.
- Accepting and rejecting exchange requests.
- Product ownership updates when an exchange is accepted.
- Input validation and HTTP status codes.
- Automated tests using Jest and Supertest.

Tech Stack

- Node.js — JavaScript runtime.
- Express.js — REST API framework.
- PostgreSQL — Relational database.
- TypeORM — Database interaction and entity management.
- JWT — Token-based authentication.
- bcrypt — Password hashing.
- Jest — Testing framework.
- Supertest — HTTP endpoint testing.
- dotenv — Environment variable management.

Project Structure

SwapIt/
├── config/
│   └── database.js
├── src/
│   ├── entities/
│   │   ├── user.js
│   │   ├── product.js
│   │   └── exchangeRequest.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── exchangeRoutes.js
│   ├── server.js
│   └── test-db.js
├── tests/
│   ├── authMiddleware.test.js
│   └── server.test.js
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md

Requirements

Before running the project, make sure you have:

- Node.js installed.
- npm installed.
- PostgreSQL installed and running.
- A PostgreSQL database created for SwapIt.

Installation

1. Clone the repository:
   
   git clone https://github.com/tasbihrakha-dot/SwapIt.git

2. Navigate to the project directory:
   
   cd SwapIt

3. Install the dependencies:
   
   npm install

4. Create a ".env" file in the project root directory.

5. Configure the environment variables as described below.

Environment Variables

Create a ".env" file in the root directory and provide your own local configuration:

PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_database_password
DB_NAME=swapit_db
JWT_SECRET=your_long_random_secret

Replace the example values with your own PostgreSQL credentials and a strong JWT secret.

Important: Never upload your ".env" file, database password, or JWT secret to GitHub.

Running the Project

Start the development server:

npm run dev

Or start the application normally:

npm start

When the database connection succeeds, the server listens on port "5000" by default, unless another port is configured.

Open the following URL to check the home endpoint:

http://localhost:5000/

Expected response:

{
  "message": "Welcome to SwapIt API!"
}

API Endpoints

The following endpoints reflect the application's current route structure.

General

Method| Endpoint| Description
GET| "/"| Welcome message
GET| "/api/test-auth"| Test JWT authentication

Authentication

Method| Endpoint| Description
POST| "/api/auth/register"| Register a new user
POST| "/api/auth/login"| Log in and receive a JWT

Products

Method| Endpoint| Description
GET| "/api/products"| List products
GET| "/api/products/:id"| Get product details
POST| "/api/products"| Create a product (authentication required)

Exchange Requests

Method| Endpoint| Description
GET| "/api/exchanges"| List relevant exchange requests (authentication required)
POST| "/api/exchanges"| Create an exchange request (authentication required)
PATCH| "/api/exchanges/:id/accept"| Accept an exchange request (authentication required)
PATCH| "/api/exchanges/:id/reject"| Reject an exchange request (authentication required)

Protected endpoints require a JWT in the request header:

Authorization: Bearer YOUR_JWT_TOKEN

Running Tests

Run the automated tests with:

npm test

The current test suite covers authentication middleware and selected server endpoints.

Security Notes

- Passwords are hashed before being stored.
- Protected endpoints require a valid JWT.
- Environment variables should be kept private.
- Use a dedicated test database or mocks for tests that interact with database operations.
- Review database synchronization settings and use migrations before production deployment.

Future Improvements

- Add comprehensive tests for products and exchange requests.
- Add centralized error handling and request logging.
- Add pagination, filtering, and search for products.
- Add API documentation using Swagger.
- Prepare production deployment configuration.

Author

Tasbih Rakha

GitHub: "tasbihrakha-dot" (https://github.com/tasbihrakha-dot)

---

SwapIt — A backend API for exchanging products between users.