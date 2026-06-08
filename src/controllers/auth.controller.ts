import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/jwt'

const SALT_ROUNDS = 12

// POST /auth/register
// Creates a new user. We hash the password before storing it —
// the raw password never touches the database.
export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'Email already in use' })
    return
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const user = await prisma.user.create({
    data: { email, passwordHash },
  })

  res.status(201).json({ message: 'User created', userId: user.id })
}

// POST /auth/login
// Verifies credentials and returns both an access token (short-lived,
// used on every request) and a refresh token (long-lived, used only
// to get new access tokens when they expire).
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const payload = { userId: user.id, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Store the refresh token in the DB so we can validate
  // and revoke it later
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  })

  res.json({ accessToken, refreshToken })
}

// POST /auth/refresh
// The client sends their refresh token when their access token
// expires. We check it exists in the DB (not revoked) and hasn't
// expired, then issue a fresh access token.
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' })
    return
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  })

  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ error: 'Invalid or expired refresh token' })
    return
  }

  const payload = verifyRefreshToken(refreshToken)
  const accessToken = signAccessToken({
    userId: payload.userId,
    role: payload.role,
  })

  res.json({ accessToken })
}

// POST /auth/logout
// Deletes the refresh token from the DB. Even if someone steals
// the refresh token after this point, it won't work because it
// no longer exists in the database.
export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' })
    return
  }

  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  })

  res.json({ message: 'Logged out successfully' })
}