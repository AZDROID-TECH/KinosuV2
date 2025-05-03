import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { apiClient } from '../services/apiClient';
import { showErrorToast, showSuccessToast } from '../utils/toastHelper';

// Tip tanımlamaları
export interface FriendProfile {
  id: number;
  username: string;
  avatar_url: string | null;
  created_at: string;
  friendship_id?: number;
  friendship_date?: string;
}

export interface FriendRequest {
  id: number;
  created_at: string;
  sender?: {
    id: number;
    username: string;
    avatar_url: string | null;
  } | null;
  receiver?: {
    id: number;
    username: string;
    avatar_url: string | null;
  } | null;
}

export type FriendshipStatus = 'none' | 'pending' | 'accepted' | 'rejected';

export interface FriendshipStatusResponse {
  status: FriendshipStatus;
  message: string;
  actionable: boolean;
  friendship_id?: number;
  sender_id?: number;
  receiver_id?: number;
  updated_at?: string;
}

// Context tip tanımlaması
interface FriendContextType {
  friends: FriendProfile[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  loading: boolean;
  requestsCount: number;
  
  sendFriendRequest: (userId: number) => Promise<void>;
  acceptFriendRequest: (requestId: number) => Promise<void>;
  rejectFriendRequest: (requestId: number) => Promise<void>;
  removeFriend: (friendId: number) => Promise<void>;
  checkFriendshipStatus: (userId: number) => Promise<FriendshipStatusResponse>;
  
  refreshFriends: () => Promise<void>;
  refreshIncomingRequests: () => Promise<void>;
  refreshOutgoingRequests: () => Promise<void>;
  refreshRequestsCount: () => Promise<void>;
}

// Context oluşturma
const FriendContext = createContext<FriendContextType | undefined>(undefined);

// Custom hook
export const useFriends = () => {
  const context = useContext(FriendContext);
  if (!context) {
    throw new Error('useFriends hook must be used within a FriendProvider');
  }
  return context;
};

// Provider bileşeni
interface FriendProviderProps {
  children: ReactNode;
}

export const FriendProvider = ({ children }: FriendProviderProps) => {
  const { isLoggedIn, userId } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [requestsCount, setRequestsCount] = useState<number>(0);

  // Arkadaş listesini yenile
  const refreshFriends = async () => {
    if (!isLoggedIn) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get('/friends');
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Dostlar siyahısı alınarkən xəta baş verdi:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  // Gelen istekleri yenile
  const refreshIncomingRequests = async () => {
    if (!isLoggedIn) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get('/friends/requests/incoming');
      setIncomingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Gələn istəklər alınarkən xəta baş verdi:', error);
      setIncomingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Giden istekleri yenile
  const refreshOutgoingRequests = async () => {
    if (!isLoggedIn) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get('/friends/requests/outgoing');
      setOutgoingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Göndərilən istəklər alınarkən xəta baş verdi:', error);
      setOutgoingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Bildirim sayısını yenile
  const refreshRequestsCount = async () => {
    if (!isLoggedIn) return;
    
    try {
      const response = await apiClient.get('/friends/requests/count');
      setRequestsCount(response.data.count || 0);
    } catch (error) {
      console.error('Dostluq istəkləri sayısı alınarkən xəta baş verdi:', error);
      setRequestsCount(0);
    }
  };

  // Arkadaşlık durumunu kontrol et
  const checkFriendshipStatus = async (otherUserId: number): Promise<FriendshipStatusResponse> => {
    if (!isLoggedIn || !userId) {
      return { status: 'none', message: 'Giriş edilməmişdir', actionable: false };
    }
    
    if (userId === otherUserId) {
      return { status: 'none', message: 'Öz profiliniz', actionable: false };
    }
    
    try {
      const response = await apiClient.get(`/friends/status/${otherUserId}`);
      return response.data;
    } catch (error) {
      console.error('Dostluq statusu yoxlanılarkən xəta baş verdi:', error);
      return { status: 'none', message: 'Xəta baş verdi', actionable: false };
    }
  };

  // Arkadaşlık isteği gönder
  const sendFriendRequest = async (receiverId: number) => {
    if (!isLoggedIn || !userId) {
      showErrorToast('Bu əməliyyatı icra etmək üçün daxil olmaq lazımdır');
      return;
    }
    
    try {
      const response = await apiClient.post(`/friends/request/${receiverId}`);
      
      if (response.data.status === 'pending') {
        showSuccessToast('Dostluq istəyi göndərildi');
      } else if (response.data.status === 'accepted') {
        showSuccessToast('Dostluq istəyi qəbul edildi');
        await refreshFriends();
      }
      
      await refreshOutgoingRequests();
      
    } catch (error) {
      console.error('Dostluq istəyi göndərilməsi zamanı xəta:', error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        // İstek zaten var - bu bir hata değil
        showErrorToast(error.response.data.error || 'Bu istifadəçiyə artıq dostluq istəyi göndərilmişdir');
      } else {
        showErrorToast('Dostluq istəyi göndərilə bilmədi');
      }
    }
  };

  // Arkadaşlık isteğini kabul et
  const acceptFriendRequest = async (requestId: number) => {
    if (!isLoggedIn) {
      showErrorToast('Bu əməliyyatı icra etmək üçün daxil olmaq lazımdır');
      return;
    }
    
    try {
      await apiClient.put(`/friends/accept/${requestId}`);
      showSuccessToast('Dostluq istəyi qəbul edildi');
      
      // Listeleri güncelle
      await refreshIncomingRequests();
      await refreshFriends();
      await refreshRequestsCount();
      
    } catch (error) {
      console.error('Dostluq istəyi qəbul edilməsi zamanı xəta:', error);
      showErrorToast('Dostluq istəyi qəbul edilə bilmədi');
    }
  };

  // Arkadaşlık isteğini reddet
  const rejectFriendRequest = async (requestId: number) => {
    if (!isLoggedIn) {
      showErrorToast('Bu əməliyyatı icra etmək üçün daxil olmaq lazımdır');
      return;
    }
    
    try {
      await apiClient.put(`/friends/reject/${requestId}`);
      showSuccessToast('Dostluq istəyi rədd edildi');
      
      // Listeleri güncelle
      await refreshIncomingRequests();
      await refreshRequestsCount();
      
    } catch (error) {
      console.error('Dostluq istəyi rədd edilməsi zamanı xəta:', error);
      showErrorToast('Dostluq istəyi rədd edilə bilmədi');
    }
  };

  // Arkadaşlıktan çıkar
  const removeFriend = async (friendId: number) => {
    if (!isLoggedIn) {
      showErrorToast('Bu əməliyyatı icra etmək üçün daxil olmaq lazımdır');
      return;
    }
    
    try {
      await apiClient.delete(`/friends/${friendId}`);
      showSuccessToast('Dostluq əlaqəsi silindi');
      
      // Listeyi güncelle
      await refreshFriends();
      
    } catch (error) {
      console.error('Dostluq əlaqəsi silinməsi zamanı xəta:', error);
      showErrorToast('Dostluq əlaqəsi silinə bilmədi');
    }
  };

  // Kullanıcı oturum açtığında verileri yükle
  useEffect(() => {
    if (isLoggedIn) {
      refreshRequestsCount();
    } else {
      // Kullanıcı çıkış yaptığında state'i temizle
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setRequestsCount(0);
    }
  }, [isLoggedIn]);

  // Context değerlerini hazırla
  const value = {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    requestsCount,
    
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    checkFriendshipStatus,
    
    refreshFriends,
    refreshIncomingRequests,
    refreshOutgoingRequests,
    refreshRequestsCount
  };

  return (
    <FriendContext.Provider value={value}>
      {children}
    </FriendContext.Provider>
  );
}; 