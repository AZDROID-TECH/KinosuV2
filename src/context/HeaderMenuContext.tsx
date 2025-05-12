import React, { createContext, useState, useContext, ReactNode } from 'react';

// Menü açılma konumu için tip tanımı
export type MenuOrigin = 'top' | 'bottom';

interface HeaderMenuContextType {
  profileAnchorEl: HTMLElement | null;
  openProfileMenu: (event: React.MouseEvent<HTMLElement>, origin?: MenuOrigin) => void;
  closeProfileMenu: () => void;
  isProfileMenuOpen: boolean;
  menuOrigin: MenuOrigin;
}

const HeaderMenuContext = createContext<HeaderMenuContextType | undefined>(undefined);

interface HeaderMenuProviderProps {
  children: ReactNode;
}

export const HeaderMenuProvider: React.FC<HeaderMenuProviderProps> = ({ children }) => {
  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLElement | null>(null);
  const [menuOrigin, setMenuOrigin] = useState<MenuOrigin>('top');

  const openProfileMenu = (event: React.MouseEvent<HTMLElement>, origin: MenuOrigin = 'top') => {
    setProfileAnchorEl(event.currentTarget);
    setMenuOrigin(origin);
  };

  const closeProfileMenu = () => {
    setProfileAnchorEl(null);
  };

  const isProfileMenuOpen = Boolean(profileAnchorEl);

  const value = {
    profileAnchorEl,
    openProfileMenu,
    closeProfileMenu,
    isProfileMenuOpen,
    menuOrigin
  };

  return (
    <HeaderMenuContext.Provider value={value}>
      {children}
    </HeaderMenuContext.Provider>
  );
};

export const useHeaderMenu = (): HeaderMenuContextType => {
  const context = useContext(HeaderMenuContext);
  if (context === undefined) {
    throw new Error('useHeaderMenu must be used within a HeaderMenuProvider');
  }
  return context;
};
