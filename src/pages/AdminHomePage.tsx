import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Link,
  Button,
  useTheme,
  alpha,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardHeader,
  Avatar
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CommentIcon from '@mui/icons-material/Comment';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import UpdateIcon from '@mui/icons-material/Update';

/**
 * @az Admin Paneli Ümumi Səhifəsi
 * @desc Admin paneline girişdə görünən, qısayollar və məlumatlar təqdim edən səhifə.
 */
const AdminHomePage = () => {
  const theme = useTheme();

  const shortcuts = [
    {
      title: 'İstifadəçi İdarəetmə',
      description: 'İstifadəçiləri görüntüləyin, redaktə edin və admin səlahiyyətlərini idarə edin.',
      icon: <PeopleIcon fontSize="large" color="secondary" />,
      link: '/admin/users'
    },
    {
      title: 'Şərh İdarəetmə',
      description: 'Filmlərə yazılan şərhləri idarə edin, hesabatları incələyin.',
      icon: <CommentIcon fontSize="large" color="disabled" />,
      link: '/admin/comments',
      disabled: true
    }
  ];

  const latestUpdates = [
    {
      title: 'Profil Şəkilləri Supabase Storage-a Köçürüldü',
      date: '15 Noyabr 2023',
      description: 'İstifadəçi profil şəkilləri yerli fayl sistemindən Supabase Storage-a köçürüldü.'
    },
    {
      title: 'Film Əlavə Etmə Xətası Həll Edildi',
      date: '10 Noyabr 2023',
      description: 'Film əlavə edildikdən sonra meydana gələn ağ səhifə problemi aradan qaldırıldı.'
    },
    {
      title: 'Header Klik Alanı Düzəldildi',
      date: '5 Noyabr 2023',
      description: 'Header komponentində logo və sayt adının klik alanı ilə bağlı problemlər həll edildi.'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? theme.palette.secondary.light : theme.palette.secondary.dark, mb: 4 }}>
        Admin Panelinə Xoş Gəlmisiniz!
      </Typography>

      <Grid container spacing={4}>
        {/* Sol tərəf - Qısayollar */}
        <Grid item xs={12} md={7}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon color="secondary" fontSize="small" /> Qısayollar
          </Typography>
          <Grid container spacing={3} sx={{ mb: 5 }}>
            {shortcuts.map((item, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease',
                    opacity: item.disabled ? 0.6 : 1,
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    background: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.8)
                      : alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      transform: item.disabled ? 'none' : 'translateY(-5px)',
                      boxShadow: item.disabled ? theme.shadows[3] : theme.shadows[10],
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ mr: 2, p: 1, borderRadius: '50%', background: alpha(theme.palette.secondary.main, 0.1) }}>
                      {item.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
                    {item.description}
                  </Typography>
                  <Button 
                    component={RouterLink} 
                    to={item.link}
                    variant="outlined"
                    color="secondary"
                    size="small"
                    disabled={item.disabled}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Keçid
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutlineIcon color="info" fontSize="small" /> Yardım və Ayarlar
          </Typography>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3, background: alpha(theme.palette.background.paper, 0.7) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}> 
              <HelpOutlineIcon color="action" /> 
              <Typography fontWeight="medium">Yardım Lazımdır?</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Admin paneli ilə bağlı suallarınız üçün dəstək komandası ilə əlaqə saxlayın:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="E-poçt" 
                  secondary={<Link href="mailto:support@kinosu.az">support@kinosu.az</Link>} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Sənədlər" 
                  secondary={<Link href="#" target="_blank">Admin İstifadəçi Təlimatı</Link>} 
                />
              </ListItem>
            </List>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, background: alpha(theme.palette.background.paper, 0.7) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}> 
              <SettingsIcon color="action" />
              <Typography fontWeight="medium">Panel Ayarları</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Panel ayarları tezliklə əlavə olunacaq. Bu funksiyanın inkişafı davam edir.
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small" 
              disabled
              startIcon={<SettingsIcon />}
            >
              Ayarları Açın
            </Button>
          </Paper>
        </Grid>

        {/* Sağ tərəf - Son Yeniliklər */}
        <Grid item xs={12} md={5}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <UpdateIcon color="error" fontSize="small" /> Son Yeniliklər
          </Typography>
          <Card 
            elevation={3} 
            sx={{ 
              mb: 4, 
              borderRadius: 2,
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.7)
                : theme.palette.background.paper,
            }}
          >
            <CardHeader title="Sistem Yenilikləri" />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List dense>
                {latestUpdates.map((update, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start" sx={{ px: 2, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {update.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {update.date}
                            </Typography>
                          </Box>
                        }
                        secondary={update.description}
                      />
                    </ListItem>
                    {index < latestUpdates.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminHomePage; 