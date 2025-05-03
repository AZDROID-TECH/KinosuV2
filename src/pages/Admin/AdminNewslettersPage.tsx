import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Pagination,
  useTheme,
  alpha,
  Tooltip,
  Alert,
  Skeleton
} from '@mui/material';
import { 
  getAdminNewsletters, 
  createNewsletter, 
  updateNewsletter, 
  deleteNewsletter, 
  Newsletter 
} from '../../services/newsletterService';
import { format } from 'date-fns';
import { showSuccessToast, showErrorToast } from '../../utils/toastHelper';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Rich text editor toolbar options
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'image'
];

// Özel Quill editör stilleri
const getQuillStyles = (theme: any) => ({
  '.ql-toolbar': {
    borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.3) : theme.palette.divider,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : theme.palette.grey[50],
    '& .ql-stroke': {
      stroke: theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[700]
    },
    '& .ql-fill': {
      fill: theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[700]
    },
    '& .ql-picker': {
      color: theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[800]
    },
    '& .ql-picker-options': {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`
    }
  },
  '.ql-container': {
    borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.3) : theme.palette.divider,
    borderBottomLeftRadius: theme.shape.borderRadius,
    borderBottomRightRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.2) : theme.palette.common.white,
  },
  '.ql-editor': {
    color: theme.palette.text.primary,
    '&.ql-blank::before': {
      color: theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[400],
      fontStyle: 'normal'
    }
  }
});

const AdminNewslettersPage = () => {
  const theme = useTheme();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dialog states
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  
  // Form states
  const [currentNewsletter, setCurrentNewsletter] = useState<Newsletter | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_important: false,
    is_published: true
  });
  
  // Loading states
  const [submitting, setSubmitting] = useState(false);
  
  const fetchNewsletters = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAdminNewsletters(pageNum);
      
      if (response.success) {
        setNewsletters(response.data);
        setTotalPages(response.totalPages || 1);
      } else {
        setError('Məlumatlar gətirilə bilmədi');
      }
    } catch (error) {
      setError('Xəta baş verdi, yenidən cəhd edin');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchNewsletters(page);
  }, [fetchNewsletters, page]);
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Dialog handlers
  const handleCreateOpen = () => {
    setFormData({
      title: '',
      content: '',
      is_important: false,
      is_published: true
    });
    setOpenCreate(true);
  };
  
  const handleCreateClose = () => {
    setOpenCreate(false);
  };
  
  const handleEditOpen = (newsletter: Newsletter) => {
    setCurrentNewsletter(newsletter);
    setFormData({
      title: newsletter.title,
      content: newsletter.content,
      is_important: newsletter.is_important,
      is_published: newsletter.is_published
    });
    setOpenEdit(true);
  };
  
  const handleEditClose = () => {
    setOpenEdit(false);
  };
  
  const handleDeleteOpen = (newsletter: Newsletter) => {
    setCurrentNewsletter(newsletter);
    setOpenDelete(true);
  };
  
  const handleDeleteClose = () => {
    setOpenDelete(false);
  };
  
  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    
    if (name === 'is_important' || name === 'is_published') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };
  
  // API handlers
  const handleCreateSubmit = async () => {
    if (!formData.title || !formData.content) {
      showErrorToast('Başlıq və məzmun tələb olunur');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await createNewsletter(formData);
      
      if (response.success) {
        showSuccessToast('Yenilik uğurla yaradıldı');
        fetchNewsletters(page);
        handleCreateClose();
      } else {
        showErrorToast('Yenilik yaradılarkən xəta baş verdi');
      }
    } catch (error) {
      showErrorToast('Yenilik yaradılarkən xəta baş verdi');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEditSubmit = async () => {
    if (!currentNewsletter) return;
    if (!formData.title || !formData.content) {
      showErrorToast('Başlıq və məzmun tələb olunur');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await updateNewsletter(currentNewsletter.id, formData);
      
      if (response.success) {
        showSuccessToast('Yenilik uğurla yeniləndi');
        fetchNewsletters(page);
        handleEditClose();
      } else {
        showErrorToast('Yenilik yenilərkən xəta baş verdi');
      }
    } catch (error) {
      showErrorToast('Yenilik yenilərkən xəta baş verdi');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteSubmit = async () => {
    if (!currentNewsletter) return;
    
    setSubmitting(true);
    
    try {
      const response = await deleteNewsletter(currentNewsletter.id);
      
      if (response.success) {
        showSuccessToast('Yenilik uğurla silindi');
        
        // Son sayfadaki son öğeyi silerken bir önceki sayfaya dön
        if (newsletters.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchNewsletters(page);
        }
        
        handleDeleteClose();
      } else {
        showErrorToast('Yenilik silinərkən xəta baş verdi');
      }
    } catch (error) {
      showErrorToast('Yenilik silinərkən xəta baş verdi');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render functions
  const renderTableSkeleton = () => (
    <TableBody>
      {[1, 2, 3, 4, 5].map((item) => (
        <TableRow key={item}>
          <TableCell><Skeleton variant="text" /></TableCell>
          <TableCell><Skeleton variant="text" /></TableCell>
          <TableCell><Skeleton variant="text" /></TableCell>
          <TableCell><Skeleton variant="text" /></TableCell>
          <TableCell><Skeleton variant="text" width={120} /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          Yeniliklər İdarəsi
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateOpen}
          startIcon={<i className='bx bx-plus'></i>}
        >
          Yeni Əlavə Et
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Başlıq</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tarix</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Müəllif</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Əməliyyatlar</TableCell>
              </TableRow>
            </TableHead>
            
            {loading ? (
              renderTableSkeleton()
            ) : (
              <TableBody>
                {newsletters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Yenilik tapılmadı
                    </TableCell>
                  </TableRow>
                ) : (
                  newsletters.map((newsletter) => (
                    <TableRow key={newsletter.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {newsletter.is_important && (
                            <Chip 
                              label="Vacib" 
                              size="small" 
                              color="error" 
                              sx={{ height: 24 }} 
                            />
                          )}
                          <Typography 
                            sx={{ 
                              fontWeight: newsletter.is_important ? 600 : 400,
                              color: newsletter.is_important ? theme.palette.error.main : 'inherit'
                            }}
                          >
                            {newsletter.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(newsletter.created_at), 'dd.MM.yyyy, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={newsletter.is_published ? 'Yayında' : 'Gizli'} 
                          size="small" 
                          color={newsletter.is_published ? 'success' : 'default'} 
                          sx={{ height: 24 }} 
                        />
                      </TableCell>
                      <TableCell>
                        {newsletter.author?.username || 'Admin'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Düzənlə">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditOpen(newsletter)}
                            >
                              <i className='bx bx-edit-alt'></i>
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteOpen(newsletter)}
                            >
                              <i className='bx bx-trash-alt'></i>
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </TableContainer>
        
        {totalPages > 1 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        )}
      </Paper>
      
      {/* Create Dialog */}
      <Dialog 
        open={openCreate} 
        onClose={handleCreateClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10]
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.primary.dark, 0.1) 
            : alpha(theme.palette.primary.light, 0.1)
        }}>
          <Typography variant="h6" fontWeight={600}>
            Yeni Yenilik Əlavə Et
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            id="title"
            name="title"
            label="Başlıq"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={handleInputChange}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
            Məzmun
          </Typography>
          <Box sx={{ 
            ...getQuillStyles(theme),
            mb: 7
          }}>
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={handleContentChange}
              modules={quillModules}
              formats={quillFormats}
              style={{ 
                height: '300px',
                borderRadius: theme.shape.borderRadius
              }}
            />
          </Box>
          
          <Box sx={{ 
            mt: 4, 
            display: 'flex', 
            flexDirection: 'row', 
            gap: 3,
            justifyContent: 'space-between',
            p: 1,
            borderRadius: 1,
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.4) 
              : alpha(theme.palette.grey[100], 0.7)
          }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_important}
                  onChange={handleInputChange}
                  name="is_important"
                  color="error"
                />
              }
              label="Vacib Yenilik"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_published}
                  onChange={handleInputChange}
                  name="is_published"
                  color="primary"
                />
              }
              label="Dərhal Yayımla"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.4) 
            : alpha(theme.palette.grey[50], 0.7)
        }}>
          <Button 
            onClick={handleCreateClose} 
            disabled={submitting}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 1 }}
          >
            Ləğv Et
          </Button>
          <Button 
            onClick={handleCreateSubmit} 
            variant="contained" 
            color="primary"
            disabled={submitting || !formData.title || !formData.content}
            sx={{ 
              minWidth: 100,
              borderRadius: 1,
              boxShadow: theme.shadows[2]
            }}
          >
            {submitting ? 'Yaradılır...' : 'Yarat'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog 
        open={openEdit} 
        onClose={handleEditClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10]
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.primary.dark, 0.1) 
            : alpha(theme.palette.primary.light, 0.1)
        }}>
          <Typography variant="h6" fontWeight={600}>
            Yeniliyi Düzənlə
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            id="title"
            name="title"
            label="Başlıq"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={handleInputChange}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
            Məzmun
          </Typography>
          <Box sx={{ 
            ...getQuillStyles(theme),
            mb: 7
          }}>
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={handleContentChange}
              modules={quillModules}
              formats={quillFormats}
              style={{ 
                height: '300px',
                borderRadius: theme.shape.borderRadius
              }}
            />
          </Box>
          
          <Box sx={{ 
            mt: 4, 
            display: 'flex', 
            flexDirection: 'row', 
            gap: 3,
            justifyContent: 'space-between',
            p: 1,
            borderRadius: 1,
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.4) 
              : alpha(theme.palette.grey[100], 0.7)
          }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_important}
                  onChange={handleInputChange}
                  name="is_important"
                  color="error"
                />
              }
              label="Vacib Yenilik"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_published}
                  onChange={handleInputChange}
                  name="is_published"
                  color="primary"
                />
              }
              label="Yayımda"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.4) 
            : alpha(theme.palette.grey[50], 0.7)
        }}>
          <Button 
            onClick={handleEditClose} 
            disabled={submitting}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 1 }}
          >
            Ləğv Et
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            color="primary"
            disabled={submitting || !formData.title || !formData.content}
            sx={{ 
              minWidth: 100,
              borderRadius: 1,
              boxShadow: theme.shadows[2]
            }}
          >
            {submitting ? 'Yenilənir...' : 'Yenilə'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog
        open={openDelete}
        onClose={handleDeleteClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10]
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.error.dark, 0.1) 
            : alpha(theme.palette.error.light, 0.1)
        }}>
          <Typography variant="h6" fontWeight={600}>
            Yeniliyi Sil
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText>
            <Box component="span" fontWeight={500}>
              {currentNewsletter?.title}
            </Box> başlıqlı yeniliyi silmək istədiyinizə əminsiniz? 
            <Box component="span" sx={{ color: theme.palette.error.main }} fontWeight={500}>
              {" "}Bu əməliyyat geri qaytarıla bilməz.
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.4) 
            : alpha(theme.palette.grey[50], 0.7)
        }}>
          <Button 
            onClick={handleDeleteClose} 
            disabled={submitting}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 1 }}
          >
            Ləğv Et
          </Button>
          <Button 
            onClick={handleDeleteSubmit} 
            color="error" 
            variant="contained"
            disabled={submitting}
            sx={{ 
              minWidth: 100,
              borderRadius: 1,
              boxShadow: theme.shadows[2]
            }}
          >
            {submitting ? 'Silinir...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminNewslettersPage; 