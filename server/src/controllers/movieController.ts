import { Request, Response } from 'express';
import axios from 'axios';
import { TABLES, getClient } from '../utils/supabase';

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
      console.error('getMovies: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
      return res.status(401).json({ error: 'İstifadəçi tapılmadı' });
    }

    const userId = req.user.userId;
    const client = getClient();

    const { data: movies, error } = await client
      .from(TABLES.MOVIES)
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Supabase sorğu xətası:', error);
      return res.status(500).json({ error: 'Verilənlər bazası sorğusunda xəta baş verdi' });
    }
    
    res.json(movies);
  } catch (error) {
    console.error('Filmləri gətirərkən xəta:', error);
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
    res.status(500).json({ error: 'Film axtarışı zamanı xəta baş verdi' });
  }
};

export const addMovie = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      console.error('addMovie: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
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
      console.error('Film əlavə edərkən Supabase xətası:', error);
      return res.status(500).json({ error: 'Film əlavə edilərkən xəta baş verdi' });
    }
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Film əlavə edilərkən xəta baş verdi' });
  }
};

export const updateMovie = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      console.error('updateMovie: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
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
      console.error('Film yeniləmə Supabase xətası:', error);
      return res.status(500).json({ error: 'Film yeniləmə zamanı xəta baş verdi' });
    }

    const { data: updatedMovieData, error: fetchError } = await client
      .from(TABLES.MOVIES)
      .select()
      .eq('id', movieId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
        console.error('Güncellenmiş filmi getirme Supabase xətası:', fetchError);
        return res.status(500).json({ error: 'Film yeniləndi, amma məlumatları gətirmək olmadı.' });
    }
    
    res.json(updatedMovieData);
  } catch (error) {
    console.error('Film yeniləmə zamanı xəta:', error);
    res.status(500).json({ error: 'Film yeniləmə zamanı xəta baş verdi' });
  }
};

export const deleteMovie = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      console.error('deleteMovie: İstifadəçi kimliyi yok veya geçersiz', { user: req.user });
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
      console.error('Film silmə Supabase xətası:', error);
      return res.status(500).json({ error: 'Film silinərkən xəta baş verdi' });
    }
    
    res.json({ message: 'Film uğurla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Film silinərkən xəta baş verdi' });
  }
}; 