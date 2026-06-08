import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../lib/jwt'

// Set the secrets before tests run since jwt.ts reads them at import time
beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
  process.env.JWT_ACCESS_EXPIRES_IN = '15m'
  process.env.JWT_REFRESH_EXPIRES_IN = '7d'
})

describe('JWT utilities', () => {
  const payload = { userId: 'test-user-id', role: 'USER' }

  describe('signAccessToken / verifyAccessToken', () => {
    it('signs and verifies a valid access token', () => {
      const token = signAccessToken(payload)
      const decoded = verifyAccessToken(token)

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.role).toBe(payload.role)
    })

    it('throws when verifying a tampered access token', () => {
      const token = signAccessToken(payload)
      const tampered = token.slice(0, -5) + 'xxxxx'

      expect(() => verifyAccessToken(tampered)).toThrow()
    })

    it('throws when verifying an access token with the wrong secret', () => {
      // Sign with refresh secret, try to verify as access token
      const token = signRefreshToken(payload)

      expect(() => verifyAccessToken(token)).toThrow()
    })
  })

  describe('signRefreshToken / verifyRefreshToken', () => {
    it('signs and verifies a valid refresh token', () => {
      const token = signRefreshToken(payload)
      const decoded = verifyRefreshToken(token)

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.role).toBe(payload.role)
    })

    it('throws when verifying a tampered refresh token', () => {
      const token = signRefreshToken(payload)
      const tampered = token.slice(0, -5) + 'xxxxx'

      expect(() => verifyRefreshToken(tampered)).toThrow()
    })
  })
})