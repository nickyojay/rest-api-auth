import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

export const getPosts = async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!

  const posts = await prisma.post.findMany({
    where: role === 'ADMIN' ? {} : { authorId: userId },
    orderBy: { createdAt: 'desc' },
  })

  res.json(posts)
}

export const getPost = async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!
  const id = req.params['id'] as string

  const post = await prisma.post.findUnique({ where: { id } })

  if (!post) {
    res.status(404).json({ error: 'Post not found' })
    return
  }

  if (role !== 'ADMIN' && post.authorId !== userId) {
    res.status(403).json({ error: 'Insufficient permissions' })
    return
  }

  res.json(post)
}

export const createPost = async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!
  const { title, body } = req.body

  if (!title || !body) {
    res.status(400).json({ error: 'Title and body are required' })
    return
  }

  const post = await prisma.post.create({
    data: { title, body, authorId: userId },
  })

  res.status(201).json(post)
}

export const updatePost = async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!
  const id = req.params['id'] as string
  const { title, body } = req.body

  const post = await prisma.post.findUnique({ where: { id } })

  if (!post) {
    res.status(404).json({ error: 'Post not found' })
    return
  }

  if (post.authorId !== userId) {
    res.status(403).json({ error: 'Insufficient permissions' })
    return
  }

  const updated = await prisma.post.update({
    where: { id },
    data: { title, body },
  })

  res.json(updated)
}

export const deletePost = async (req: AuthRequest, res: Response) => {
  const id = req.params['id'] as string

  const post = await prisma.post.findUnique({ where: { id } })

  if (!post) {
    res.status(404).json({ error: 'Post not found' })
    return
  }

  await prisma.post.delete({ where: { id } })

  res.json({ message: 'Post deleted' })
}