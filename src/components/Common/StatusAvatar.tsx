import React from 'react';
import { Avatar, Badge, styled } from '@mui/material';

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
  src?: string;
  alt?: string;
  isOnline?: boolean;
  size?: number;
  className?: string;
  sx?: React.CSSProperties | any;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const StatusAvatar: React.FC<StatusAvatarProps> = ({
  src,
  alt = 'İstifadəçi avatarı',
  isOnline = false,
  size = 40,
  className,
  sx,
  onClick,
}) => {
  const BadgeComponent = isOnline ? StyledBadge : OfflineBadge;

  return (
    <BadgeComponent
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant="dot"
    >
      <Avatar 
        src={src} 
        alt={alt} 
        sx={{ width: size, height: size, ...sx }} 
        className={className}
        onClick={onClick}
      />
    </BadgeComponent>
  );
};

export default StatusAvatar; 