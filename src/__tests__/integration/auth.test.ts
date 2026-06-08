import request from 'supertest'
import app from '../../app'
import { cleanDatabase, testPrisma } from '../helpers'

// Clean the database before each test so tests don't affect each other
beforeEach(async () => {
  await cleanDatabase()
})

// Close the Prisma connection after all tests finish
afterAll(async () => {
  await testPrisma.$disconnect()
})

describe('POST /auth/register', () => {
  it('creates a new user and returns 201', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.message).toBe('User created')
    expect(res.body.userId).toBeDefined()
  })

  it('returns 409 when email is already registered', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Email already in use')
  })

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'short' })

    expect(res.status).toBe(400)
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ password: 'password123' })

    expect(res.status).toBe(400)
  })
})

describe('POST /auth/login', () => {
  beforeEach(async () => {
    // Create a user to log in with
    await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
  })

  it('returns access and refresh tokens on valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.refreshToken).toBeDefined()
  })

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns 401 on non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })
})

describe('POST /auth/refresh', () => {
  it('returns a new access token with a valid refresh token', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeDefined()
  })

  it('returns 401 with an invalid refresh token', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'not-a-real-token' })

    expect(res.status).toBe(401)
  })
})

describe('POST /auth/logout', () => {
  it('invalidates the refresh token', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    const { refreshToken } = login.body

    // Logout
    const logout = await request(app)
      .post('/auth/logout')
      .send({ refreshToken })

    expect(logout.status).toBe(200)

    // Try to use the refresh token again — should fail
    const refresh = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })

    expect(refresh.status).toBe(401)
  })
})