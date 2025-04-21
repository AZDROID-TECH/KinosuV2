import { Request, Response } from 'express';
import { TABLES, getClient } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid'; // UUID oluşturmak için
import axios from 'axios'; // OMDb API için

// Bütün ümumi şərhləri gətir (film ID-sinə görə)
export const getComments = async (req: Request, res: Response) => {
  try {
    const { movieId } = req.query;
    const requestingUserId = req.user?.userId; // İstek yapan kullanıcının ID'si (varsa)

    if (!movieId) {
      return res.status(400).json({ error: 'Film ID tələb olunur' });
    }

    const client = getClient();
    
    // 1. Təsdiqlənmiş şərhləri və yazar məlumatlarını gətir
    const { data: comments, error: commentsError } = await client
      .from(TABLES.COMMENTS)
      .select(`
        *,
        author:user_id (
          username,
          avatar_url
        )
      `)
      .eq('movie_imdb_id', movieId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (commentsError) {
       console.error('Şərhləri gətirmə xətası (DB):', commentsError);
       throw commentsError;
    }

    // 2. Əgər istifadəçi giriş edibsə və şərhlər varsa, onun səslərini gətir
    if (requestingUserId && comments && comments.length > 0) {
        const commentIds = comments.map(c => c.id);
        
        const { data: votes, error: votesError } = await client
            .from('comment_votes')
            .select('comment_id, vote_type') // Sadece gerekli alanları seçtiğimizden emin olalım
            .eq('user_id', requestingUserId)
            .in('comment_id', commentIds);
            
        if (votesError) {
            console.error("İstifadəçi səslərini gətirmə xətası:", votesError);
            // Xəta olsa belə şərhləri göndər, amma səslər olmayacaq
            return res.status(200).json(comments || []);
        }
        
        // Səsləri şərh obyektlərinə əlavə et
        const commentsWithVotes = comments.map(comment => {
            const userVote = votes.find(vote => vote.comment_id === comment.id);
            const finalUserVote = userVote ? userVote.vote_type as ('like' | 'dislike') : null;
            return {
                ...comment,
                user_vote: finalUserVote
            };
        });
        
        return res.status(200).json(commentsWithVotes || []);
        
    } else {
        // Giriş edilməyibsə və ya şərh yoxdursa, səslər olmadan göndər
        return res.status(200).json(comments || []);
    }

  } catch (error: any) {
    console.error('Şərhləri gətirmə xətası (Genel):', error.message);
    return res.status(500).json({ error: 'Şərhləri gətirərkən xəta baş verdi' });
  }
};

// Yeni şərh əlavə et
export const addComment = async (req: Request, res: Response) => {
  try {
    const { content, movieId, parentId } = req.body;
    
    if (!content || !movieId) {
      return res.status(400).json({ error: 'Məzmun və film ID tələb olunur' });
    }

    // User ID kontrolü - auth middleware tarafından req.user.userId olarak eklenir
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'İstifadəçi doğrulanmayıb' });
    }

    // Sadece mevcut kullanıcının ID'sini kullanın
    // Supabase'de foreign key kısıtlaması olduğu için, 
    // bu ID users tablosunda var olmalı

    // Movie ID formatını kontrol et - IMDb ID'leri (tt12345678) string'dir, UUID değil
    if (typeof movieId !== 'string') {
      return res.status(400).json({ error: 'Film ID düzgün formatda deyil' });
    }

    const client = getClient();
    
    // Yeni şərh əlavə et (dərhal təsdiqlənmiş və ya gözləyən ola bilər)
    const newComment = {
      content,
      movie_imdb_id: movieId, // IMDb ID doğru formatta olmalı (tt12345678)
      user_id: userId, // Kullanıcının gerçek ID'sini kullanın (jwt'den alınan)
      parent_comment_id: parentId || null,
      status: 'pending', // yeni şərhlər ilk olaraq gözləmə rejimində
      likes: 0,
      dislikes: 0
    };

    const { data, error } = await client
      .from(TABLES.COMMENTS)
      .insert([newComment])
      .select()
      .single();

    if (error) {
      console.error('Şərh əlavə etmə SQL xətası:', error);
      
      if (error.code === '23503' && error.message.includes('violates foreign key constraint')) {
        // Bu, user_id'nin users tablosunda olmadığını gösterir
        return res.status(400).json({ 
          error: 'İstifadəçi hesabınız sistemimizdə tam təsdiqlənməyib. Zəhmət olmasa, çıxış edib yenidən daxil olun.',
          details: 'Sistemə yenidən daxil olmaq bu problemi həll edə bilər.'
        });
      }
      
      throw error;
    }
    
    return res.status(201).json({ 
      message: 'Şərhiniz uğurla əlavə edildi və təsdiq gözləyir',
      comment: data
    });
  } catch (error: any) {
    console.error('Şərh əlavə etmə xətası:', error.message);
    return res.status(500).json({ error: 'Şərh əlavə edərkən xəta baş verdi' });
  }
};

