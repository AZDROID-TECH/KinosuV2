import React from 'react';
import { Avatar, Badge, styled } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

// Durum indikatörü için badge stili
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

// Çevrimdışı durum için badge stili
const OfflineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#ff5252',
    color: '#ff5252',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  },
}));

interface StatusAvatarProps {
  isOnline: boolean;
  avatarUrl?: string | null;
  username: string;
  sx?: SxProps<Theme>;
}

const StatusAvatar: React.FC<StatusAvatarProps> = ({ isOnline, avatarUrl, username, sx }) => {
  const BadgeComponent = isOnline ? StyledBadge : OfflineBadge;
  return (
    <BadgeComponent
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant="dot"
    >
      <Avatar
        src={avatarUrl && avatarUrl !== '' ? avatarUrl : undefined}
        alt={username}
        sx={{
          width: 36,
          height: 36,
          bgcolor: 'primary.main',
          fontWeight: 'bold',
          fontSize: '1rem',
          ...sx,
        }}
        className="status-avatar"
      >
        {username?.[0]?.toUpperCase()}
      </Avatar>
    </BadgeComponent>
  );
};

export default StatusAvatar; 