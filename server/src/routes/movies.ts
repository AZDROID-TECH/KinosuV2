import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getMovies,
  searchMovies,
  addMovie,
  updateMovie,
  deleteMovie
} from '../controllers/movieController';

const router = express.Router();

router.get('/', authenticateToken, getMovies);
router.get('/search/:query', authenticateToken, searchMovies);
router.post('/', authenticateToken, addMovie);
router.put('/:id', authenticateToken, updateMovie);
router.delete('/:id', authenticateToken, deleteMovie);

export default router; 