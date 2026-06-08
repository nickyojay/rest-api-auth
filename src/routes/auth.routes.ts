import { Router } from 'express'
import { register, login, refresh, logout } from '../controllers/auth.controller'
import { loginLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

router.post('/register', register)
router.post('/login', loginLimiter, login)
router.post('/refresh', refresh)
router.post('/logout', logout)

export default router