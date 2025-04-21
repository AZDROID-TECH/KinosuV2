import { Request, Response } from 'express';
import axios from 'axios';
import { TABLES, getClient } from '../utils/supabase';
import { getServiceClient } from '../utils/supabase';
import { logger } from '../utils/logger';

interface Movie {
  id: number;
  user_id: number;
  title: string;
  imdb_id: string;
  poster: string;
  imdb_rating: number;
  user_rating: number;
  status: 'watchlist' | 'watching' | 'watched';
  created_at: string;
}

interface IMDbMovie {
  Title: string;
  imdbID: string;
  Poster: string;
  imdbRating: string;
  Year: string;
  Genre: string;
}

const OMDB_API_KEY = process.env.VITE_OMDB_API_KEY || 'b567a8f1';

export const getMovies = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      logger.error('getMovies: İstifadəçi kimliyi yoxdur və ya etibarsızdır', { user: req.user });
      return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
    }

    const userId = req.user.userId;
    const client = getClient();

    const { data: movies, error } = await client
      .from(TABLES.MOVIES)
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      logger.error('Supabase sorğu xətası (getMovies):', error);
      return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
    }
    
    res.json(movies);
  } catch (error) {
    logger.error('Filmləri gətirərkən xəta:', error);
    res.status(500).json({ error: 'Filmləri gətirərkən xəta baş verdi' });
  }
};

export const searchMovies = async (req: Request, res: Response) => {
  try {
    const searchResponse = await axios.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${req.params.query}`);
    
    if (searchResponse.data.Search) {
      const detailedMovies = await Promise.all(
        searchResponse.data.Search.map(async (movie: IMDbMovie) => {
          const detailResponse = await axios.get(`http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movie.imdbID}`);
            return {
              ...movie,
              imdbRating: detailResponse.data.imdbRating,
              Year: detailResponse.data.Year,
              Genre: detailResponse.data.Genre
            };
        })
      );
      res.json({ Search: detailedMovies });
    } else {
      res.json({ Search: [] });
    }
  } catch (error) {
    logger.error('Film axtarışı zamanı xəta baş verdi', error);
    res.status(500).json({ error: 'Film axtarışı zamanı xəta baş verdi' });
  }
};

export const addMovie = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      logger.error('addMovie: İstifadəçi kimliyi yoxdur və ya etibarsızdır', { user: req.user });
      return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
    }

    const userId = req.user.userId;
    const { title, imdb_id, poster, imdb_rating, status } = req.body;
    const client = getClient();

    const { data, error } = await client
      .from(TABLES.MOVIES)
      .insert({
        user_id: userId,
        title,
        imdb_id,
        poster,
        imdb_rating,
        status,
        user_rating: 0
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Film əlavə edərkən Supabase xətası:', error);
      return res.status(500).json({ error: 'Film əlavə edilərkən xəta baş verdi' });
    }
    
    res.status(201).json(data);
  } catch (error) {
    logger.error('Film əlavə edilərkən xəta baş verdi', error);
    res.status(500).json({ error: 'Film əlavə edilərkən xəta baş verdi' });
  }
};

export const updateMovie = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      logger.error('updateMovie: İstifadəçi kimliyi yoxdur və ya etibarsızdır', { user: req.user });
      return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
    }

    const userId = req.user.userId;
    const movieId = req.params.id;
    const { status, user_rating } = req.body;
    const client = getClient();

    const updateData: any = {};
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (user_rating !== undefined) {
      updateData.user_rating = user_rating;
    }

    const { error } = await client
      .from(TABLES.MOVIES)
      .update(updateData)
      .eq('id', movieId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      logger.error('Film yeniləmə Supabase xətası:', error);
      return res.status(500).json({ error: 'Film yeniləmə zamanı xəta baş verdi' });
    }

    const { data: updatedMovieData, error: fetchError } = await client
      .from(TABLES.MOVIES)
      .select()
      .eq('id', movieId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
        logger.error('Güncellenmiş filmi getirme Supabase xətası:', fetchError);
        return res.status(500).json({ error: 'Film yeniləndi, amma məlumatları gətirmək olmadı.' });
    }
    
    res.json(updatedMovieData);
  } catch (error) {
    logger.error('Film yeniləmə zamanı xəta:', error);
    res.status(500).json({ error: 'Film yeniləmə zamanı xəta baş verdi' });
  }
};

export const deleteMovie = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      logger.error('deleteMovie: İstifadəçi kimliyi yoxdur və ya etibarsızdır', { user: req.user });
      return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
    }

    const userId = req.user.userId;
    const movieId = req.params.id;
    const client = getClient();

    const { error } = await client
      .from(TABLES.MOVIES)
      .delete()
      .eq('id', movieId)
      .eq('user_id', userId);
    
    if (error) {
      logger.error('Film silmə Supabase xətası:', error);
      return res.status(500).json({ error: 'Film silinərkən xəta baş verdi' });
    }
    
    res.json({ message: 'Film uğurla silindi' });
  } catch (error) {
    logger.error('Film silinərkən xəta baş verdi', error);
    res.status(500).json({ error: 'Film silinərkən xəta baş verdi' });
  }
};

/**
 * IMDB ID'yə görə istifadəçinin filmlərini gətir
 * @param req Express request 
 * @param res Express response
 */
export const getMoviesByImdbId = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      logger.error('getMoviesByImdbId: İstifadəçi kimliyi yoxdur və ya etibarsızdır', { user: req.user });
      res.status(401).json({ error: 'İstifadəçi tapılmadı' });
      return;
    }

    const userId = req.user.userId;
    const { imdbId } = req.params;
    
    if (!imdbId) {
      logger.error('getMoviesByImdbId: IMDB ID parametri yoxdur');
      res.status(400).json({ error: 'IMDB ID tələb olunur' });
      return;
    }
    
    const client = getClient();
    
    const { data: movies, error } = await client
      .from(TABLES.MOVIES)
      .select('*')
      .eq('user_id', userId)
      .eq('imdb_id', imdbId);
    
    if (error) {
      logger.error(`IMDB ID ilə film axtarışında Supabase xətası: ${error.message}`);
      res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
      return;
    }
    
    if (!movies || movies.length === 0) {
      res.status(404).json({ error: 'Film tapılmadı' });
      return;
    }
    
    res.status(200).json(movies);
  } catch (error) {
    logger.error(`IMDB ID ilə film axtarışı zamanı xəta: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Daxili server xətası' });
  }
};

