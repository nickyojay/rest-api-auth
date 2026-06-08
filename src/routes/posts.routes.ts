import { Router } from 'express'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware'
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/posts.controller'

const router = Router()

router.get('/', authenticate, (req, res) => getPosts(req as AuthRequest, res))
router.get('/:id', authenticate, (req, res) => getPost(req as AuthRequest, res))
router.post('/', authenticate, (req, res) => createPost(req as AuthRequest, res))
router.put('/:id', authenticate, (req, res) => updatePost(req as AuthRequest, res))
router.delete('/:id', authenticate, requireRole(['ADMIN']), (req, res) => deletePost(req as AuthRequest, res))

export default router