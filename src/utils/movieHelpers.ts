import { Movie } from '../types/movie';

export const sortMovies = (movies: Movie[], sortType: string) => {
  switch(sortType) {
    case 'newest':
      return movies.sort((a, b) => b.id - a.id);
    case 'oldest':
      return movies.sort((a, b) => a.id - b.id);
    case 'rating_high':
      return movies.sort((a, b) => (b.imdb_rating || 0) - (a.imdb_rating || 0));
    case 'rating_low':
      return movies.sort((a, b) => (a.imdb_rating || 0) - (b.imdb_rating || 0));
    case 'user_rating_high':
      return movies.sort((a, b) => (b.user_rating || 0) - (a.user_rating || 0));
    case 'user_rating_low':
      return movies.sort((a, b) => (a.user_rating || 0) - (b.user_rating || 0));
    default:
      return movies;
  }
};

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Tarix məlum deyil';
    
    // Bakü saat dilimini ayarla (UTC+4)
    const bakuDate = new Date(date.getTime() + (4 * 60 * 60 * 1000));
    
    const day = bakuDate.getDate();
    const year = bakuDate.getFullYear();
    const hours = bakuDate.getHours().toString().padStart(2, '0');
    const minutes = bakuDate.getMinutes().toString().padStart(2, '0');

    // Azerbaycan ayları
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    const month = months[bakuDate.getMonth()];

    return `${day} ${month} ${year} ${hours}:${minutes}`;
  } catch (error) {
    return 'Tarix məlum deyil';
  }
};

export const getSortLabel = (value: string) => {
  switch(value) {
    case 'newest':
      return 'Ən yeni';
    case 'oldest':
      return 'Ən köhnə';
    case 'rating_high':
      return 'IMDb reytinqi (yüksək)';
    case 'rating_low':
      return 'IMDb reytinqi (aşağı)';
    case 'user_rating_high':
      return 'İstifadəçi reytinqi (yüksək)';
    case 'user_rating_low':
      return 'İstifadəçi reytinqi (aşağı)';
    default:
      return 'Ən yeni';
  }
}; 