import express from 'express'
import authRoutes from './routes/auth.routes'
import postsRoutes from './routes/posts.routes'
import { globalLimiter } from './middleware/rate-limit.middleware'

const app = express()

app.use(express.json())

// Apply the global rate limiter to every route
app.use(globalLimiter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/posts', postsRoutes)

export default app