// Şərhə səs ver (like/dislike)
export const voteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { voteType } = req.body;
    const votingUserId = req.user?.userId;

    if (!votingUserId) {
      return res.status(401).json({ error: 'Oy vermək üçün daxil olun' });
    }
    
    if (!commentId || !voteType || !['like', 'dislike'].includes(voteType)) {
      return res.status(400).json({ error: 'Düzgün şərh ID və səs növü tələb olunur' });
    }

    const client = getClient();
    
    // Şərhi və yazarını yoxla
    const { data: comment, error: commentError } = await client
      .from(TABLES.COMMENTS)
      .select('id, likes, dislikes, user_id') // yazarın user_id'sini de al
      .eq('id', commentId)
      .single();
    
    if (commentError) {
      return res.status(404).json({ error: 'Şərh tapılmadı' });
    }
    
    // Öz şərhinə səs verməni əngəllə
    if (comment.user_id === votingUserId) {
        return res.status(403).json({ error: 'Öz şərhinizə səs verə bilməzsiniz.' });
    }
    
    // İstifadəçinin əvvəlki səsini yoxla
    const { data: existingVote, error: voteError } = await client
      .from('comment_votes')
      .select('vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', votingUserId)
      .maybeSingle();
      
    if (voteError) {
        console.error("Mövcud səs yoxlama xətası:", voteError);
        return res.status(500).json({ error: 'Səs verərkən xəta baş verdi.' });
    }

    let newLikes = comment.likes;
    let newDislikes = comment.dislikes;
    let newUserVote: 'like' | 'dislike' | null = null;
    let message = '';

    if (existingVote) {
        // Mövcud səs varsa
        if (existingVote.vote_type === voteType) {
            // Eyni düyməyə təkrar basılıb (səsi ləğv et)
            if (voteType === 'like') newLikes--;
            else newDislikes--;
            newUserVote = null;
            message = 'Səs ləğv edildi';
            
            await client
                .from('comment_votes')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', votingUserId);
                
        } else {
            // Səs dəyişdirilir (like -> dislike və ya əksi)
            if (voteType === 'like') {
                newLikes++;
                newDislikes--; // Əvvəlki dislike ləğv edildi
            } else {
                newDislikes++;
                newLikes--; // Əvvəlki like ləğv edildi
            }
            newUserVote = voteType;
            message = 'Səs dəyişdirildi';
            
            await client
                .from('comment_votes')
                .update({ vote_type: voteType })
                .eq('comment_id', commentId)
                .eq('user_id', votingUserId);
        }
    } else {
        // Yeni səs
        if (voteType === 'like') newLikes++;
        else newDislikes++;
        newUserVote = voteType;
        message = 'Səs uğurla qeydə alındı';
        
        await client
            .from('comment_votes')
            .insert({
                comment_id: commentId,
                user_id: votingUserId,
                vote_type: voteType
            });
    }

    // Şərhin like/dislike saylarını yenilə
    const { error: updateCommentError } = await client
      .from(TABLES.COMMENTS)
      .update({ likes: newLikes, dislikes: newDislikes })
      .eq('id', commentId);
      
     if (updateCommentError) {
         console.error("Şərh sayğaclarını yeniləmə xətası:", updateCommentError);
         // Səs əməliyyatı qismən uğurlu olsa da, xəta döndərə bilərik
         // Və ya sadece loglayıp devam edebiliriz
         return res.status(500).json({ error: 'Səs sayğacları yenilənərkən xəta baş verdi.' });
     }
    
    return res.status(200).json({ 
      message: message,
      likes: newLikes,
      dislikes: newDislikes,
      user_vote: newUserVote // Kullanıcının son oy durumunu döndür
    });

  } catch (error: any) {
    console.error('Şərhə səs vermə xətası:', error.message);
    return res.status(500).json({ error: 'Şərhə səs verərkən xəta baş verdi' });
  }
};

// --- Admin Kontrolcuları ---

