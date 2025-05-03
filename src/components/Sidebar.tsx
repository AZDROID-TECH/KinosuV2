import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box,
  useTheme,
  Tooltip,
  IconButton,
  alpha
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

// Icons
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  People as UsersIcon,
  Comment as CommentIcon
} from '@mui/icons-material';

// Menü öğeleri listesi
const menuItems = [
  {
    text: 'Ana Səhifə',
    icon: <HomeIcon />,
    path: '/',
    visibleWhen: 'always'
  },
  {
    text: 'İdarə Paneli',
    icon: <DashboardIcon />,
    path: '/dashboard',
    visibleWhen: 'loggedIn'
  },
  {
    text: 'Profil',
    icon: <PersonIcon />,
    path: '/profile',
    visibleWhen: 'loggedIn'
  },
  {
    text: 'Dost siyahısı',
    icon: <GroupIcon />,
    path: '/friends',
    visibleWhen: 'loggedIn'
  },
  {
    text: 'Daxil ol',
    icon: <LoginIcon />,
    path: '/login',
    visibleWhen: 'loggedOut'
  },
  {
    text: 'Qeydiyyat',
    icon: <PersonAddIcon />,
    path: '/register',
    visibleWhen: 'loggedOut'
  }
];

// Admin menü öğeleri
const adminMenuItems = [
  {
    text: 'Admin Panel',
    icon: <AdminIcon />,
    path: '/admin',
    visibleWhen: 'admin'
  },
  {
    text: 'İstifadəçilər',
    icon: <UsersIcon />,
    path: '/admin/users',
    visibleWhen: 'admin'
  },
  {
    text: 'Şərhlər',
    icon: <CommentIcon />,
    path: '/admin/comments',
    visibleWhen: 'admin'
  }
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'persistent' | 'temporary';
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isAdmin } = useAuth();
  const muiTheme = useTheme();
  const { darkMode } = useCustomTheme();
  
  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };
  
  // Görünürlük durumuna göre menü öğelerini filtrele
  const filteredMenuItems = menuItems.filter(item => {
    if (item.visibleWhen === 'always') return true;
    if (item.visibleWhen === 'loggedIn' && isLoggedIn) return true;
    if (item.visibleWhen === 'loggedOut' && !isLoggedIn) return true;
    return false;
  });
  
  // Admin menüsünü filtrele
  const filteredAdminItems = adminMenuItems.filter(item => {
    return item.visibleWhen === 'admin' && isAdmin;
  });
  
  const drawerContent = (
    <Box sx={{ width: 240, height: '100%' }}>
      <List>
        {filteredMenuItems.map(item => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => handleNavigation(item.path)}
            sx={{
              backgroundColor: location.pathname === item.path 
                ? alpha(muiTheme.palette.primary.main, darkMode ? 0.15 : 0.1)
                : 'transparent',
              borderRight: location.pathname === item.path 
                ? `3px solid ${muiTheme.palette.primary.main}`
                : 'none',
              '&:hover': {
                backgroundColor: alpha(muiTheme.palette.primary.main, darkMode ? 0.1 : 0.05)
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: location.pathname === item.path 
                ? muiTheme.palette.primary.main 
                : muiTheme.palette.text.secondary 
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  color: location.pathname === item.path 
                    ? muiTheme.palette.primary.main 
                    : muiTheme.palette.text.primary
                }
              }}
            />
          </ListItem>
        ))}
      </List>
      
      {filteredAdminItems.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <List>
            {filteredAdminItems.map(item => (
              <ListItem 
                button 
                key={item.text} 
                onClick={() => handleNavigation(item.path)}
                sx={{
                  backgroundColor: location.pathname === item.path 
                    ? alpha(muiTheme.palette.error.main, darkMode ? 0.15 : 0.1)
                    : 'transparent',
                  borderRight: location.pathname === item.path 
                    ? `3px solid ${muiTheme.palette.error.main}`
                    : 'none',
                  '&:hover': {
                    backgroundColor: alpha(muiTheme.palette.error.main, darkMode ? 0.1 : 0.05)
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: location.pathname === item.path 
                    ? muiTheme.palette.error.main 
                    : muiTheme.palette.text.secondary 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{ 
                    '& .MuiTypography-root': {
                      fontWeight: location.pathname === item.path ? 600 : 400,
                      color: location.pathname === item.path 
                        ? muiTheme.palette.error.main 
                        : muiTheme.palette.text.primary
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
  
  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          background: darkMode 
            ? alpha(muiTheme.palette.background.paper, 0.95) 
            : muiTheme.palette.background.paper,
          boxSizing: 'border-box',
          boxShadow: 'none',
          width: 240,
          pt: { xs: 7, sm: 8 }, // Header'ın altında görünmesi için padding
          backdropFilter: 'blur(8px)'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar; 