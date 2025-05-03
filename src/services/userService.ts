import apiClient from './apiClient';

interface OnlineStatusResponse {
  userId: number;
  username: string;
  online: boolean;
  lastSeen: string | null;
}

/**
 * Kullanıcının online durumunu ve son görülme zamanını getir
 */
export const getUserOnlineStatus = async (userId: number): Promise<OnlineStatusResponse> => {
  const { data } = await apiClient.get<OnlineStatusResponse>(`/api/user/online-status/${userId}`);
  return data;
};

/**
 * Çoklu kullanıcıların online durumunu getir
 */
export const getMultipleUsersOnlineStatus = async (userIds: number[]): Promise<Record<number, OnlineStatusResponse>> => {
  const uniqueUserIds = [...new Set(userIds)]; // Tekrarlayan ID'leri çıkar
  
  if (uniqueUserIds.length === 0) {
    return {};
  }
  
  const results: Record<number, OnlineStatusResponse> = {};
  
  // Her bir kullanıcı için ayrı istek gönder
  // Not: İleride backend'de çoklu kullanıcı sorgulama endpoint'i oluşturulabilir
  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const status = await getUserOnlineStatus(userId);
        results[userId] = status;
      } catch (error) {
        console.error(`${userId} ID'li kullanıcının durum sorgusu başarısız:`, error);
      }
    })
  );
  
  return results;
}; 