// Gözləyən şərhləri gətir (admin üçün)
export const getPendingComments = async (req: Request, res: Response) => {
  try {
    const client = getClient();
    const OMDB_API_KEY = process.env.VITE_OMDB_API_KEY || "YOUR_OMDB_API_KEY"; // API Anahtarını al
    
    // Gözləyən şərhləri gətir - users tablosundan yazar adı və avatarını da al
    const { data: comments, error } = await client
      .from(TABLES.COMMENTS)
      .select(`
        *,
        author:user_id (
          username,
          avatar_url
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
       console.error('Gözləyən şərhləri gətirmə xətası (DB):', error);
       throw error;
    }
    
    // Film başlıklarını almak için OMDb API çağrıları (performansa dikkat!)
    if (comments && comments.length > 0 && OMDB_API_KEY !== "YOUR_OMDB_API_KEY") {
        const movieTitlePromises = comments.map(async (comment) => {
            try {
                 const omdbRes = await axios.get(`https://www.omdbapi.com/?i=${comment.movie_imdb_id}&apikey=${OMDB_API_KEY}`);
                 if (omdbRes.data && omdbRes.data.Response === "True") {
                     return { ...comment, movieTitle: omdbRes.data.Title };
                 } else {
                    console.warn(`OMDb xətası (${comment.movie_imdb_id}): ${omdbRes.data.Error}`);
                    return { ...comment, movieTitle: null }; // Başlık alınamadı
                 }
            } catch (omdbError: any) {
                 console.error(`OMDb API çağırışı xətası (${comment.movie_imdb_id}):`, omdbError.message);
                 return { ...comment, movieTitle: null }; // Başlık alınamadı
            }
        });
        
        const commentsWithTitles = await Promise.all(movieTitlePromises);
        return res.status(200).json(commentsWithTitles || []);
    } else {
        if (OMDB_API_KEY === "YOUR_OMDB_API_KEY") {
            console.warn("OMDb API Anahtarı konfiqurasiya edilmədiyi üçün film başlıqları çəkilə bilmir.");
        }
        return res.status(200).json(comments || []); // Başlıklar olmadan döndür
    }

  } catch (error: any) {
    console.error('Gözləyən şərhləri gətirmə xətası (Genel):', error.message);
    return res.status(500).json({ error: 'Gözləyən şərhləri gətirərkən xəta baş verdi' });
  }
};

// Şərhi təsdiqlə (admin üçün)
export const approveComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    if (!commentId) {
      return res.status(400).json({ error: 'Şərh ID tələb olunur' });
    }

    const client = getClient();
    
    // Şərhi təsdiqlə
    const { data, error } = await client
      .from(TABLES.COMMENTS)
      .update({ status: 'approved' })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Şərh tapılmadı və ya artıq təsdiqlənib' });
    }
    
    return res.status(200).json({ 
      message: 'Şərh uğurla təsdiqləndi',
      comment: data
    });
  } catch (error: any) {
    console.error('Şərhi təsdiqləmə xətası:', error.message);
    return res.status(500).json({ error: 'Şərhi təsdiqləyərkən xəta baş verdi' });
  }
};

// Şərhi rədd et (admin üçün)
export const rejectComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    if (!commentId) {
      return res.status(400).json({ error: 'Şərh ID tələb olunur' });
    }

    const client = getClient();
    
    // Şərhi rədd et
    const { data, error } = await client
      .from(TABLES.COMMENTS)
      .update({ status: 'rejected' })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Şərh tapılmadı və ya artıq rədd edilib' });
    }
    
    return res.status(200).json({ 
      message: 'Şərh uğurla rədd edildi',
      comment: data
    });
  } catch (error: any) {
    console.error('Şərhi rədd etmə xətası:', error.message);
    return res.status(500).json({ error: 'Şərhi rədd edərkən xəta baş verdi' });
  }
};

// Şərhi sil (admin üçün)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    
    if (!commentId) {
      return res.status(400).json({ error: 'Şərh ID tələb olunur' });
    }

    const client = getClient();
    
    // Şərhi sil
    const { error } = await client
      .from(TABLES.COMMENTS)
      .delete()
      .eq('id', commentId);

    if (error) {
      return res.status(404).json({ error: 'Şərh tapılmadı və ya silinə bilmədi' });
    }
    
    return res.status(200).json({ 
      message: 'Şərh uğurla silindi'
    });
  } catch (error: any) {
    console.error('Şərhi silmə xətası:', error.message);
    return res.status(500).json({ error: 'Şərhi silməyə çalışarkən xəta baş verdi' });
  }
};

// Bir istifadəçinin bütün şərhlərini gətir (admin üçün)
export const getCommentsByUserIdAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const targetUserId = parseInt(userId, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Keçərli istifadəçi ID tələb olunur' });
    }

    const client = getClient();

    // İstifadəçinin şərhlərini və yazar məlumatlarını gətir
    // Film başlığını gətirmə (müvəqqəti olaraq) silindi (DB-də foreign key əlaqəsi yoxdur)
    const { data: comments, error: commentsError } = await client
      .from(TABLES.COMMENTS)
      .select(`
        *,
        author:user_id (
          username,
          avatar_url
        )
        /* // <-- Film başlığı gətirmə silindi
        , 
        movie:movie_imdb_id (
          title
        ) 
        */
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error(`İstifadəçi #${targetUserId} şərhlərini gətirmə xətası (DB):`, commentsError);
      throw commentsError;
    }
    
    // Formatlama artıq lazım deyil, çünki movieTitle gəlmir
    // const formattedComments = comments?.map(comment => ({
    //   ...comment,
    //   movieTitle: comment.movie?.title || null 
    // })) || [];

    return res.status(200).json(comments || []); // Birbaşa comments qaytarılır

  } catch (error: any) {
    console.error('İstifadəçi şərhlərini gətirmə xətası (Admin - Genel):', error.message);
    return res.status(500).json({ error: 'Şərhlər gətirilərkən xəta baş verdi' });
  }
}; 