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
  Avatar
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
import { useOnlineStatus } from '../context/OnlineStatusContext';

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
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
  const { isUserOnline } = useOnlineStatus();
  
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
      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: darkMode 
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.background.paper, 0.8)
        }}
      >
        <List sx={{ padding: 0 }}>
          {friends.map((friend, index) => (
            <React.Fragment key={friend.id}>
              <ListItem 
                sx={{ 
                  py: 2,
                  px: { xs: 2, sm: 3 },
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <ListItemAvatar sx={{ mr: 2 }}>
                  <StatusAvatar 
                    src={friend.avatar_url || undefined} 
                    alt={friend.username}
                    size={56}
                    isOnline={isUserOnline(friend.id)}
                    sx={{ 
                      border: `2px solid ${isUserOnline(friend.id) ? theme.palette.success.main : theme.palette.grey[500]}`,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                </ListItemAvatar>
                
                <ListItemText 
                  primary={
                    <RouterLink 
                      to={`/user/${friend.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Typography 
                        variant="h6" 
                        component="span"
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: '1rem', sm: '1.1rem' },
                          color: 'text.primary',
                          '&:hover': {
                            color: theme.palette.primary.main
                          }
                        }}
                      >
                        {friend.username}
                      </Typography>
                    </RouterLink>
                  }
                  sx={{ my: 0 }}
                />
                
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Mesaj göndər">
                      <span>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          disabled={true}
                          sx={{ 
                            borderRadius: 1.5,
                            opacity: 0.7,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        >
                          <ChatIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Dostluqdan Çıxar">
                      <span>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveFriend(friend.id)}
                          sx={{ 
                            borderRadius: 1.5,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.error.main, 0.1)
                            }
                          }}
                        >
                          <PersonRemoveIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
              
              {index < friends.length - 1 && (
                <Divider component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    );
  };

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
      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: darkMode 
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.background.paper, 0.8)
        }}
      >
        <List sx={{ padding: 0 }}>
          {incomingRequests.map((request, index) => (
            <React.Fragment key={request.id}>
              <ListItem 
                sx={{ 
                  py: 2,
                  px: { xs: 2, sm: 3 },
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <ListItemAvatar sx={{ mr: 2 }}>
                  <StatusAvatar
                    src={request.sender?.avatar_url || undefined}
                    alt={request.sender?.username || ''}
                    size={56}
                    isOnline={request.sender?.id ? isUserOnline(request.sender.id) : false}
                    sx={{
                      border: `2px solid ${theme.palette.info.main}`
                    }}
                  />
                </ListItemAvatar>
                
                <ListItemText 
                  primary={
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
                          fontSize: { xs: '1rem', sm: '1.1rem' },
                          '&:hover': {
                            color: theme.palette.primary.main
                          }
                        }}
                      >
                        {request.sender?.username}
                      </Typography>
                    </RouterLink>
                  }
                  secondary={
                    <Box component="span" sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 0.5
                    }}>
                      <EmailIcon fontSize="small" color="info" sx={{ fontSize: 16 }} />
                      <Typography variant="body2" component="span" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        Sizə dostluq istəyi göndərdi
                      </Typography>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction sx={{ 
                  display: 'flex', 
                  gap: 1,
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center'
                }}>
                  <Button 
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleAcceptRequest(request.id)}
                    size="small"
                    sx={{ 
                      borderRadius: 1.5,
                      minWidth: { xs: '36px', sm: '110px' },
                      mb: { xs: 1, sm: 0 },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Qəbul Et</Box>
                    <CheckCircleIcon sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 20 }} />
                  </Button>
                  
                  <Button 
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleRejectRequest(request.id)}
                    size="small"
                    sx={{ 
                      borderRadius: 1.5,
                      minWidth: { xs: '36px', sm: '110px' },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Rədd Et</Box>
                    <CancelIcon sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 20 }} />
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              
              {index < incomingRequests.length - 1 && (
                <Divider component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    );
  };

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
      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: darkMode 
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.background.paper, 0.8)
        }}
      >
        <List sx={{ padding: 0 }}>
          {outgoingRequests.map((request, index) => (
            <React.Fragment key={request.id}>
              <ListItem 
                sx={{ 
                  py: 2,
                  px: { xs: 2, sm: 3 },
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.warning.main, 0.05)
                  }
                }}
              >
                <ListItemAvatar sx={{ mr: 2 }}>
                  <StatusAvatar
                    src={request.receiver?.avatar_url || undefined}
                    alt={request.receiver?.username || ''}
                    size={56}
                    isOnline={request.receiver?.id ? isUserOnline(request.receiver.id) : false}
                    sx={{
                      border: `2px solid ${theme.palette.warning.main}`
                    }}
                  />
                </ListItemAvatar>
                
                <ListItemText 
                  primary={
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
                          fontSize: { xs: '1rem', sm: '1.1rem' },
                          '&:hover': {
                            color: theme.palette.primary.main
                          }
                        }}
                      >
                        {request.receiver?.username}
                      </Typography>
                    </RouterLink>
                  }
                  secondary={
                    <Box component="span" sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 0.5
                    }}>
                      <AccessTimeIcon fontSize="small" color="warning" sx={{ fontSize: 16 }} />
                      <Typography variant="body2" component="span" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        İstək göndərildi, cavab gözlənilir
                      </Typography>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Button 
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
                    onClick={() => handleCancelRequest(request.id)}
                    size="small"
                    sx={{ 
                      borderRadius: 1.5,
                      minWidth: { xs: '36px', sm: '110px' },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Ləğv Et</Box>
                    <CancelIcon sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 20 }} />
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              
              {index < outgoingRequests.length - 1 && (
                <Divider component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    );
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return null;
    }

    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Axtarış Nəticələri
        </Typography>
        <Paper
          elevation={1}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: darkMode 
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.paper, 0.8)
          }}
        >
          <List sx={{ padding: 0 }}>
            {searchResults.map((user, index) => (
              <React.Fragment key={user.id}>
                <ListItem 
                  sx={{ 
                    py: 2,
                    px: { xs: 2, sm: 3 },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.05)
                    }
                  }}
                >
                  <ListItemAvatar sx={{ mr: 2 }}>
                    <StatusAvatar
                      src={user.avatar_url || undefined}
                      alt={user.username}
                      size={56}
                      isOnline={isUserOnline(user.id)}
                      sx={{ 
                        border: `2px solid ${theme.palette.secondary.main}`
                      }}
                    />
                  </ListItemAvatar>
                  
                  <ListItemText 
                    primary={
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
                            fontSize: { xs: '1rem', sm: '1.1rem' },
                            '&:hover': {
                              color: theme.palette.primary.main
                            }
                          }}
                        >
                          {user.username}
                        </Typography>
                      </RouterLink>
                    }
                    secondary={
                      <Chip
                        size="small"
                        label={`ID: ${user.id}`}
                        color="default"
                        sx={{ 
                          mt: 0.5,
                          fontSize: '0.7rem',
                          opacity: 0.7,
                          height: 22
                        }}
                      />
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    {requestSentUsers.includes(user.id) ? (
                      <span>
                        <Button 
                          variant="outlined"
                          color="info"
                          startIcon={<AccessTimeIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
                          disabled={true}
                          size="small"
                          sx={{ 
                            borderRadius: 1.5,
                            minWidth: { xs: '36px', sm: '140px' },
                            px: { xs: 1, sm: 2 }
                          }}
                        >
                          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>İstək Göndərildi</Box>
                          <AccessTimeIcon sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 20 }} />
                        </Button>
                      </span>
                    ) : (
                      <Button 
                        variant="contained"
                        color="primary"
                        startIcon={<PersonAddIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
                        onClick={() => handleSendRequest(user.id)}
                        size="small"
                        sx={{ 
                          borderRadius: 1.5,
                          minWidth: { xs: '36px', sm: '140px' },
                          px: { xs: 1, sm: 2 }
                        }}
                      >
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Dost Əlavə Et</Box>
                        <PersonAddIcon sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 20 }} />
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                
                {index < searchResults.length - 1 && (
                  <Divider component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2, px: { xs: 2, sm: 0 } }}>
        Dostlar
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          background: darkMode 
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.7),
          backdropFilter: 'blur(10px)',
          mx: { xs: 2, sm: 0 }
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="dostluq səkmələri"
            sx={{
              '& .MuiTab-root': {
                py: 2,
                px: 2,
                fontWeight: 600,
                transition: 'all 0.3s ease',
                minHeight: { xs: '48px', sm: '56px' },
                fontSize: { xs: '0.775rem', sm: '0.875rem' },
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
            <Tab label={`Dostlarım (${friends.length})`} />
            <Tab label={`Gələn (${incomingRequests.length})`} />
            <Tab label={`Göndərilən (${outgoingRequests.length})`} />
            <Tab label="Axtar" />
          </Tabs>
        </Box>
        
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
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="İstifadəçi adı axtar..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: darkMode 
                    ? alpha(theme.palette.background.default, 0.5)
                    : alpha('#fff', 0.9),
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
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
                      <span>
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
                      </span>
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
          </Box>
          
          {renderSearchResults()}
          
          {!searchQuery && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                İstifadəçi tapmaq üçün yuxarıdakı axtarış qutusundan istifadə edin
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, opacity: 0.7 }}>
                Ən azı 2 hərf daxil edin
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default FriendsPage; 