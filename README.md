# REST API with Full Authentication

A production-deployed REST API built with Node.js, Express, and TypeScript, featuring a secure JWT authentication system with role-based access control, refresh token rotation, and rate limiting.

**Live URL:** `https://web-production-e9f5f.up.railway.app`

---

## Security Features

### JWT Authentication
- **Short-lived access tokens** (15 min) minimize exposure if a token is intercepted — attackers have a narrow window before the token expires
- **Long-lived refresh tokens** (7 days) are stored in the database, enabling **server-side revocation** on logout — unlike stateless JWTs, these can be explicitly invalidated
- **Dual secret signing** — access and refresh tokens are signed with separate secrets, so a compromised access token secret cannot be used to forge refresh tokens

### Password Security
- Passwords are hashed with **bcrypt** (12 salt rounds) before storage — the plaintext password never touches the database
- **Timing-safe comparison** via `bcrypt.compare` prevents timing attacks where an attacker could infer password validity from response time differences
- **Generic error messages** on login failure (`"Invalid credentials"`) regardless of whether the email or password is wrong — prevents user enumeration

### Role-Based Access Control (RBAC)
- Two-tier role system: `USER` and `ADMIN`
- **401 vs 403 distinction** — unauthenticated requests return 401, authenticated but unauthorized requests return 403
- Resource ownership enforcement — users can only read and modify their own data; admin role required for destructive operations

### Rate Limiting
- **Login endpoint**: 10 requests per IP per 15 minutes — makes brute force attacks computationally expensive
- **Global limiter**: 100 requests per IP per 15 minutes — prevents general API abuse

### Input Validation
- All endpoints validate required fields and return explicit 400 errors on missing or malformed input
- Minimum password length enforced at registration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 + TypeScript |
| Framework | Express |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Rate Limiting | `express-rate-limit` |
| Testing | Jest + Supertest |
| Deployment | Railway |

---

## API Reference

### Auth

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | No | Register a new user |
| POST | `/auth/login` | No | Login and receive access + refresh tokens |
| POST | `/auth/refresh` | No | Exchange refresh token for new access token |
| POST | `/auth/logout` | No | Invalidate refresh token |

### Posts

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/posts` | Yes | USER | Get all posts (own posts; admins see all) |
| GET | `/posts/:id` | Yes | USER | Get a single post |
| POST | `/posts` | Yes | USER | Create a post |
| PUT | `/posts/:id` | Yes | USER | Update own post |
| DELETE | `/posts/:id` | Yes | ADMIN | Delete any post |

All protected routes require an `Authorization: Bearer <token>` header with a valid access token.

---

## Architecture

```
src/
├── controllers/        # Request handlers — business logic
│   ├── auth.controller.ts
│   └── posts.controller.ts
├── middleware/         # Express middleware
│   ├── auth.middleware.ts      # JWT verification + role guards
│   └── rate-limit.middleware.ts
├── routes/             # Route definitions
│   ├── auth.routes.ts
│   └── posts.routes.ts
├── lib/
│   ├── jwt.ts          # Token signing and verification
│   └── prisma.ts       # Prisma client singleton
└── __tests__/
    ├── unit/           # JWT utility tests
    └── integration/    # Full HTTP route tests
```

---

## Running Locally

### Prerequisites
- Node.js 22+
- Docker (for local PostgreSQL)

### Setup

```bash
# Clone the repo
git clone https://github.com/nickyojay/rest-api-auth
cd rest-api-auth

# Install dependencies
npm install

# Start the database
docker compose up -d

# Configure environment
cp .env.example .env
# Fill in JWT secrets — generate with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Run migrations
npm run migrate

# Start the dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `7d`) |
| `PORT` | Server port (default: `3000`) |

---

## Testing

```bash
# Run the full test suite (24 tests)
npm test
```

Tests cover:
- JWT signing, verification, and tamper detection
- Auth flow: register, login, refresh, logout
- Protected route access control
- RBAC enforcement (401 vs 403)
- Refresh token invalidation after logout

---

## Deployment

Deployed on **Railway** with a managed PostgreSQL instance. Migrations run automatically on each deploy via `prisma migrate deploy` before the server starts.