import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Alert, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Kullanıcı girişi kontrolü için
import { addComment, NewCommentData } from '../../services/commentService';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../utils/toastHelper'; // <-- Helper import edildi

interface CommentFormProps {
    movieId: string; // movie_imdb_id
    parentId?: number | null; // Yanıt verilecek yorumun ID'si
    onCommentAdded?: () => void; // Yorum eklendikten sonra listeyi yenilemek için callback
    placeholder?: string;
    buttonText?: string;
    variant?: 'outlined' | 'filled' | 'standard';
    showCancelButton?: boolean;
    onCancel?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
    movieId,
    parentId = null, 
    onCommentAdded, 
    placeholder = "Şərhinizi yazın...",
    buttonText = "Göndər",
    variant = "filled",
    showCancelButton = false,
    onCancel
}) => {
    const { isLoggedIn } = useAuth(); 
    const [commentText, setCommentText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!commentText.trim() || !isLoggedIn) return;

        setIsLoading(true);
        setError(null);

        const commentData: NewCommentData = {
            content: commentText,
            movieId: movieId,
            parentId: parentId,
        };

        try {
            await addComment(commentData);
            
            if (parentId) { 
                showInfoToast('Cavabınız təsdiq üçün göndərildi.'); // <-- YENİ
            } else { 
                showSuccessToast('Şərhiniz təsdiq üçün göndərildi və admin tərəfindən yoxlanılır!'); // <-- YENİ
            }
            
            setCommentText(''); 
            setError(null);
            
            if (onCommentAdded) {
                onCommentAdded(); 
            }
            
            if (showCancelButton && onCancel) { 
                onCancel();
            }

        } catch (err: any) {
            console.error("Yorum gönderme hatası:", err);
            
            // Hata mesajını kullanıcı dostu hale getir
            let errorMessage = 'Şərh göndərilərkən xəta baş verdi.';
            
            if (typeof err === 'string') {
                errorMessage = err;
            } else if (err?.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err?.message) {
                errorMessage = err.message;
            }
            
            // UUID hatası için daha açıklayıcı mesaj
            if (errorMessage.includes('uuid')) {
                errorMessage = 'Sistem xətası: Texniki dəstəklə əlaqə saxlayın.';
            }
            
            setError(errorMessage);
            showErrorToast(errorMessage); // <-- YENİ
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoggedIn) {
        return <Typography variant="body2" color="text.secondary">Şərh yazmaq üçün <Link component={RouterLink} to="/login">daxil olun</Link>.</Typography>;
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: parentId ? 1 : 2 }}>
            <TextField
                fullWidth
                multiline
                rows={parentId ? 2 : 3} 
                variant={variant}
                label={placeholder}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={isLoading}
                required
                sx={{ mb: 1, bgcolor: variant === 'filled' ? 'action.hover' : undefined }}
                InputProps={{ disableUnderline: variant === 'filled' }}
            />
            {error && (
                <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                {showCancelButton && (
                    <Button 
                        variant="text" 
                        onClick={onCancel} 
                        disabled={isLoading}
                        size="small"
                    >
                        Ləğv et
                    </Button>
                )}
                <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={isLoading || !commentText.trim()}
                    size="small"
                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {buttonText}
                </Button>
            </Box>
        </Box>
    );
};

export default CommentForm; 