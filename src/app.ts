import express from 'express'
import authRoutes from './routes/auth.routes'
import postsRoutes from './routes/posts.routes'

const app = express()

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/posts', postsRoutes)

export default app