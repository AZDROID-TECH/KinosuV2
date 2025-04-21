import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { Comment, getComments } from '../../services/commentService';
import CommentItem from './CommentItem';
import styles from './Comments.module.css';

interface CommentListProps {
    movieId: string; // movie_imdb_id
    // Realtime güncellemeleri tetiklemek için bir key (opsiyonel)
    refreshKey?: number; 
}

const CommentList: React.FC<CommentListProps> = ({ movieId, refreshKey }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Yorumları getirme fonksiyonu
    const fetchComments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedComments = await getComments(movieId);
            // Yorumları ana yorumlar ve yanıtlar olarak yapılandırmak gerekebilir
            // Şimdilik düz liste varsayalım, CommentItem içinde level ile girinti yapılıyor
            setComments(fetchedComments);
        } catch (err: any) {
            setError(err?.message || 'Şərhlər yüklənərkən xəta baş verdi.');
        } finally {
            setLoading(false);
        }
    }, [movieId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments, refreshKey]); // movieId veya refreshKey değişince yeniden yükle

    // Oy değişikliğini state'e yansıtma
    const handleVoteChange = useCallback((commentId: number, newLikes: number, newDislikes: number, newUserVote: 'like' | 'dislike' | null) => {
        
        setComments(currentComments => { // Önceki state'i al
            // Güncellenmiş yorumu içeren yeni bir dizi oluştur
            const updatedComments = currentComments.map(c => {
                if (c.id === commentId) {
                     const updatedComment = {
                         ...c,
                         likes: newLikes,
                         dislikes: newDislikes,
                         user_vote: newUserVote
                     };
                     return updatedComment;
                }
                return c;
            });
            // Tamamen yeni bir dizi referansı döndür
            return updatedComments;
        });

    }, []); // Bağımlılık dizisi boş kalabilir, çünkü setComments stabil

    // Silinen yorumu state'ten kaldırma
    const handleCommentDelete = useCallback((commentId: number) => {
        setComments(prevComments => prevComments.filter(c => c.id !== commentId));
        // Yanıtları da silmek gerekebilir (eğer iç içe yapı varsa ve backend otomatik silmiyorsa)
    }, []);

    // Yanıt veya yeni yorum eklendiğinde listeyi yenileme
    const handleReplyAdded = useCallback(() => {
        fetchComments(); // Şimdilik basitçe listeyi yeniden çekiyoruz
        // Daha verimli: Yeni yorumu/yanıtı state'e eklemek
    }, [fetchComments]);

    // Yorumları hiyerarşik olarak render etme
    const renderCommentTree = (commentList: Comment[], parentId: number | null = null, level = 0): JSX.Element[] => {
         return commentList
            .filter(comment => comment.parent_comment_id === parentId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Önce en yeni
            .map(comment => (
                <React.Fragment key={comment.id}>
                    <CommentItem 
                        comment={comment}
                        movieId={movieId}
                        onVoteChange={handleVoteChange}
                        onReplyAdded={handleReplyAdded}
                        onDelete={handleCommentDelete}
                        level={level}
                    />
                    {/* Yanıtları render et (recursive) - Yorum satırı kaldırıldı */}
                    {renderCommentTree(commentList, comment.id, level + 1)}
                    {/* Şimdilik backend'in düz liste döndürdüğünü varsayıyoruz, 
                       CommentItem içindeki level prop'u girintiyi sağlıyor. 
                       Eğer backend yanıtları `replies` altında getirirse, burası güncellenmeli. */}
               </React.Fragment>
           ));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} sx={{ mr: 1 }}/>
                <Typography variant="body2" color="text.secondary">Şərhlər yüklənir...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="warning" sx={{ mt: 2 }}> 
                {error}
                 <Button size="small" onClick={fetchComments} sx={{ ml: 1 }}>Yenidən cəhd et</Button>
             </Alert>
        );
    }

    return (
        <Box className={styles['comment-list-container']} sx={{ mt: 0 }}>
            {comments.length === 0 ? (
                 <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                     Hələ heç bir şərh yoxdur.
                 </Typography>
            ) : (
                // Yorumları render et
                 renderCommentTree(comments)
                // Veya düz liste:
                /*
                comments
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(comment => (
                        <CommentItem 
                            key={comment.id} 
                            comment={comment}
                            movieId={movieId}
                            onVoteChange={handleVoteChange}
                            onReplyAdded={handleReplyAdded}
                            onDelete={handleCommentDelete}
                        />
                ))*/
            )}
        </Box>
    );
};

export default CommentList; 