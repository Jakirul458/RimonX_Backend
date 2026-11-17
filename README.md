# RimonX Backend

This directory contains the MERN backend for the RimonX credit-based SaaS application.

## Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT authentication
- bcryptjs

## Features

- User registration and login
- Welcome bonus wallet credit: 10 free points
- Export/download charge enforcement: 1 point per successful export or print action
- Duplicate export protection using an operation id
- Admin user and wallet management endpoints
- Pricing and legal content endpoints

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill in your MongoDB Atlas connection string and JWT secret.
3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Production start:

```bash
npm start
```

## High-level API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Wallet

- `GET /api/wallet`
- `POST /api/wallet/export`

### Public content

- `GET /api/pricing`
- `GET /api/legal/terms`
- `GET /api/legal/privacy`
- `GET /api/legal/refunds`

### Admin

- `GET /api/admin/overview`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`

### Create the first admin account

When the backend is running and MongoDB is connected, run:

```bash
node src/scripts/create-admin.js "Admin Name" admin@example.com StrongPassword123
```

This will either create a new admin user or promote an existing account to `ADMIN`.

## Deployment

### MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user with a strong password.
3. Allow access from anywhere (0.0.0.0/0) for initial setup, or restrict to Render IPs later.
4. Copy the connection string in the format:

```text
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rimonx?retryWrites=true&w=majority
```

### Render deployment

1. In Render, create a new Web Service from this directory.
2. Set the runtime to Node.
3. Add these environment variables:

```text
NODE_ENV=production
PORT=10000
JWT_SECRET=<generate a long random string>
MONGO_URI=<your atlas mongo uri>
MONGO_DB_NAME=rimonx
CLIENT_URL=https://your-frontend-domain.example.com
```

4. The service will run `npm install` and `npm start`. `CLIENT_URL` must contain
the frontend's origin (scheme and hostname, without a path); multiple origins
can be comma-separated. A trailing slash is also normalized.
5. After deploy, copy the Render service URL such as:

```text
https://rimonx-backend.onrender.com/api
```

### Frontend env

Create a `.env` file in the frontend app (or use Vercel environment variables) with:

```text
VITE_API_URL=https://rimonx-backend.onrender.com/api
```

### Vercel deployment

1. Import the frontend app into Vercel.
2. Set the `VITE_API_URL` environment variable to the Render backend URL.
3. Redeploy.

This keeps the browser app and API separated while preserving the SaaS flow.

## Security notes

- Passwords are hashed with bcrypt.
- JWTs are used for authenticated requests.
- Credit deductions are enforced by the backend to prevent frontend bypass.
- Duplicate export actions are prevented using unique operation ids.
