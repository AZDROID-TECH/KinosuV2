import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, Alert, Stack, Link as MuiLink, Card, CardContent, CardHeader, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import CommentIcon from '@mui/icons-material/Comment';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import { statsAPI } from '../../services/api'; // API funksiyasını import edirik

interface AdminStats {
    userCount: number;
    pendingCommentCount: number;
}

const AdminHomePage: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await statsAPI.getAdminStats();
                setStats(data);
            } catch (err) {
                console.error("Statistikalar yüklənərkən xəta:", err);
                setError('Statistik məlumatlar yüklənə bilmədi. Zəhmət olmasa, səhifəni yeniləyin və ya daha sonra yenidən cəhd edin.');
                // Servisdən gələn default dəyərlər əvəzinə null saxlayaq ki, xəta mesajı görünsün
                setStats(null); 
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Statistik kartı render edən köməkçi funksiya
    const renderStatCard = (title: string, value: number | string, icon: React.ReactNode, linkTo: string) => (
        <Grid item xs={12} sm={6} md={4}>
            <MuiLink component={RouterLink} to={linkTo} underline="none" sx={{ display: 'block' }}>
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6, // Daha belirgin kölge
                        }
                    }}
                >
                    <Stack spacing={1}>
                        <Typography variant="h6" color="text.secondary">{title}</Typography>
                        <Typography variant="h4" component="div">
                            {value}
                        </Typography>
                    </Stack>
                    <Box sx={{ color: 'primary.main' }}>
                        {icon}
                    </Box>
                </Paper>
            </MuiLink>
        </Grid>
    );

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h5" gutterBottom component="div" sx={{ mb: 3 }}>
                Ümumi Panel
            </Typography>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            {!loading && !error && stats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {renderStatCard(
                        'Ümumi İstifadəçi',
                        stats.userCount,
                        <PeopleIcon sx={{ fontSize: 40 }} />,
                        '/admin/users'
                    )}
                    {renderStatCard(
                        'Gözləyən Şərhlər',
                        stats.pendingCommentCount,
                        <CommentIcon sx={{ fontSize: 40 }} />,
                        '/admin/comments' // Gələcəkdə birbaşa gözləyənlərə filterlənmiş link ola bilər
                    )}
                </Grid>
            )}

            {!loading && !error && !stats && !error && (
                 <Typography sx={{ mb: 4 }}>Statistik məlumat tapılmadı.</Typography>
            )}

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardHeader title="Qısayollar" />
                        <Divider />
                        <CardContent>
                            <List dense>
                                <ListItem disablePadding>
                                     <MuiLink component={RouterLink} to="/admin/movies/new" sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <ListItemIcon sx={{ minWidth: 40}}>
                                            <AddCircleOutlineIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText primary="Yeni Film Əlavə Et" secondary="Sistemə yeni film daxil edin" />
                                    </MuiLink>
                                </ListItem>
                                <ListItem disablePadding sx={{ mt: 1}}>
                                     <MuiLink component={RouterLink} to="/admin/users" sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <ListItemIcon sx={{ minWidth: 40}}>
                                            <PeopleIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText primary="İstifadəçiləri İdarə Et" secondary="Mövcud istifadəçilərə baxın" />
                                    </MuiLink>
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardHeader title="Yardım və Resurslar" />
                        <Divider />
                        <CardContent>
                            <List dense>
                                <ListItem disablePadding>
                                     <MuiLink href="#" target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <ListItemIcon sx={{ minWidth: 40}}>
                                            <DescriptionIcon color="secondary" />
                                        </ListItemIcon>
                                        <ListItemText primary="Admin Paneli Sənədləri" secondary="Panelin istifadəsi haqqında ətraflı məlumat" />
                                     </MuiLink>
                                </ListItem>
                                <ListItem disablePadding sx={{ mt: 1}}>
                                    <MuiLink href="#" target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <ListItemIcon sx={{ minWidth: 40}}>
                                            <HelpOutlineIcon color="secondary" />
                                        </ListItemIcon>
                                        <ListItemText primary="Texniki Dəstək" secondary="Problem yarandıqda əlaqə saxlayın" />
                                     </MuiLink>
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

        </Box>
    );
};

export default AdminHomePage; 