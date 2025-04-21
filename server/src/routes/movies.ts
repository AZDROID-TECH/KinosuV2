import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getMovies,
  searchMovies,
  addMovie,
  updateMovie,
  deleteMovie,
  getMoviesByImdbId,
  getRatingsByImdbId
} from '../controllers/movieController';

const router = express.Router();

router.get('/', authenticateToken, getMovies);
router.get('/search/:query', authenticateToken, searchMovies);
router.post('/', authenticateToken, addMovie);
router.put('/:id', authenticateToken, updateMovie);
router.delete('/:id', authenticateToken, deleteMovie);
router.get('/ratings-by-imdb/:imdbId', getRatingsByImdbId);
router.get('/imdb/:imdbId', authenticateToken, getMoviesByImdbId);

export default router; 