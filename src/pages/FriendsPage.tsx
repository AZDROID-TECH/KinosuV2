import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  Grid, 
  Avatar, 
  Button, 
  IconButton, 
  TextField, 
  InputAdornment, 
  Stack,
  Chip,
  Divider,
  Tooltip,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Person from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendContext';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { apiClient } from '../services/apiClient';
import { showErrorToast, showSuccessToast, showInfoToast } from '../utils/toastHelper';

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
  const [selectedUser, setSelectedUser] = useState<{id: number, username: string} | null>(null);
  const [requestSentUsers, setRequestSentUsers] = useState<number[]>([]);
  
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
    removeFriend,
    checkFriendshipStatus
  } = useFriends();

  useEffect(() => {
    if (isLoggedIn) {
      refreshFriends();
      refreshIncomingRequests();
      refreshOutgoingRequests();
    }
  }, [isLoggedIn]);

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
          {friends.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Hələ dostunuz yoxdur
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<PersonAddIcon />}
                onClick={() => setTabValue(3)}
                sx={{ mt: 2 }}
              >
                Dost Əlavə Et
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {friends.map(friend => (
                <Grid item xs={12} sm={6} md={4} key={friend.id}>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        transform: 'translateY(-4px)'
                      },
                      bgcolor: darkMode 
                        ? alpha(theme.palette.background.default, 0.3)
                        : alpha(theme.palette.background.paper, 0.7)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar 
                        src={friend.avatar_url || undefined} 
                        alt={friend.username}
                        sx={{ 
                          width: 64, 
                          height: 64,
                          border: `2px solid ${theme.palette.primary.main}`,
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        {!friend.avatar_url && <Person />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            display: 'block',
                            mb: 0.5,
                            color: 'text.primary'
                          }}
                        >
                          {friend.username}
                        </Typography>
                        <Chip 
                          size="small" 
                          label="Dost" 
                          color="primary"
                          sx={{ 
                            height: 24, 
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        component={RouterLink}
                        to={`/user/${friend.id}`}
                        sx={{ 
                          borderRadius: 1.5, 
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                      >
                        Profil
                      </Button>
                      
                      <Tooltip title="Dostluqdan Çıxar">
                        <IconButton 
                          size="medium" 
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
                      </Tooltip>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        {/* Gelen İstekler Paneli */}
        <TabPanel value={tabValue} index={1}>
          {incomingRequests.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                Heç bir gələn dostluq istəyi yoxdur
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {incomingRequests.map((request) => (
                <Grid item xs={12} sm={6} key={request.id}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'center', sm: 'flex-start' },
                      gap: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      height: '100%'
                    }}
                  >
                    <Avatar
                      src={request.sender?.avatar_url || undefined}
                      sx={{
                        width: 72,
                        height: 72,
                        bgcolor: theme.palette.info.main,
                        border: `3px solid ${theme.palette.info.main}`
                      }}
                    >
                      {!request.sender?.avatar_url && request.sender?.username[0].toUpperCase()}
                    </Avatar>
                    
                    <Box sx={{ 
                      flexGrow: 1,
                      textAlign: { xs: 'center', sm: 'left' },
                      mb: { xs: 2, sm: 0 }
                    }}>
                      <Typography 
                        variant="h6" 
                        component={RouterLink}
                        to={`/user/${request.sender?.id}`}
                        sx={{ 
                          textDecoration: 'none', 
                          color: 'text.primary',
                          fontWeight: 600,
                          display: 'block',
                          mb: 1,
                          '&:hover': {
                            color: theme.palette.primary.main
                          }
                        }}
                      >
                        {request.sender?.username}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: { xs: 'center', sm: 'flex-start' },
                        gap: 1,
                        mb: 2
                      }}>
                        <EmailIcon fontSize="small" color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          Sizə dostluq istəyi göndərdi
                        </Typography>
                      </Box>
                      
                      <Stack direction="row" spacing={2} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                        <Button 
                          variant="contained"
                          color="primary"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleAcceptRequest(request.id)}
                          size="small"
                          sx={{ borderRadius: 1.5 }}
                        >
                          Qəbul Et
                        </Button>
                        
                        <Button 
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleRejectRequest(request.id)}
                          size="small"
                          sx={{ borderRadius: 1.5 }}
                        >
                          Rədd Et
                        </Button>
                      </Stack>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        {/* Giden İstekler Paneli */}
        <TabPanel value={tabValue} index={2}>
          {outgoingRequests.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                Heç bir göndərilmiş dostluq istəyi yoxdur
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<PersonAddIcon />}
                onClick={() => setTabValue(3)}
                sx={{ mt: 2 }}
              >
                Dost Əlavə Et
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {outgoingRequests.map((request) => (
                <Grid item xs={12} sm={6} key={request.id}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'center', sm: 'flex-start' },
                      gap: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                      height: '100%'
                    }}
                  >
                    <Avatar
                      src={request.receiver?.avatar_url || undefined}
                      sx={{
                        width: 72,
                        height: 72,
                        bgcolor: theme.palette.warning.main,
                        border: `3px solid ${theme.palette.warning.main}`
                      }}
                    >
                      {!request.receiver?.avatar_url && request.receiver?.username[0].toUpperCase()}
                    </Avatar>
                    
                    <Box sx={{ 
                      flexGrow: 1,
                      textAlign: { xs: 'center', sm: 'left' },
                      mb: { xs: 2, sm: 0 }
                    }}>
                      <Typography 
                        variant="h6" 
                        component={RouterLink}
                        to={`/user/${request.receiver?.id}`}
                        sx={{ 
                          textDecoration: 'none', 
                          color: 'text.primary',
                          fontWeight: 600,
                          display: 'block',
                          mb: 1,
                          '&:hover': {
                            color: theme.palette.primary.main
                          }
                        }}
                      >
                        {request.receiver?.username}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: { xs: 'center', sm: 'flex-start' },
                        gap: 1,
                        mb: 2
                      }}>
                        <AccessTimeIcon fontSize="small" color="warning" />
                        <Typography variant="body2" color="text.secondary">
                          İstək göndərildi, cavab gözlənilir
                        </Typography>
                      </Box>
                      
                      <Button 
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleCancelRequest(request.id)}
                        size="small"
                        sx={{ borderRadius: 1.5 }}
                      >
                        İstəyi Ləğv Et
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
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
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleSearch}
                      disabled={!searchQuery.trim() || isSearching}
                      sx={{ 
                        borderRadius: 1.5, 
                        px: 2,
                        minWidth: '80px',
                        height: '36px'
                      }}
                    >
                      {isSearching ? <CircularProgress size={24} color="inherit" /> : 'Axtar'}
                    </Button>
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
          
          {searchResults.length > 0 ? (
            <Grid container spacing={3}>
              {searchResults.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: darkMode 
                        ? alpha(theme.palette.background.default, 0.3)
                        : alpha(theme.palette.background.paper, 0.7),
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={user.avatar_url || undefined}
                        sx={{
                          width: 84,
                          height: 84,
                          mb: 2,
                          bgcolor: theme.palette.secondary.main,
                          border: `3px solid ${theme.palette.secondary.main}`,
                          '&:hover': {
                            opacity: 0.9,
                            transform: 'scale(1.05)'
                          },
                          transition: 'transform 0.2s'
                        }}
                      >
                        {!user.avatar_url && user.username[0].toUpperCase()}
                      </Avatar>
                      
                      <Typography 
                        variant="h6" 
                        component={RouterLink}
                        to={`/user/${user.id}`}
                        sx={{ 
                          textDecoration: 'none', 
                          color: 'text.primary',
                          fontWeight: 600,
                          mb: 1,
                          textAlign: 'center',
                          '&:hover': {
                            color: theme.palette.primary.main
                          }
                        }}
                      >
                        {user.username}
                      </Typography>

                      <Chip
                        size="small"
                        label={`İstifadəçi ID: ${user.id}`}
                        color="default"
                        sx={{ 
                          mb: 2,
                          fontSize: '0.75rem',
                          opacity: 0.7,
                          height: 24
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
                      {requestSentUsers.includes(user.id) ? (
                        <Button 
                          variant="outlined" 
                          color="primary"
                          startIcon={<AccessTimeIcon />}
                          disabled
                          fullWidth
                          sx={{ 
                            borderRadius: 1.5,
                            py: 1
                          }}
                        >
                          İstək Göndərildi
                        </Button>
                      ) : (
                        <Button 
                          variant="contained" 
                          color="primary"
                          startIcon={<PersonAddIcon />}
                          onClick={() => handleSendRequest(user.id)}
                          fullWidth
                          sx={{ 
                            borderRadius: 1.5,
                            py: 1
                          }}
                        >
                          Dost Əlavə Et
                        </Button>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            searchQuery && !isSearching && (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  Axtarış nəticəsində heç bir istifadəçi tapılmadı
                </Typography>
              </Box>
            )
          )}
          
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