import request from 'supertest'
import app from '../../app'
import { cleanDatabase, testPrisma } from '../helpers'

let accessToken: string
let postId: string

// Before each test, wipe the DB, register a user, log in,
// and create a post so we have something to work with
beforeEach(async () => {
  await cleanDatabase()

  await request(app)
    .post('/auth/register')
    .send({ email: 'test@example.com', password: 'password123' })

  const login = await request(app)
    .post('/auth/login')
    .send({ email: 'test@example.com', password: 'password123' })

  accessToken = login.body.accessToken

  const post = await request(app)
    .post('/posts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ title: 'Test post', body: 'Test body' })

  postId = post.body.id
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

describe('GET /posts', () => {
  it('returns posts for authenticated user', async () => {
    const res = await request(app)
      .get('/posts')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(1)
  })

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/posts')

    expect(res.status).toBe(401)
  })
})

describe('GET /posts/:id', () => {
  it('returns the post for its author', async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(postId)
  })

  it('returns 404 for a non-existent post', async () => {
    const res = await request(app)
      .get('/posts/non-existent-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(404)
  })
})

describe('POST /posts', () => {
  it('creates a post and returns 201', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'New post', body: 'New body' })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('New post')
    expect(res.body.authorId).toBeDefined()
  })

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ body: 'No title here' })

    expect(res.status).toBe(400)
  })
})

describe('PUT /posts/:id', () => {
  it('updates a post successfully', async () => {
    const res = await request(app)
      .put(`/posts/${postId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated', body: 'Updated body' })

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Updated')
  })

  it('returns 403 when updating another user\'s post', async () => {
    // Register and log in as a second user
    await request(app)
      .post('/auth/register')
      .send({ email: 'other@example.com', password: 'password123' })

    const other = await request(app)
      .post('/auth/login')
      .send({ email: 'other@example.com', password: 'password123' })

    const res = await request(app)
      .put(`/posts/${postId}`)
      .set('Authorization', `Bearer ${other.body.accessToken}`)
      .send({ title: 'Hijacked', body: 'Hijacked body' })

    expect(res.status).toBe(403)
  })
})

describe('DELETE /posts/:id', () => {
  it('returns 403 for a regular user', async () => {
    const res = await request(app)
      .delete(`/posts/${postId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(403)
  })
})