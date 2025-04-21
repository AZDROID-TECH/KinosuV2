import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    CircularProgress,
    Alert,
    Box,
    Tooltip,
    Link as MuiLink,
    Button,
    useTheme,
    alpha,
    Chip,
    ListItemAvatar,
    Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MovieIcon from '@mui/icons-material/Movie';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';
import { Comment, deleteComment, getCommentsByUserId } from '../../services/commentService';
import { showSuccessToast, showErrorToast } from '../../utils/toastHelper';
import ConfirmationDialog from '../Common/ConfirmationDialog';

interface UserCommentsModalProps {
    open: boolean;
    onClose: () => void;
    userId: number | null;
    username: string | null;
}

const statusMap: Record<string, { label: string; icon: React.ReactElement; color: 'default' | 'warning' | 'success' | 'error' }> = {
    pending: { label: 'Gözləmədə', icon: <HourglassEmptyIcon fontSize="small" />, color: 'warning' },
    approved: { label: 'Təsdiqlənmiş', icon: <CheckCircleIcon fontSize="small" />, color: 'success' },
    rejected: { label: 'İptal edildi', icon: <CancelIcon fontSize="small" />, color: 'error' },
};

const UserCommentsModal: React.FC<UserCommentsModalProps> = ({ open, onClose, userId, username }) => {
    const theme = useTheme();
    const [userComments, setUserComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState<boolean>(false);
    const [commentsError, setCommentsError] = useState<string | null>(null);
    const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

    const fetchUserComments = useCallback(async () => {
        if (!userId) return;
        setLoadingComments(true);
        setCommentsError(null);
        setUserComments([]);
        try {
            const comments = await getCommentsByUserId(userId);
            setUserComments(comments);
        } catch (err: any) {
            console.error("İstifadəçi şərhlərini gətirmə xətası:", err);
            setCommentsError(err.message || "İstifadəçinin şərhləri gətirilərkən xəta baş verdi.");
        } finally {
            setLoadingComments(false);
        }
    }, [userId]);

    useEffect(() => {
        if (open && userId) {
            fetchUserComments();
        }
        if (!open) {
            setUserComments([]);
            setCommentsError(null);
            setLoadingComments(false);
        }
    }, [open, userId, fetchUserComments]);

    const handleOpenConfirmDialog = (comment: Comment) => {
        setCommentToDelete(comment);
        setConfirmDialogOpen(true);
    };

    const handleConfirmCommentDelete = async () => {
        if (!commentToDelete) return;
        setDeletingCommentId(commentToDelete.id);
        try {
            await deleteComment(commentToDelete.id);
            showSuccessToast('Şərh uğurla silindi.');
            setUserComments(prev => prev.filter(c => c.id !== commentToDelete.id));
            setConfirmDialogOpen(false);
            setCommentToDelete(null);
        } catch (err: any) {
            showErrorToast(err.message || 'Şərh silinərkən xəta baş verdi.');
        } finally {
            setDeletingCommentId(null);
        }
    };

    const formatRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: az });
        } catch (e) {
            return dateString;
        }
    };

    const getStatusChip = (status: 'pending' | 'approved' | 'rejected') => {
        const statusInfo = statusMap[status] || { label: status, icon: null, color: 'default' };
        return (
            <Tooltip title={`Status: ${statusInfo.label}`}>
                <Chip 
                    icon={statusInfo.icon}
                    label={statusInfo.label} 
                    size="small" 
                    color={statusInfo.color}
                    variant="outlined"
                    sx={{ ml: 1.5, opacity: 0.85, fontSize: '0.75rem', height: '22px' }}
                 />
            </Tooltip>
        );
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            fullWidth 
            maxWidth="md"
            PaperProps={{ sx: { borderRadius: 2, height: '85vh' } }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                pb: 1,
                borderBottom: `1px solid ${theme.palette.divider}`
            }}>
                <Typography variant="h6" component="span">
                    <ChatBubbleOutlineIcon sx={{ verticalAlign: 'bottom', mr: 1, opacity: 0.8 }}/>
                    <strong>{username || 'İstifadəçi'}</strong> Şərhləri
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ 
                bgcolor: alpha(theme.palette.action.hover, 0.2),
                p: 0
            }}>
                {loadingComments ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : commentsError ? (
                    <Alert severity="error" sx={{ m: 2 }}>{commentsError}</Alert>
                ) : userComments.length === 0 ? (
                    <Alert severity="info" sx={{ m: 2 }}>Bu istifadəçinin heç bir şərhi yoxdur.</Alert>
                ) : (
                    <List disablePadding>
                        {userComments.map((comment) => (
                            <ListItem 
                                key={comment.id}
                                alignItems="flex-start"
                                secondaryAction={
                                    <Tooltip title="Şərhi sil">
                                        <IconButton 
                                            edge="end" 
                                            aria-label="sil" 
                                            onClick={() => handleOpenConfirmDialog(comment)}
                                            disabled={deletingCommentId === comment.id}
                                            size="small"
                                        >
                                            {deletingCommentId === comment.id ? <CircularProgress size={20} /> : <DeleteOutline fontSize="small" color="error" />}
                                        </IconButton>
                                    </Tooltip>
                                }
                                sx={{ 
                                    py: 2,
                                    px: 2.5,
                                    borderBottom: `1px solid ${theme.palette.divider}`
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            {comment.content}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                            <Tooltip title="Film">
                                                <MuiLink 
                                                    component={RouterLink} 
                                                    to={`/movie/${comment.movie_imdb_id}`} 
                                                    target="_blank" 
                                                    underline="hover"
                                                    color="text.secondary"
                                                    sx={{ display: 'inline-flex', alignItems: 'center', mr: 1 }}
                                                >
                                                    <MovieIcon sx={{ fontSize: '1rem', mr: 0.5, opacity: 0.7 }} />
                                                    {comment.movieTitle || comment.movie_imdb_id}
                                                    <OpenInNewIcon sx={{ fontSize: '0.8rem', ml: 0.5, opacity: 0.7 }} />
                                                </MuiLink>
                                            </Tooltip>
                                            <Tooltip title="Tarix">
                                                <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                                    <EventNoteIcon sx={{ fontSize: '1rem', mr: 0.5, opacity: 0.7 }} />
                                                    {formatRelativeTime(comment.created_at)}
                                                </Typography>
                                            </Tooltip>
                                            {getStatusChip(comment.status)}
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button onClick={onClose}>Bağla</Button>
            </DialogActions>

            <ConfirmationDialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                onConfirm={handleConfirmCommentDelete}
                title="Şərh Silmə Təsdiqi"
                message={
                    <>
                        Seçilmiş şərhi ({commentToDelete?.id}) silmək istədiyinizə əminsinizmi?<br />
                        <Typography variant="caption" color="text.secondary">
                            "<i>{commentToDelete?.content.substring(0, 50)}{commentToDelete?.content && commentToDelete.content.length > 50 ? '...' : ''}</i>"
                        </Typography>
                        <br />Bu əməliyyat geri alına bilməz.
                    </>
                }
                confirmText="Bəli, Sil"
                cancelText="Xeyr, Ləğv Et"
                isLoading={!!deletingCommentId}
                confirmButtonColor="error"
            />
        </Dialog>
    );
};

export default UserCommentsModal; 