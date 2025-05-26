import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  Button, 
  IconButton, 
  TextField, 
  InputAdornment, 
  Chip,
  Divider,
  Tooltip,
  useTheme,
  alpha,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Stack,
  Avatar,
  Grid,
  Card,
  Badge,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Person from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatIcon from '@mui/icons-material/Chat';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendContext';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { apiClient } from '../services/apiClient';
import { showErrorToast, showInfoToast } from '../utils/toastHelper';
import StatusAvatar from '../components/Common/StatusAvatar';
import { useSocketContext } from '../context/SocketContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`friend-tabpanel-${index}`}
      aria-labelledby={`friend-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          {children}
        </Box>
      )}
    </div>
  );
};

/**
 * @az Dostlar Səhifəsi
 * @desc İstifadəçinin dostlarını və dostluq istəklərini idarə etmək üçün səhifə
 */
const FriendsPage: React.FC = () => {
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const { isLoggedIn } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: number, username: string, avatar_url: string | null}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestSentUsers, setRequestSentUsers] = useState<number[]>([]);
  const { isUserOnline, lastSeen, formatLastSeen, requestUserLastSeen } = useSocketContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { 
    friends, 
    incomingRequests, 
    outgoingRequests, 
    refreshFriends, 
    refreshIncomingRequests,
    refreshOutgoingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  } = useFriends();

  useEffect(() => {
    if (isLoggedIn) {
      refreshFriends();
      refreshIncomingRequests();
      refreshOutgoingRequests();
    }
  }, [isLoggedIn, refreshFriends, refreshIncomingRequests, refreshOutgoingRequests]);

  useEffect(() => {
    // Giden isteklerdeki alıcı ID'lerini requestSentUsers listesine ekle
    const receiverIds = outgoingRequests
      .filter(request => request.receiver?.id)
      .map(request => request.receiver!.id);
    
    setRequestSentUsers(receiverIds);
  }, [outgoingRequests]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await apiClient.get(`user/search?q=${searchQuery}`);
      setSearchResults(response.data);
      
      if (response.data.length === 0) {
        showInfoToast('Heç bir istifadəçi tapılmadı');
      }
    } catch (error) {
      console.error('İstifadəçi axtarışında xəta:', error);
      showErrorToast('İstifadəçi axtarışı zamanı xəta baş verdi');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: number) => {
    try {
      await sendFriendRequest(userId);
      // İstek gönderilen kullanıcıları listeye ekle
      setRequestSentUsers(prev => [...prev, userId]);
      // Arama sonuçlarını yenile
      handleSearch();
      // Giden istekleri yenile
      refreshOutgoingRequests();
    } catch (error) {
      console.error('Dostluq istəyi göndərilərkən xəta:', error);
      showErrorToast('Dostluq istəyi göndərilə bilmədi');
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      // Dostları ve gelen istekleri yenile
      refreshFriends();
      refreshIncomingRequests();
    } catch (error) {
      console.error('Dostluq istəyi qəbul edilərkən xəta:', error);
      showErrorToast('Dostluq istəyi qəbul edilə bilmədi');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId);
      // Gelen istekleri yenile
      refreshIncomingRequests();
    } catch (error) {
      console.error('Dostluq istəyi rədd edilərkən xəta:', error);
      showErrorToast('Dostluq istəyi rədd edilə bilmədi');
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      await removeFriend(friendId);
      // Dostları yenile
      refreshFriends();
    } catch (error) {
      console.error('Dost silinərkən xəta:', error);
      showErrorToast('Dost silə bilmədi');
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId);
      // Giden istekleri yenile
      refreshOutgoingRequests();
    } catch (error) {
      console.error('Dostluq istəyi ləğv edilərkən xəta:', error);
      showErrorToast('Dostluq istəyi ləğv edilə bilmədi');
    }
  };

  // İşlevsellik aynı, ancak tasarım değiştirildi - kart içinde kart görünümü azaltıldı
  const renderFriends = () => {
    if (friends.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Dostlar siyahınız boşdur
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {friends.map((friend) => (
          <Grid item xs={12} sm={6} md={4} key={friend.id}>
            <Card
              elevation={1}
              sx={{
                borderRadius: 2,
                p: 0,
                bgcolor: darkMode 
                  ? alpha(theme.palette.background.paper, 0.6)
                  : alpha(theme.palette.background.paper, 0.8),
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <Box
                sx={{
                  p: 2, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <StatusAvatar
                  avatarUrl={friend.avatar_url || undefined}
                  username={friend.username}
                  isOnline={isUserOnline(friend.id)}
                />
                
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <RouterLink 
                    to={`/user/${friend.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography 
                      variant="h6" 
                      component="span"
                      sx={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        color: 'text.primary',
                        display: 'block',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        mb: 0.5,
                        '&:hover': {
                          color: theme.palette.primary.main
                        }
                      }}
                    >
                      {friend.username}
                    </Typography>
                  </RouterLink>
                  
                  {isUserOnline(friend.id) ? (
                    <Chip 
                      size="small" 
                      color="success" 
                      label="Onlayn"
                      sx={{ height: 22, fontSize: '0.75rem' }} 
                    />
                  ) : (
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.2
                    }}>
                      <AccessTimeIcon sx={{ color: theme.palette.text.secondary, fontSize: 14 }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatLastSeen(lastSeen(friend.id))}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'center', mt: 'auto' }}>
                <Tooltip title="Mesaj göndər">
                  <span style={{ flexGrow: 1 }}>
                    <Button 
                      fullWidth
                      size="small" 
                      variant="outlined"
                      color="primary" 
                      disabled={true}
                      startIcon={<ChatIcon />}
                      sx={{ 
                        borderRadius: 1.5,
                        opacity: 0.7,
                      }}
                    >
                      Mesaj
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Dostluqdan Çıxar">
                  <Button 
                    size="small" 
                    variant="outlined"
                    color="error" 
                    onClick={() => handleRemoveFriend(friend.id)}
                    startIcon={<PersonRemoveIcon />}
                    sx={{ 
                      borderRadius: 1.5,
                    }}
                  >
                    Sil
                  </Button>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Yeni tasarım - gelen istekler için kart görünümü
  const renderIncomingRequests = () => {
    if (incomingRequests.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Heç bir gələn dostluq istəyi yoxdur
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {incomingRequests.map((request) => (
          <Grid item xs={12} sm={6} md={4} key={request.id}>
            <Card
              elevation={1}
              sx={{
                borderRadius: 2,
                p: 0,
                bgcolor: darkMode 
                  ? alpha(theme.palette.background.paper, 0.6)
                  : alpha(theme.palette.background.paper, 0.8),
                transition: 'all 0.2s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: `3px solid ${theme.palette.info.main}`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <Box
                sx={{
                  p: 2, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <StatusAvatar
                  avatarUrl={request.sender?.avatar_url || undefined}
                  username={request.sender?.username || ''}
                  isOnline={request.sender?.id ? isUserOnline(request.sender.id) : false}
                />
                
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <RouterLink 
                    to={`/user/${request.sender?.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography 
                      variant="h6" 
                      component="span"
                      sx={{ 
                        color: 'text.primary',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        display: 'block',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        mb: 0.5,
                        '&:hover': {
                          color: theme.palette.primary.main
                        }
                      }}
                    >
                      {request.sender?.username}
                    </Typography>
                  </RouterLink>
                  
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}>
                    <EmailIcon fontSize="small" color="info" sx={{ fontSize: 16 }} />
                    <Typography variant="caption" component="span" color="text.secondary">
                      Sizə dostluq istəyi göndərdi
                    </Typography>
                  </Box>

                  {request.sender?.id && !isUserOnline(request.sender.id) && (
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.5
                    }}>
                      <AccessTimeIcon sx={{ color: theme.palette.text.secondary, fontSize: 14 }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatLastSeen(lastSeen(request.sender.id))}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'space-between', mt: 'auto' }}>
                <Button 
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleAcceptRequest(request.id)}
                  size="small"
                  sx={{ 
                    borderRadius: 1.5,
                  }}
                >
                  Qəbul Et
                </Button>
                
                <Button 
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<CancelIcon />}
                  onClick={() => handleRejectRequest(request.id)}
                  size="small"
                  sx={{ 
                    borderRadius: 1.5,
                  }}
                >
                  Rədd Et
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Yeni tasarım - giden istekler için kart görünümü
  const renderOutgoingRequests = () => {
    if (outgoingRequests.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Heç bir göndərilmiş dostluq istəyi yoxdur
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {outgoingRequests.map((request) => (
          <Grid item xs={12} sm={6} md={4} key={request.id}>
            <Card
              elevation={1}
              sx={{
                borderRadius: 2,
                p: 0,
                bgcolor: darkMode 
                  ? alpha(theme.palette.background.paper, 0.6)
                  : alpha(theme.palette.background.paper, 0.8),
                transition: 'all 0.2s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: `3px solid ${theme.palette.warning.main}`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <Box
                sx={{
                  p: 2, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <StatusAvatar
                  avatarUrl={request.receiver?.avatar_url || undefined}
                  username={request.receiver?.username || ''}
                  isOnline={request.receiver?.id ? isUserOnline(request.receiver.id) : false}
                />
                
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <RouterLink 
                    to={`/user/${request.receiver?.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography 
                      variant="h6" 
                      component="span"
                      sx={{ 
                        color: 'text.primary',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        display: 'block',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        mb: 0.5,
                        '&:hover': {
                          color: theme.palette.primary.main
                        }
                      }}
                    >
                      {request.receiver?.username}
                    </Typography>
                  </RouterLink>
                  
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}>
                    <AccessTimeIcon fontSize="small" color="warning" sx={{ fontSize: 16 }} />
                    <Typography variant="caption" component="span" color="text.secondary">
                      İstək göndərildi, cavab gözlənilir
                    </Typography>
                  </Box>

                  {request.receiver?.id && !isUserOnline(request.receiver.id) && (
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.5
                    }}>
                      <AccessTimeIcon sx={{ color: theme.palette.text.secondary, fontSize: 14 }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatLastSeen(lastSeen(request.receiver.id))}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ p: 2, mt: 'auto' }}>
                <Button 
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<CancelIcon />}
                  onClick={() => handleCancelRequest(request.id)}
                  size="small"
                  sx={{ 
                    borderRadius: 1.5,
                  }}
                >
                  Ləğv Et
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Yeni tasarım - arama sonuçları için kart görünümü
  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return null;
    }

    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom mb={2}>
          Axtarış Nəticələri
        </Typography>
        <Grid container spacing={2}>
          {searchResults.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card
                elevation={1}
                sx={{
                  borderRadius: 2,
                  p: 0,
                  bgcolor: darkMode 
                    ? alpha(theme.palette.background.paper, 0.6)
                    : alpha(theme.palette.background.paper, 0.8),
                  transition: 'all 0.2s ease',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft: `3px solid ${theme.palette.secondary.main}`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <Box
                  sx={{
                    p: 2, 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <StatusAvatar
                    avatarUrl={user.avatar_url || undefined}
                    username={user.username}
                    isOnline={isUserOnline(user.id)}
                  />
                  
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <RouterLink 
                      to={`/user/${user.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Typography 
                        variant="h6" 
                        component="span"
                        sx={{ 
                          color: 'text.primary',
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          display: 'block',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          mb: 0.5,
                          '&:hover': {
                            color: theme.palette.primary.main
                          }
                        }}
                      >
                        {user.username}
                      </Typography>
                    </RouterLink>
                    
                    <Chip
                      size="small"
                      label={`ID: ${user.id}`}
                      color="default"
                      sx={{ 
                        fontSize: '0.7rem',
                        opacity: 0.7,
                        height: 22
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ p: 2, mt: 'auto' }}>
                  {requestSentUsers.includes(user.id) ? (
                    <Button 
                      variant="outlined"
                      color="info"
                      fullWidth
                      startIcon={<AccessTimeIcon />}
                      disabled={true}
                      size="small"
                      sx={{ 
                        borderRadius: 1.5,
                      }}
                    >
                      İstək Göndərildi
                    </Button>
                  ) : (
                    <Button 
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<PersonAddIcon />}
                      onClick={() => handleSendRequest(user.id)}
                      size="small"
                      sx={{ 
                        borderRadius: 1.5,
                      }}
                    >
                      Dost Əlavə Et
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Kullanıcılar için son görülme zamanlarını yükleme
  useEffect(() => {
    if (isLoggedIn) {
      // Tüm arkadaşlar için son görülme zamanlarını iste
      friends.forEach(friend => {
        if (!isUserOnline(friend.id)) {
          requestUserLastSeen(friend.id);
        }
      });
      
      // Gelen istekler için gönderenlerin son görülme zamanlarını iste
      incomingRequests.forEach(request => {
        if (request.sender?.id && !isUserOnline(request.sender.id)) {
          requestUserLastSeen(request.sender.id);
        }
      });
      
      // Giden istekler için alıcıların son görülme zamanlarını iste
      outgoingRequests.forEach(request => {
        if (request.receiver?.id && !isUserOnline(request.receiver.id)) {
          requestUserLastSeen(request.receiver.id);
        }
      });
    }
  }, [isLoggedIn, friends, incomingRequests, outgoingRequests, isUserOnline, requestUserLastSeen]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2, 
        px: { xs: 1, sm: 0 }
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '1.75rem', sm: '2.25rem' },
            fontWeight: 600 
          }}
        >
          Dostlar
        </Typography>
        <Badge 
          color="error" 
          badgeContent={incomingRequests.length} 
          max={99}
          sx={{ 
            '& .MuiBadge-badge': { 
              fontSize: '0.75rem',
              height: 18,
              minWidth: 18,
              padding: '0 4px'
            }
          }}
        >
          <Person />
        </Badge>
      </Box>
      
      <Card 
        elevation={2} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          background: darkMode 
            ? alpha(theme.palette.background.paper, 0.7)
            : alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mx: { xs: 0.5, sm: 0 }
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="dostluq səkmələri"
          sx={{
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              py: 2,
              px: { xs: 1.5, sm: 2 },
              fontWeight: 600,
              transition: 'all 0.3s ease',
              minHeight: { xs: '48px', sm: '56px' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minWidth: { xs: '60px', sm: 'auto' },
              '&:hover': {
                opacity: 0.8,
              }
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTabs-scrollButtons': {
              color: theme.palette.primary.main,
              '&.Mui-disabled': {
                opacity: 0.3,
              }
            }
          }}
        >
          <Tab 
            icon={<Person fontSize="small" />} 
            iconPosition="start"
            label={isMobile ? `(${friends.length})` : `Dostlarım (${friends.length})`} 
          />
          <Tab 
            icon={<EmailIcon fontSize="small" />}
            iconPosition="start"
            label={isMobile ? `(${incomingRequests.length})` : `Gələn (${incomingRequests.length})`}
            sx={{ 
              ...(incomingRequests.length > 0 && {
                '&::after': {
                  content: '""',
                  display: 'block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.error.main,
                  position: 'absolute',
                  top: 10,
                  right: 10,
                }
              })
            }}
          />
          <Tab 
            icon={<AccessTimeIcon fontSize="small" />}
            iconPosition="start"
            label={isMobile ? `(${outgoingRequests.length})` : `Göndərilən (${outgoingRequests.length})`} 
          />
          <Tab 
            icon={<SearchIcon fontSize="small" />}
            iconPosition="start"
            label={isMobile ? "" : "Axtar"} 
          />
        </Tabs>
        
        {/* Dostlarım Paneli */}
        <TabPanel value={tabValue} index={0}>
          {renderFriends()}
        </TabPanel>
        
        {/* Gelen İstekler Paneli */}
        <TabPanel value={tabValue} index={1}>
          {renderIncomingRequests()}
        </TabPanel>
        
        {/* Giden İstekler Paneli */}
        <TabPanel value={tabValue} index={2}>
          {renderOutgoingRequests()}
        </TabPanel>
        
        {/* Kullanıcı Arama Paneli */}
        <TabPanel value={tabValue} index={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="İstifadəçi adı axtar..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: darkMode 
                  ? alpha(theme.palette.background.default, 0.5)
                  : alpha('#fff', 0.9),
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {!searchQuery.trim() || isSearching ? (
                    <Button 
                      variant="contained" 
                      color="primary"
                      disabled={true}
                      sx={{ 
                        borderRadius: 1.5, 
                        px: 2,
                        minWidth: '80px',
                        height: '36px'
                      }}
                    >
                      {isSearching ? <CircularProgress size={24} color="inherit" /> : 'Axtar'}
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleSearch}
                      sx={{ 
                        borderRadius: 1.5, 
                        px: 2,
                        minWidth: '80px',
                        height: '36px'
                      }}
                    >
                      Axtar
                    </Button>
                  )}
                </InputAdornment>
              )
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                handleSearch();
              }
            }}
          />
          
          {renderSearchResults()}
          
          {!searchQuery && (
            <Box 
              textAlign="center" 
              py={4} 
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                opacity: 0.8
              }}
            >
              <SearchIcon color="disabled" sx={{ fontSize: 40, opacity: 0.7, mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                İstifadəçi tapmaq üçün yuxarıdakı axtarış qutusundan istifadə edin
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
                Ən azı 2 hərf daxil edin
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Card>
    </Container>
  );
};

export default FriendsPage; 