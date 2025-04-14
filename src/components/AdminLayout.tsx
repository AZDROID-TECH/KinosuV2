import React from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  CssBaseline,
  useTheme,
  alpha,
  Typography
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CommentIcon from '@mui/icons-material/Comment';
import DashboardIcon from '@mui/icons-material/Dashboard';
// İleride eklenecek diğer ikonlar...

const drawerWidth = 240;

/**
 * @az Admin Paneli Layout'u
 * @desc Admin paneli sayfaları üçün sabit kenar çubuğu (sidebar) olan layout.
 */
const AdminLayout = () => {
  const theme = useTheme();
  const location = useLocation();

  const menuItems = [
    { text: 'Ümumi', icon: <DashboardIcon />, path: '/admin' },
    { text: 'İstifadəçilər', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Şərhlər (Tezliklə)', icon: <CommentIcon />, path: '/admin/comments' },
    // İleride eklenecek diğer bölümler...
  ];

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar 
        component={RouterLink}
        to="/admin"
        sx={{ 
          bgcolor: alpha(theme.palette.secondary.main, 0.2), 
          borderBottom: `1px solid ${theme.palette.divider}`,
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&:hover': {
             bgcolor: alpha(theme.palette.secondary.main, 0.3),
          }
        }}
      >
         <img 
            src="/icon.svg" 
            alt="Kinosu Logo"
            style={{ 
              width: 28,
              height: 28,
            }} 
          />
         <Typography variant="h6" noWrap component="div" sx={{ color: theme.palette.secondary.dark, fontWeight: 600 }}>
            Admin
          </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to={item.path}
              selected={location.pathname === item.path}
              disabled={item.path === '/admin/comments'} // Yorumlar henüz aktif değil
              sx={{
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  borderRight: `3px solid ${theme.palette.secondary.main}`,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.secondary.main,
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                  }
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.action.hover, 0.5),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: theme.palette.text.secondary }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box', 
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.default, // Arkaplan tema ile uyumlu
          },
        }}
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
          minHeight: 'calc(100vh - 64px)', // Header yüksekliğini varsayalım
          bgcolor: theme.palette.background.default,
        }}
      >
        {/* Admin sayfalarının içeriği burada görünecek */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout; 