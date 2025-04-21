import React from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    CircularProgress,
    useTheme
} from '@mui/material';

interface ConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode; // Mesaj string veya JSX olabilir
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    confirmButtonColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Təsdiq et",
    cancelText = "Ləğv et",
    isLoading = false,
    confirmButtonColor = 'primary' // Varsayılan renk primary
}) => {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            onClose={isLoading ? undefined : onClose} // Yüklenirken kapatmayı engelle
            aria-labelledby="confirmation-dialog-title"
            aria-describedby="confirmation-dialog-description"
        >
            <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
            <DialogContent>
                <DialogContentText id="confirmation-dialog-description">
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ padding: theme.spacing(2, 3) }}>
                <Button onClick={onClose} disabled={isLoading} color="inherit">
                    {cancelText}
                </Button>
                <Button 
                    onClick={onConfirm} 
                    color={confirmButtonColor} 
                    variant="contained" // Təsdiq düyməsini daha belirgin yapalım
                    disabled={isLoading}
                    sx={{ minWidth: 90 }} // Buton genişliğini sabitleyelim
                >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationDialog; 