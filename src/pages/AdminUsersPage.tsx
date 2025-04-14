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
  Stack
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RemoveModeratorIcon from '@mui/icons-material/RemoveModerator';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { formatDate } from '../utils/movieHelpers';

interface UserForAdmin {
  id: number;
  username: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  is_admin: boolean;
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
  const { username: currentAdminUsername } = useAuth(); 
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
  
  // Bildiriş mesajı
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        İstifadəçi İdarəetmə
      </Typography>
      
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

      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : alpha(theme.palette.background.paper, 0.7), backdropFilter: 'blur(10px)' }}>
        <TableContainer>
          <Table stickyHeader aria-label="istifadəçi cədvəli">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: alpha(theme.palette.secondary.main, 0.1) } }}>
                <TableCell>İstifadəçi</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Qoşulma Tarixi</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Əməliyyatlar</TableCell> 
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <CircularProgress color="secondary" />
                    <Typography sx={{ mt: 1 }}>İstifadəçilər yüklənir...</Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 && !error ? (
                 <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                     <Typography color="text.secondary">Heç bir istifadəçi tapılmadı.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow 
                    hover 
                    key={user.id}
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      // Özünü vurğula, hətta hover olsa belə
                      ...(user.username === currentAdminUsername && {
                        bgcolor: alpha(theme.palette.info.main, 0.05),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                        }
                      })
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                          src={user.avatar_url || undefined}
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: theme.palette.secondary.main, 
                            border: `2px solid ${theme.palette.background.paper}` 
                          }}
                        >
                          {!user.avatar_url && <PersonIcon />}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">{user.username}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        icon={user.is_admin ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                        label={user.is_admin ? 'Admin' : 'İstifadəçi'}
                        color={user.is_admin ? 'secondary' : 'default'}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        {/* Admin yetkisi */}
                        <Tooltip title={user.is_admin ? 'Admin Yetkisini Al' : 'Admin Yetkisi Ver'}>
                          <span>
                            <IconButton
                              color={user.is_admin ? 'error' : 'secondary'}
                              onClick={() => handleAdminStatusChange(user.id, user.is_admin)}
                              disabled={loading || updatingUserId === user.id || user.username === currentAdminUsername}
                              size="small"
                            >
                              {updatingUserId === user.id ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : user.is_admin ? (
                                <RemoveModeratorIcon />
                              ) : (
                                <AdminPanelSettingsIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        {/* Düzənlə butonu */}
                        <Tooltip title="Düzənlə">
                          <span>
                            <IconButton
                              color="primary"
                              onClick={() => handleEditUser(user)}
                              disabled={loading || user.username === currentAdminUsername}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        {/* Sil butonu */}
                        <Tooltip title="Sil">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteUser(user)}
                              disabled={loading || user.username === currentAdminUsername}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Düzənləmə dialoquʻ */}
      <EditUserDialog 
        open={isEditDialogOpen && editingUser !== null}
        user={editingUser}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingUser(null);
        }}
        onSave={handleUpdateUser}
        isSaving={isEditSaving}
      />

      {/* Silmə dialoquʻ */}
      <DeleteUserDialog
        open={deletingUser !== null}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </Box>
  );
};

export default AdminUsersPage; 