/**
 * IMDB ID'yə görə filmə verilən bütün istifadəçi reytinqləri əldə et
 * @param req Express request 
 * @param res Express response
 */
export const getRatingsByImdbId = async (req: Request, res: Response): Promise<void> => {
  const { imdbId } = req.params;
  
  if (!imdbId) {
    res.status(400).json({ error: 'IMDB ID tələb olunur' });
    return;
  }
  
  try {
    // Service client ilə RLS siyasətlərini bypass et
    const supabase = getServiceClient();
    
    // İlk olaraq təqdim edilən IMDB ID ilə bütün filmləri tap
    const { data: movies, error: moviesError } = await supabase
      .from(TABLES.MOVIES)
      .select('id, user_id, user_rating')
      .eq('imdb_id', imdbId);
    
    if (moviesError) {
      logger.error(`Filmlər əldə edilərkən xəta: ${moviesError.message}`);
      res.status(500).json({ error: 'Reytinqlər əldə edilərkən xəta baş verdi' });
      return;
    }
    
    if (!movies || movies.length === 0) {
      res.status(404).json({ error: 'Film tapılmadı' });
      return;
    }
    
    // user_id və user_rating əhatə edən massiv qaytarın
    const ratings = movies.map(movie => ({
      user_id: movie.user_id,
      user_rating: movie.user_rating
    }));
    
    res.status(200).json(ratings);
  } catch (error) {
    logger.error(`Reytinqlər əldə edilərkən xəta: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Daxili server xətası' });
  }
}; 