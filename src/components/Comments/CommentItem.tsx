import React, { useState } from 'react';
import { Box, Typography, IconButton, Link, Menu, MenuItem, CircularProgress, useTheme, Tooltip, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ThumbUp, ThumbUpOutlined, ThumbDown, ThumbDownOutlined, Reply, DeleteOutline, MoreVert, Edit } from '@mui/icons-material';
import { Comment, voteComment, deleteComment } from '../../services/commentService';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns'; // Zaman formatı için
import { az } from 'date-fns/locale'; // Azerbaycan lokali
import { showSuccessToast, showErrorToast, showInfoToast } from '../../utils/toastHelper'; // <-- Yeni helper import edildi
import styles from './Comments.module.css';
import CommentForm from './CommentForm'; // Yanıt formu için
import ConfirmationDialog from '../Common/ConfirmationDialog'; // <-- Yeni Dialog import edildi
import StatusAvatar from '../Common/StatusAvatar'; // StatusAvatar bileşenini import ediyoruz
import { useSocketContext } from '../../context/SocketContext';

interface CommentItemProps {
    comment: Comment;
    movieId: string;
    onVoteChange: (commentId: number, newLikes: number, newDislikes: number, newUserVote: 'like' | 'dislike' | null) => void;
    onReplyAdded: () => void; // Yanıt eklendiğinde ana listeyi yenilemek için
    onDelete: (commentId: number) => void; // Yorum silindiğinde
    level?: number; // İç içe yanıtlar için seviye
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, movieId, onVoteChange, onReplyAdded, onDelete, level = 0 }) => {
    const { isLoggedIn, isAdmin, userId: loggedInUserId } = useAuth(); // userId context'ten alındı
    const theme = useTheme();
    const [isReplying, setIsReplying] = useState(false);
    const [voteLoading, setVoteLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // <-- Dialog state'i
    const { isUserOnline } = useSocketContext(); // OnlineStatus context'inden isUserOnline fonksiyonunu al

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Zamanı formatla (örn: "5 dəqiqə əvvəl")
    const timeAgo = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: az });
        } catch (error) {
            console.error('Date formatting error:', error);
            return dateString; // Hata olursa orijinal string'i dön
        }
    };

    // Kullanıcının kendi yorumu olup olmadığını kontrol et
    const isOwnComment = loggedInUserId !== null && loggedInUserId === comment.user_id;

    // Yorum sahibinin çevrimiçi durumunu kontrol et
    // Kendi yorumları için direkt olarak loggedInUserId'yi kullan
    const isAuthorOnline = () => {
        if (isOwnComment && loggedInUserId) {
            return isUserOnline(loggedInUserId); // Kendi yorumu için kendi çevrimiçi durumunu kullan
        } else if (comment.author?.id) {
            return isUserOnline(comment.author.id); // Başkasının yorumu için onun çevrimiçi durumunu kullan
        }
        return false;
    };

    const handleVote = async (voteType: 'like' | 'dislike') => {
        // Giriş yapılmadıysa, işlem sürüyorsa veya kendi yorumuysa oy verme
        if (!isLoggedIn || voteLoading || isOwnComment) return;
        setVoteLoading(true);

        // Optimistic UI
        const currentLikes = comment.likes;
        const currentDislikes = comment.dislikes;
        const currentUserVote = comment.user_vote;

        let optimisticLikes = currentLikes;
        let optimisticDislikes = currentDislikes;
        let optimisticUserVote: 'like' | 'dislike' | null = null;

        if (currentUserVote === voteType) { // Oyu geri al
            optimisticUserVote = null;
            if (voteType === 'like') optimisticLikes--;
            else optimisticDislikes--;
        } else { // Yeni oy veya oy değiştir
            optimisticUserVote = voteType;
            if (voteType === 'like') {
                optimisticLikes++;
                if (currentUserVote === 'dislike') optimisticDislikes--; // Dislike'ı geri al
            } else { // Dislike
                optimisticDislikes++;
                if (currentUserVote === 'like') optimisticLikes--; // Like'ı geri al
            }
        }
        // Geçici olarak UI'ı güncelle
        onVoteChange(comment.id, optimisticLikes, optimisticDislikes, optimisticUserVote);

        try {
            const response = await voteComment(comment.id, { voteType });
            // Backend'den gelen gerçek sayılarla ve oy durumuyla UI'ı tekrar güncelle
             if (response && typeof response.likes === 'number' && typeof response.dislikes === 'number') {
                 // response.user_vote değeri null, 'like' veya 'dislike' olabilir
                 const finalUserVote = response.user_vote as ('like' | 'dislike' | null);
                 onVoteChange(comment.id, response.likes, response.dislikes, finalUserVote);
             } else {
                 // Backend doğru yanıt dönmezse optimistic değişikliği geri al? (Hata durumu aşağıda ele alınıyor)
                 console.warn("Backend'den səs məlumatları düzgün formatda gəlmədi.");
                 // Optimistic değişikliği geri al
                 onVoteChange(comment.id, currentLikes, currentDislikes, currentUserVote ?? null);
             }
        } catch (err: any) {
            showErrorToast(err?.message || 'Oy verərkən xəta baş verdi.'); // <-- YENİ
            // Başarısız olursa optimistic değişikliği geri al
            onVoteChange(comment.id, currentLikes, currentDislikes, currentUserVote ?? null);
        } finally {
            setVoteLoading(false);
        }
    };

    // Silme ikonuna tıklanınca dialoqu aç
    const handleDeleteClick = () => {
        setOpenConfirmDialog(true);
    };

    // Dialogdan təsdiq gələndə silmə əməliyyatını başlat
    const handleConfirmDelete = async () => {
        if (!isAdmin || deleteLoading) return;

        setDeleteLoading(true);
        try {
            await deleteComment(comment.id);
            showSuccessToast('Şərh silindi.'); // <-- YENİ
            setOpenConfirmDialog(false); // Dialoqu bağla
            onDelete(comment.id); // Listeden kaldırılması için üst component'e haber ver
        } catch (err: any) {
            showErrorToast(err?.message || 'Şərh silinərkən xəta baş verdi.'); // <-- YENİ
            setOpenConfirmDialog(false); // Hata durumunda da dialoqu bağla
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEdit = () => {
        // TODO: Yorum düzenleme modal/formunu aç
        showInfoToast('Yorum düzenleme henüz uygulanmadı.'); // <-- YENİ
    };

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                gap: 2, 
                py: 2,
                px: level > 0 ? 1 : 0,
                ml: level * (level > 1 ? 3 : 4), // İç içe yanıtlarda girinti
                borderLeft: level > 0 ? `2px solid ${theme.palette.divider}` : 'none',
                pl: level > 0 ? 2 : 0,
                position: 'relative', // Menü konumu için
            }}
        >
            <StatusAvatar 
                component={RouterLink} 
                to={`/user/username/${comment.author?.username}`}
                src={comment.author?.avatar_url || ''} 
                alt={comment.author?.username || 'Anonim'} 
                isOnline={isAuthorOnline()}
                size={36}
            />
            <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Link 
                        component={RouterLink} 
                        to={`/user/username/${comment.author?.username}`} // Profil sayfasına link
                        underline="hover"
                        color="primary.main" // Tema rengi (veya secondary.main)
                        sx={{ fontWeight: 'medium', mr: 1, fontSize: '0.9rem' }}
                    >
                        {comment.author?.username || 'Anonim'}
                    </Link>
                    <Typography variant="caption" color="text.secondary">
                        {timeAgo(comment.created_at)}
                    </Typography>
                    {/* Admin için Silme Butonu - Her zaman görünür */} 
                    {isAdmin && (
                        <Tooltip title="Şərhi sil" arrow>
                            <IconButton 
                                size="small"
                                onClick={handleDeleteClick} // <-- handleDelete -> handleDeleteClick
                                disabled={deleteLoading}
                                sx={{ ml: 'auto' }} // Sağa yaslamak için
                                color="error" // Dikkat çekmesi için kırmızı olabilir
                            >
                                {deleteLoading ? <CircularProgress size={16} color="inherit"/> : <DeleteOutline fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>{comment.content}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Like Butonu */} 
                    <Tooltip title={isOwnComment ? "Öz şərhinizə səs verə bilməzsiniz" : "Bəyən"} arrow placement="top">
                        <span> 
                             <IconButton 
                                size="small" 
                                onClick={() => handleVote('like')} 
                                // Kendi yorumuysa veya giriş yapılmadıysa/oylama sürüyorsa disable et
                                disabled={!isLoggedIn || voteLoading || isOwnComment} 
                                color={comment.user_vote === 'like' ? 'primary' : 'default'}
                            >
                                 {comment.user_vote === 'like' ? <ThumbUp fontSize="small"/> : <ThumbUpOutlined fontSize="small" />}
                             </IconButton>
                        </span>
                    </Tooltip>
                    <Typography variant="caption" sx={{ fontWeight: 500, minWidth: '1.5em' }}>{comment.likes}</Typography>

                    {/* Dislike Butonu */} 
                    <Tooltip title={isOwnComment ? "Öz şərhinizə səs verə bilməzsiniz" : "Bəyənmə"} arrow placement="top">
                        <span>
                             <IconButton 
                                size="small" 
                                onClick={() => handleVote('dislike')} 
                                // Kendi yorumuysa veya giriş yapılmadıysa/oylama sürüyorsa disable et
                                disabled={!isLoggedIn || voteLoading || isOwnComment} 
                                color={comment.user_vote === 'dislike' ? 'error' : 'default'}
                            >
                                 {comment.user_vote === 'dislike' ? <ThumbDown fontSize="small"/> : <ThumbDownOutlined fontSize="small" />}
                             </IconButton>
                        </span>
                    </Tooltip>
                    <Typography variant="caption" sx={{ fontWeight: 500, minWidth: '1.5em' }}>{comment.dislikes}</Typography>

                    {/* Yanıtla Butonu */} 
                    {/* Kendi yorumuna yanıt verme engellenmiyor */} 
                    {level < 3 && isLoggedIn && (
                         <Button 
                            size="small" 
                            startIcon={<Reply fontSize="small" />} 
                            onClick={() => setIsReplying(!isReplying)} 
                            sx={{ ml: 1, textTransform: 'none' }}
                        >
                             {isReplying ? 'Ləğv et' : 'Cavabla'}
                         </Button>
                    )}
                </Box>
                 {/* Yanıt Formu */} 
                 {isReplying && (
                    <CommentForm 
                        movieId={movieId}
                        parentId={comment.id}
                        onCommentAdded={() => { setIsReplying(false); onReplyAdded(); }}
                        placeholder={`${comment.author?.username || 'Anonim'} adlı istifadəçiyə cavab ver...`}
                        buttonText="Cavab Göndər"
                        variant="standard"
                        showCancelButton
                        onCancel={() => setIsReplying(false)}
                    />
                )}
            </Box>

            {/* Silme Onay Dialoqu */} 
            <ConfirmationDialog
                open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)} // Ləğv etmə
                onConfirm={handleConfirmDelete} // Təsdiq etmə (silməni başlat)
                title="Şərh Silmə Təsdiqi"
                message={
                    <>
                        Bu şərhi silmək istədiyinizə əminsinizmi? <br />
                        <Typography variant="caption" color="text.secondary">
                            "<i>{comment.content.substring(0, 50)}{comment.content.length > 50 ? '...' : ''}</i>"
                        </Typography> <br />
                        Bu əməliyyat geri alına bilməz.
                    </>
                }
                confirmText="Bəli, Sil"
                cancelText="Xeyr, Ləğv Et"
                isLoading={deleteLoading}
                confirmButtonColor="error" // Silme işlemi için kırmızı buton
            />
        </Box>
    );
};

export default CommentItem; 