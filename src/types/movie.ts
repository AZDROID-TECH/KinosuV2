export interface Movie {
  id: number;
  title: string;
  poster: string;
  imdb_rating: number;
  user_rating: number;
  status: 'watchlist' | 'watching' | 'watched';
  imdb_id: string;
  created_at: string;
}

export interface SearchResult {
  imdbID: string;
  Title: string;
  Poster: string;
  imdbRating: string;
  Year: string;
  Genre: string;
}

export interface MovieData {
  title: string;
  imdb_id: string;
  poster: string;
  imdb_rating: number;
  status: 'watchlist' | 'watching' | 'watched';
  user_rating?: number;
  created_at: string;
} 