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
  Badge
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
  const { username: currentAdminUsername, userId: currentUserId } = useAuth(); 
  const theme = useTheme();
  const [users, setUsers] = useState<UserForAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // İşleme durumları
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<UserForAdmin | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserForAdmin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Yeni state'lər şərh modalı üçün
  const [selectedUserForComments, setSelectedUserForComments] = useState<UserForAdmin | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  // Bildiriş mesajı
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { isAdmin } = useAuth();
  const { isUserOnline } = useSocketContext();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedUsers = await userAPI.getAllUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error('İstifadəçi siyahısı alınarkən xəta:', err);
      const errorMessage = err.response?.data?.error || err.message || 'İstifadəçi siyahısı alınamadı.';
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleAdminStatusChange = async (userId: number, currentStatus: boolean) => {
    setUpdatingUserId(userId); 
    setError(null);
    try {
      await userAPI.setUserAdminStatus(userId, !currentStatus);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, is_admin: !currentStatus } : user
        )
      );
      setSuccessMessage(`İstifadəçinin admin statusu ${!currentStatus ? 'verildi' : 'alındı'}.`);
    } catch (err: any) {
      console.error(`Admin statusu dəyişdirilərkən xəta (ID: ${userId}):`, err);
      setError(err.response?.data?.error || 'Admin statusu yenilənərkən xəta baş verdi.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleEditUser = (user: UserForAdmin) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (userId: number, data: { username?: string; email?: string }) => {
    setIsEditSaving(true);
    setError(null);
    try {
      const response = await userAPI.updateUser(userId, data);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, ...data } : user
        )
      );
      setSuccessMessage('İstifadəçi məlumatları uğurla yeniləndi.');
      setIsEditSaving(false);
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      console.error(`İstifadəçi məlumatları yenilənərkən xəta (ID: ${userId}):`, err);
      setError(err.response?.data?.error || 'İstifadəçi məlumatları yenilənərkən xəta baş verdi.');
      setIsEditSaving(false);
    }
  };

  const handleDeleteUser = (user: UserForAdmin) => {
    setDeletingUser(user);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async (userId: number) => {
    setIsDeleting(true);
    setError(null);
    try {
      await userAPI.deleteUser(userId);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setSuccessMessage('İstifadəçi uğurla silindi.');
      setIsDeleting(false);
      setDeletingUser(null);
    } catch (err: any) {
      console.error(`İstifadəçi silinərkən xəta (ID: ${userId}):`, err);
      setError(err.response?.data?.error || 'İstifadəçi silinərkən xəta baş verdi.');
      setIsDeleting(false);
    }
  };

  // Yeni funksiya: Şərh modalını açmaq üçün
  const handleOpenCommentsModal = (user: UserForAdmin) => {
      setSelectedUserForComments(user);
      setIsCommentsModalOpen(true);
  };

  // -- Render Fonksiyonları --
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    if (users.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Heç bir istifadəçi tapılmadı.
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} elevation={2} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 750 }} aria-label="istifadəçilər cədvəli">
          <TableHead sx={{ backgroundColor: alpha(theme.palette.secondary.main, 0.1) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Avatar</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>İstifadəçi adı</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>E-poçt</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Qoşulma Tarixi</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Şərhlər</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Əməliyyatlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow 
                key={user.id} 
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                hover
              >
                <TableCell component="th" scope="row">{user.id}</TableCell>
                <TableCell>
                  <StatusAvatar 
                    src={user.avatar_url || undefined} 
                    alt={user.username} 
                    size={36}
                    isOnline={isUserOnline(user.id)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'medium' }}>
                  <Link 
                    to={`/user/${user.id}`} 
                    style={{ 
                      color: 'inherit', 
                      textDecoration: 'none',
                      fontWeight: 'inherit'
                    }}
                  >
                    {user.username}
                  </Link>
                </TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>
                  {user.is_admin ? (
                    <Chip 
                      icon={<AdminPanelSettingsIcon />} 
                      label="Admin" 
                      color="secondary" 
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Chip 
                      icon={<PersonIcon />} 
                      label="İstifadəçi" 
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="İstifadəçi şərhlərini göstər">
                    <IconButton 
                      onClick={() => handleOpenCommentsModal(user)}
                      color="primary"
                      size="small"
                    >
                      <Badge 
                        badgeContent={user.comment_count || 0} 
                        color="primary"
                        max={99}
                      >
                        <ChatBubbleOutlineIcon />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="İstifadəçini redaktə et">
                      <IconButton 
                        onClick={() => handleEditUser(user)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={user.is_admin ? "Admin statusunu ləğv et" : "Admin təyin et"}>
                      <IconButton 
                        onClick={() => handleAdminStatusChange(user.id, user.is_admin)}
                        color={user.is_admin ? "default" : "secondary"}
                        size="small"
                        disabled={updatingUserId === user.id || user.id === currentUserId}
                      >
                        {updatingUserId === user.id ? (
                          <CircularProgress size={20} />
                        ) : user.is_admin ? (
                          <RemoveModeratorIcon fontSize="small" />
                        ) : (
                          <AdminPanelSettingsIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="İstifadəçini sil">
                      <IconButton 
                        onClick={() => handleDeleteUser(user)}
                        color="error"
                        size="small"
                        disabled={user.id === currentUserId}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // -- Ana Render --
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Köhnə başlıq silindi */}
      {/* <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}> */}
      {/*  İstifadəçi İdarəetmə */}
      {/* </Typography> */}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {renderContent()}

      <EditUserDialog 
        open={isEditDialogOpen}
        user={editingUser}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleUpdateUser}
        isSaving={isEditSaving}
      />

      <DeleteUserDialog
        open={!!deletingUser}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* User Comments Modal */}
      <UserCommentsModal 
        open={isCommentsModalOpen}
        userId={selectedUserForComments?.id ?? null}
        username={selectedUserForComments?.username ?? null}
        onClose={() => setIsCommentsModalOpen(false)} 
      />
    </Box>
  );
};

export default AdminUsersPage; 