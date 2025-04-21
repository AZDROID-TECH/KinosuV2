import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Button, 
    CircularProgress, 
    Alert,
    IconButton,
    Tooltip,
    Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getPendingComments, approveComment, rejectComment, Comment } from '../../services/commentService'; // Servis fonksiyonlarını import et
import { showSuccessToast, showErrorToast, showInfoToast } from '../../utils/toastHelper'; // <-- Helper import edildi
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale'; // Azerbaycan dili için locale

// -- Komponent Başlangıcı --
const ManageCommentsPage: React.FC = () => {
    // -- State Değişkenleri --
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<Record<number, 'approve' | 'reject' | false>>( {}); // Hangi yorum için işlem yapılıyor?

    // -- Veri Çekme Fonksiyonu --
    const fetchPendingComments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const pendingComments = await getPendingComments();
            setComments(pendingComments);
        } catch (err: any) {
            const errorMsg = err.message || "Şərhlər gətirilərkən xəta baş verdi.";
            console.error("Gözləyən şərhləri gətirmə xətası:", err);
            setError(errorMsg); // Səhifədə Alert göstərmək üçün state qalır
            showErrorToast(errorMsg); // <-- YENİ
        } finally {
            setLoading(false);
        }
    }, []);

    // -- Component Yüklendiğinde Veriyi Çek --
    useEffect(() => {
        fetchPendingComments();
    }, [fetchPendingComments]);

    // -- Aksiyon İşleyiciler --
    const handleApprove = async (commentId: number) => {
        setActionLoading(prev => ({ ...prev, [commentId]: 'approve' }));
        try {
            await approveComment(commentId);
            showSuccessToast(`Şərh #${commentId} təsdiq edildi.`); // <-- YENİ
            setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
        } catch (err: any) {
            const errorMsg = err.message || `Şərh #${commentId} təsdiq edilərkən xəta baş verdi.`;
            console.error(`Şərh #${commentId} təsdiq etmə xətası:`, err);
            showErrorToast(errorMsg); // <-- YENİ
        } finally {
             setActionLoading(prev => ({ ...prev, [commentId]: false }));
        }
    };

    const handleReject = async (commentId: number) => {
         setActionLoading(prev => ({ ...prev, [commentId]: 'reject' }));
        try {
            await rejectComment(commentId);
            showInfoToast(`Şərh #${commentId} rədd edildi.`); // <-- YENİ
            setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
        } catch (err: any) {
            const errorMsg = err.message || `Şərh #${commentId} rədd edilərkən xəta baş verdi.`;
            console.error(`Şərh #${commentId} rədd etmə xətası:`, err);
            showErrorToast(errorMsg); // <-- YENİ
        } finally {
            setActionLoading(prev => ({ ...prev, [commentId]: false }));
        }
    };

    // -- Yardımcı Fonksiyonlar --
    const formatRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: az });
        } catch (e) {
            console.error("Tarix formatlama xətası:", e);
            return dateString; // Hata durumunda orijinal dizeyi döndür
        }
    };

    // -- Render Fonksiyonları --
    const renderContent = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
        }

        if (comments.length === 0) {
            return <Alert severity="info" sx={{ mt: 2 }}>Təsdiq gözləyən şərh yoxdur.</Alert>;
        }

        return (
            <TableContainer component={Paper} elevation={2} sx={{ mt: 2 }}>
                <Table sx={{ minWidth: 650 }} aria-label="gözləyən şərhlər cədvəli">
                    <TableHead sx={{ backgroundColor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Yazar</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Şərh</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Film Başlığı</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tarix</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Əməliyyatlar</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {comments.map((comment) => (
                            <TableRow 
                                key={comment.id} 
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                hover
                            >
                                <TableCell component="th" scope="row">{comment.id}</TableCell>
                                <TableCell>{comment.author?.username || `İstifadəçi #${comment.user_id}`}</TableCell>
                                <TableCell>
                                    <Tooltip title={comment.content} arrow>
                                         <Typography variant="body2" noWrap sx={{ maxWidth: '300px' }}>
                                             {comment.content}
                                         </Typography>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    {comment.movieTitle ? (
                                        <Tooltip title={`IMDb ID: ${comment.movie_imdb_id}`} arrow>
                                            <Link 
                                                component={RouterLink} 
                                                to={`/movie/${comment.movie_imdb_id}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                underline="hover"
                                                sx={{ display: 'inline-flex', alignItems: 'center' }}
                                            >
                                                {comment.movieTitle}
                                                <OpenInNewIcon sx={{ fontSize: '0.9rem', ml: 0.5, opacity: 0.6 }} />
                                            </Link>
                                        </Tooltip>
                                     ) : (
                                        <Link 
                                            component={RouterLink} 
                                            to={`/movie/${comment.movie_imdb_id}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            underline="hover"
                                            sx={{ display: 'inline-flex', alignItems: 'center' }}
                                        >
                                            {comment.movie_imdb_id}
                                            <OpenInNewIcon sx={{ fontSize: '0.9rem', ml: 0.5 }} />
                                        </Link>
                                     )}
                                </TableCell>
                                <TableCell>{formatRelativeTime(comment.created_at)}</TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                         <Tooltip title="Təsdiq Et">
                                             <span> {/* IconButton disabled iken Tooltip için span gerekli */}
                                                <IconButton 
                                                     color="success" 
                                                     onClick={() => handleApprove(comment.id)}
                                                     disabled={!!actionLoading[comment.id]}
                                                     size="small"
                                                 >
                                                     {actionLoading[comment.id] === 'approve' ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
                                                 </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Rədd Et">
                                             <span> {/* IconButton disabled iken Tooltip için span gerekli */}
                                                 <IconButton 
                                                     color="error" 
                                                     onClick={() => handleReject(comment.id)}
                                                     disabled={!!actionLoading[comment.id]}
                                                     size="small"
                                                 >
                                                     {actionLoading[comment.id] === 'reject' ? <CircularProgress size={20} color="inherit" /> : <HighlightOffIcon />}
                                                 </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    // -- Ana Render --
    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {renderContent()}
        </Box>
    );
};

export default ManageCommentsPage; 