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
  Avatar,
  Chip,
  Tooltip,
  IconButton,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  useMediaQuery,
  Stack,
  Badge,
  InputAdornment,
  Select,
  MenuItem
} from '@mui/material';
import { Link } from 'react-router-dom';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RemoveModeratorIcon from '@mui/icons-material/RemoveModerator';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { formatDate } from '../utils/movieHelpers';
import UserCommentsModal from '../components/Admin/UserCommentsModal';
import StatusAvatar from '../components/Common/StatusAvatar';
import { useSocketContext } from '../context/SocketContext';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import EventNoteIcon from '@mui/icons-material/EventNote';

interface UserForAdmin {
  id: number;
  username: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  is_admin: boolean;
  comment_count?: number;
}

interface EditUserDialogProps {
  open: boolean;
  user: UserForAdmin | null;
  onClose: () => void;
  onSave: (userId: number, data: { username?: string; email?: string }) => void;
  isSaving: boolean;
}

const EditUserDialog = ({ open, user, onClose, onSave, isSaving }: EditUserDialogProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const data: { username?: string; email?: string } = {};
    if (username && username !== user.username) data.username = username;
    if (email && email !== user.email) data.email = email;
    
    if (Object.keys(data).length === 0) {
      onClose();
      return;
    }
    
    onSave(user.id, data);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          width: { sm: '450px' },
          maxWidth: '100%'
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), pb: 1 }}>
        İstifadəçini Redaktə Et
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="İstifadəçi adı"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              InputLabelProps={{ shrink: true }}
              disabled={isSaving}
            />
            <TextField
              label="E-poçt"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isSaving}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={onClose} 
            color="inherit" 
            disabled={isSaving}
            variant="outlined"
          >
            Ləğv et
          </Button>
          <Button 
            type="submit" 
            color="secondary" 
            variant="contained"
            disabled={isSaving}
            sx={{ minWidth: '100px' }}
          >
            {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Saxla'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

interface DeleteUserDialogProps {
  open: boolean;
  user: UserForAdmin | null;
  onClose: () => void;
  onConfirm: (userId: number) => void;
  isDeleting: boolean;
}

const DeleteUserDialog = ({ open, user, onClose, onConfirm, isDeleting }: DeleteUserDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          width: { sm: '450px' },
          maxWidth: '100%'
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), pb: 1, color: theme.palette.error.main }}>
        İstifadəçini Sil
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <DialogContentText>
          <strong>{user?.username}</strong> istifadəçisini silmək istədiyinizə əminsiniz? 
          Bu əməliyyat geri qaytarıla bilməz və istifadəçinin bütün məlumatları silinəcək.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          color="inherit" 
          disabled={isDeleting}
          variant="outlined"
        >
          Ləğv et
        </Button>
        <Button 
          onClick={() => user && onConfirm(user.id)} 
          color="error" 
          variant="contained"
          disabled={isDeleting}
          sx={{ minWidth: '100px' }}
        >
          {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Sil'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * @az Admin İstifadəçi İdarəetmə Səhifəsi
 * @desc İstifadəçiləri admin panelində idarə etmək üçün interfeys.
 */
const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useSocketContext();
  const [users, setUsers] = useState<UserForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserForAdmin | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 600) {
      return 'card';
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-users-view-mode') === 'card' ? 'card' : 'list';
    }
    return 'list';
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'username' | 'created_at' | 'is_admin'>('id');

  useEffect(() => {
    const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
        const res = await userAPI.getAllUsers();
        setUsers(res);
        setUsersRaw(res);
      } catch (err) {
        setError('İstifadəçilər yüklənərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
    };
    fetchUsers();
  }, []);

  const handleAdminStatusChange = async (userId: number, currentStatus: boolean) => {
    try {
      await userAPI.setUserAdminStatus(userId, !currentStatus);
      setUsers(users.map(u => (u.id === userId ? { ...u, is_admin: !currentStatus } : u)));
    } catch (err) {
        setError('Admin statusu yenilənərkən xəta baş verdi.');
    }
  };

  const handleEditUser = (user: UserForAdmin) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async (userId: number, data: { username?: string; email?: string }) => {
    setIsSaving(true);
    try {
      const res = await userAPI.updateUser(userId, data);
      setUsers(users.map(u => (u.id === userId ? { ...u, ...res.data } : u)));
      setEditDialogOpen(false);
    } catch (err) {
        setError('İstifadəçi yenilənərkən xəta baş verdi.');
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteUser = (user: UserForAdmin) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (userId: number) => {
    setIsDeleting(true);
    try {
      await userAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setDeleteDialogOpen(false);
    } catch (err) {
        setError('İstifadəçi silinərkən xəta baş verdi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCommentsModal = (user: UserForAdmin) => {
    setSelectedUser(user);
    setCommentsModalOpen(true);
  };

  const [usersRaw, setUsersRaw] = useState<UserForAdmin[]>([]);

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'id') return a.id - b.id;
    if (sortBy === 'username') return a.username.localeCompare(b.username);
    if (sortBy === 'created_at') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'is_admin') return (b.is_admin ? 1 : 0) - (a.is_admin ? 1 : 0);
    return 0;
  });

  // Arama kutusu anlık filtreleme
  useEffect(() => {
    setUsers(
      usersRaw.filter(u =>
        (searchQuery === '' ||
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(u.id) === searchQuery)
      )
    );
  }, [searchQuery, usersRaw]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress color="secondary" />
        </Box>
      );
    }
    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      );
    }
    if (users.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>İstifadəçi tapılmadı.</Alert>
      );
    }

    if (viewMode === 'list' && !isMobile) {
      return (
        <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2, overflow: 'auto', minWidth: { xs: 600, sm: 'unset' } }}>
          <Table stickyHeader sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableCell sx={{ fontWeight: 'bold' }}>İstifadəçi</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>E-poçt</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Qeydiyyat Tarixi</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Admin</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Əməliyyatlar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedUsers.map((user) => {
                const isOnline = onlineUsers.includes(user.id);
                return (
                  <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StatusAvatar 
                          isOnline={onlineUsers.includes(user.id)}
                          avatarUrl={user.avatar_url}
                          username={user.username}
                          sx={{ width: 32, height: 32, mr: 1 }}
                        />
                        <Link 
                          to={`/user/${user.id}`} 
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Typography variant="body2" fontWeight="bold">
                            {user.username}
                          </Typography>
                        </Link>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '4px' }}>
                        <MailOutlineIcon sx={{ fontSize: 18, color: theme.palette.primary.main, mr: '4px' }} />
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>{user.email || '-'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '8px' }}>
                        <EventNoteIcon sx={{ fontSize: 18, color: theme.palette.primary.main, mr: '4px' }} />
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>{formatDate(user.created_at)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                  <Chip
                        label={user.is_admin ? 'Admin' : 'İstifadəçi'}
                        color={user.is_admin ? 'secondary' : 'default'}
                    size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} justifyContent="flex-start">
                        <Tooltip title="Admin Statusu Dəyişdir">
                          <IconButton
                            onClick={() => handleAdminStatusChange(user.id, user.is_admin)}
                            color={user.is_admin ? 'secondary' : 'default'}
                            disabled={currentUser?.id === user.id}
                            sx={{ '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.1) } }}
                          >
                            {user.is_admin ? <RemoveModeratorIcon /> : <AdminPanelSettingsIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Redaktə Et">
                  <IconButton
                    onClick={() => handleEditUser(user)}
                            sx={{ '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }}
                          >
                            <EditIcon color="info" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Yorumları Gör">
                          <IconButton
                            onClick={() => handleOpenCommentsModal(user)}
                            sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
                          >
                            <ChatBubbleOutlineIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            onClick={() => handleDeleteUser(user)}
                            disabled={currentUser?.id === user.id}
                            sx={{ '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
                          >
                            <DeleteIcon color="error" />
                  </IconButton>
                </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else {
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, p: 2 }}>
          {sortedUsers.map((user) => {
            const isOnline = onlineUsers.includes(user.id);
            return (
              <Paper key={user.id} sx={{ p: 2, boxShadow: 2, borderRadius: 2, transition: 'all 0.3s', '&:hover': { boxShadow: 6, bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 1 }}>
                  <StatusAvatar isOnline={isOnline} avatarUrl={user.avatar_url} username={user.username} />
                  <Link 
                    to={`/user/${user.id}`} 
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{user.username}</Typography>
                  </Link>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '4px' }}>
                  <MailOutlineIcon sx={{ fontSize: 18, color: theme.palette.primary.main, mr: '4px' }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>{user.email || '-'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '8px' }}>
                  <EventNoteIcon sx={{ fontSize: 18, color: theme.palette.primary.main, mr: '4px' }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>{formatDate(user.created_at)}</Typography>
                </Box>
                <Chip
                  label={user.is_admin ? 'Admin' : 'İstifadəçi'}
                  color={user.is_admin ? 'secondary' : 'default'}
                  size="small"
                  sx={{ mb: 2, fontWeight: 'bold' }}
                />
                <Stack direction="row" spacing={1} justifyContent="flex-start">
                  <Tooltip title="Admin Statusu Dəyişdir">
                    <IconButton
                      onClick={() => handleAdminStatusChange(user.id, user.is_admin)}
                      color={user.is_admin ? 'secondary' : 'default'}
                      disabled={currentUser?.id === user.id}
                      sx={{ '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.1) } }}
                    >
                      {user.is_admin ? <RemoveModeratorIcon /> : <AdminPanelSettingsIcon />}
                    </IconButton>
                </Tooltip>
                  <Tooltip title="Redaktə Et">
                    <IconButton
                      onClick={() => handleEditUser(user)}
                      sx={{ '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }}
                    >
                      <EditIcon color="info" />
                    </IconButton>
                </Tooltip>
                  <Tooltip title="Yorumları Gör">
                  <IconButton
                    onClick={() => handleOpenCommentsModal(user)}
                      sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
                    >
                      <ChatBubbleOutlineIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton
                      onClick={() => handleDeleteUser(user)}
                      disabled={currentUser?.id === user.id}
                      sx={{ '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
                    >
                      <DeleteIcon color="error" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
            );
          })}
        </Box>
      );
    }
  };

    return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="ID və ya istifadəçi adı ilə axtar..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            sx={{ minWidth: 220, bgcolor: theme.palette.background.paper, borderRadius: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon color="primary" />
                </InputAdornment>
              )
            }}
          />
        </Box>
        <Stack direction="row" spacing={1}>
          {!isMobile && (
            <>
              <Button
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => {
                  setViewMode('list');
                  localStorage.setItem('admin-users-view-mode', 'list');
                }}
                sx={{ borderRadius: 2, minWidth: 40, p: 1 }}
              >
                <ViewListIcon />
              </Button>
              <Button
                variant={viewMode === 'card' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => {
                  setViewMode('card');
                  localStorage.setItem('admin-users-view-mode', 'card');
                }}
                sx={{ borderRadius: 2, minWidth: 40, p: 1 }}
              >
                <ViewModuleIcon />
              </Button>
            </>
          )}
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
                      size="small"
            startAdornment={<SortIcon sx={{ mr: 1, color: theme.palette.primary.main }} />}
            sx={{
              borderRadius: 2,
              minWidth: 140,
              bgcolor: theme.palette.background.paper,
              fontWeight: 500,
              fontSize: '1rem',
              '.MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1 },
            }}
          >
            <MenuItem value="id">ID</MenuItem>
            <MenuItem value="username">İstifadəçi adı</MenuItem>
            <MenuItem value="created_at">Qeydiyyat tarixi</MenuItem>
            <MenuItem value="is_admin">Admin statusu</MenuItem>
          </Select>
                  </Stack>
      </Box>
      {renderContent()}
      {editDialogOpen && selectedUser && (
      <EditUserDialog 
          open={editDialogOpen}
          user={selectedUser}
          onClose={() => setEditDialogOpen(false)}
        onSave={handleUpdateUser}
          isSaving={isSaving}
      />
      )}
      {deleteDialogOpen && selectedUser && (
      <DeleteUserDialog
          open={deleteDialogOpen}
          user={selectedUser}
          onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
      )}
      {commentsModalOpen && selectedUser && (
      <UserCommentsModal 
          open={commentsModalOpen}
          onClose={() => setCommentsModalOpen(false)}
          userId={selectedUser.id}
          username={selectedUser.username}
        />
      )}
    </Box>
  );
};

export default AdminUsersPage; 