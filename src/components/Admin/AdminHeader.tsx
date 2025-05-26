import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Box,
    Tooltip,
    alpha,
    useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu'; // Gələcəkdə mobil menyu üçün?
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAuth } from '../../context/AuthContext'; // Auth contextini istifadə et
import { useTheme as useAppTheme } from '../../context/ThemeContext'; // ThemeContext'i əlavə et
import { Link as RouterLink, useLocation } from 'react-router-dom';
import StatusAvatar from '../Common/StatusAvatar'; // StatusAvatar bileşenini import et
import { useSocketContext } from '../../context/SocketContext';

// Path-lərə uyğun başlıqları təyin edək
const pageTitles: Record<string, string> = {
    '/admin': 'Ümumi Panel',
    '/admin/users': 'İstifadəçi İdarəetmə',
    '/admin/comments': 'Şərh İdarəetmə',
    // Gələcəkdə başqa səhifələr əlavə edilə bilər
};

// Prop tipi əlavə edildi
interface AdminHeaderProps {
    onDrawerToggle: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onDrawerToggle }) => {
    const { username, avatar, logout, userId } = useAuth();
    const theme = useTheme();
    const { darkMode, toggleDarkMode } = useAppTheme(); // ThemeContext'dən gələn funksiyaları əlavə et
    const location = useLocation(); // <-- Location hook
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const { isUserOnline } = useSocketContext();

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
    };

    // Cari səhifə başlığını tap
    const currentPageTitle = pageTitles[location.pathname] || 'Admin Paneli'; // Əgər path tapılmazsa default başlığı göstər

    return (
        <AppBar 
            position="static" // Layoutun içində qalması üçün
            elevation={0} // Kölgə olmasın
            sx={{ 
                backgroundColor: theme.palette.background.paper, // Sidebar ilə eyni arxa plan?
                borderBottom: `1px solid ${theme.palette.divider}`, // Alt xətt
                color: theme.palette.text.primary // Yazı rəngi
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                {/* Sol Tərəf: Menyü düyməsi (Mobil), Logo və Səhifə Başlığı */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {/* Mobil menyu düyməsi */} 
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={onDrawerToggle}
                        sx={{ 
                            mr: 1, 
                            display: { md: 'none' } // Yalnız mobil'də göstər
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                    
                    <RouterLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                       <img 
                          src="/icon.svg" 
                          alt="Kinosu Logo"
                          style={{ 
                            width: 28,
                            height: 28,
                          }} 
                        />
                     </RouterLink>
                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                        {currentPageTitle} {/* <-- Dinamik başlık */} 
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Tema dəyişdirmə düyməsi */}
                    <Tooltip title={darkMode ? "Açıq temaya keç" : "Qaranlıq temaya keç"}>
                        <IconButton
                            onClick={toggleDarkMode}
                            sx={{
                                mr: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                                },
                                transition: 'all 0.2s ease-in-out',
                                borderRadius: 1.5
                            }}
                        >
                            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>
                    
                    <Typography 
                      variant="body1"
                      sx={{ 
                        mr: 1.5, 
                        display: { xs: 'none', sm: 'block' },
                        fontWeight: 500,
                        color: theme.palette.primary.main,
                        letterSpacing: '0.5px'
                      }}
                    >
                        Xoş gəldin, {username || 'Admin'}
                    </Typography>
                    <Tooltip title="Hesab menyusu">
                        <IconButton
                            onClick={handleMenu}
                            color="inherit"
                        >
                             <StatusAvatar
                                avatarUrl={avatar || undefined}
                                username={username || "Admin"}
                                isOnline={userId ? isUserOnline(userId) : false}
                             />
                        </IconButton>
                    </Tooltip>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={open}
                        onClose={handleClose}
                        PaperProps={{
                            sx: {
                                mt: 1,
                                boxShadow: theme.shadows[3],
                                borderRadius: 1.5
                            }
                        }}
                    >
                        {/* <MenuItem onClick={handleClose} component={RouterLink} to="/profile">Profil</MenuItem> */}
                        <MenuItem onClick={handleLogout}>
                            <LogoutIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }}/>
                            Çıxış et
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default AdminHeader; 