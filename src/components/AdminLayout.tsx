import React, { useState } from 'react';
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
  Typography,
  useMediaQuery
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CommentIcon from '@mui/icons-material/Comment';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import AdminHeader from './Admin/AdminHeader';

const drawerWidth = 240;

/**
 * @az Admin Paneli Layout'u
 * @desc Admin paneli sayfaları üçün sabit ve açılır-kapanır kenar çubuğu (sidebar) olan layout.
 */
const AdminLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Ümumi', icon: <DashboardIcon />, path: '/admin' },
    { text: 'İstifadəçilər', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Şərhlər', icon: <CommentIcon />, path: '/admin/comments' },
    { text: 'Yeniliklər', icon: <NewspaperIcon />, path: '/admin/newsletters' },
  ];

  const drawerContent = (
    <Box sx={{ overflow: 'auto', pt: { xs: 2, md: 0 } }}>
      <List>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => setMobileOpen(false)}
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
                pl: 3,
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
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <CssBaseline />
      <AdminHeader onDrawerToggle={handleDrawerToggle} />
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
          aria-label="admin folders"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                borderRight: 'none',
                backgroundColor: theme.palette.background.default,
              }
            }}
          >
            {drawerContent}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                width: drawerWidth, 
                boxSizing: 'border-box',
                borderRight: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.default,
                position: 'relative',
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            bgcolor: theme.palette.background.paper,
            overflowY: 'auto',
            height: '100%',
          }}
        >
          <Box sx={{ p: {xs: 2, md: 3} }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout; 