import { apiClient } from './apiClient';

export interface Newsletter {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  is_important: boolean;
  is_viewed?: boolean;
  view_count?: number;
  author?: {
    id?: number;
    username: string;
    email?: string;
    avatar_url?: string;
    full_name?: string;
    role?: string;
    created_at?: string;
  };
}

export interface NewsletterListResponse {
  success: boolean;
  data: Newsletter[];
}

export interface NewsletterResponse {
  success: boolean;
  data: Newsletter;
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

// Bütün newsletter listesini getir (sayfalı)
export const getNewsletters = async (page = 1, limit = 10) => {
  const response = await apiClient.get<NewsletterListResponse>(`/newsletters?page=${page}&limit=${limit}`);
  return response.data;
};

// Son eklenen yenilikleri getir (header popup için)
export const getLatestNewsletters = async (limit = 5): Promise<NewsletterListResponse> => {
  try {
    // Önbelleği bypass etmek için timestamp ekleyelim
    const timestamp = new Date().getTime();
    const response = await apiClient.get(`/newsletters/latest?limit=${limit}&_t=${timestamp}`);
    return response.data;
  } catch (error) {
    console.error('Newsletters fetch error:', error);
    return {
      success: false,
      data: []
    };
  }
};

// Bir newsletter'ın detaylarını getir
export const getNewsletterById = async (id: number | string) => {
  const response = await apiClient.get<NewsletterResponse>(`/newsletters/${id}`);
  return response.data;
};

// Yeniliği görüntülenmiş olarak işaretle
export const markNewsletterAsViewed = async (id: number): Promise<void> => {
  try {
    await apiClient.post(`/newsletters/${id}/mark-viewed`);
  } catch (error) {
    console.error('Mark as viewed error:', error);
    throw error;
  }
};

// Okunmamış yenilik sayısını getir
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  try {
    // Önbelleği bypass etmek için timestamp ekleyelim
    const timestamp = new Date().getTime();
    const response = await apiClient.get(`/newsletters/unread-count?_t=${timestamp}`);
    return response.data;
  } catch (error) {
    console.error('Unread count fetch error:', error);
    return {
      success: false,
      count: 0
    };
  }
};

// --- Admin işlemleri --- //

// Admin: Tüm newsletter'ları getir (yayınlanmamış olanlar dahil)
export const getAdminNewsletters = async (page = 1, limit = 10) => {
  const response = await apiClient.get<NewsletterListResponse>(`/newsletters/admin/all?page=${page}&limit=${limit}`);
  return response.data;
};

// Admin: Yeni newsletter oluştur
export const createNewsletter = async (newsletterData: {
  title: string;
  content: string;
  is_important?: boolean;
  is_published?: boolean;
}) => {
  const response = await apiClient.post<NewsletterResponse>('/newsletters/admin/create', newsletterData);
  return response.data;
};

// Admin: Newsletter güncelle
export const updateNewsletter = async (
  id: number | string,
  newsletterData: {
    title?: string;
    content?: string;
    is_important?: boolean;
    is_published?: boolean;
  }
) => {
  const response = await apiClient.put<NewsletterResponse>(`/newsletters/admin/${id}`, newsletterData);
  return response.data;
};

// Admin: Newsletter sil
export const deleteNewsletter = async (id: number | string) => {
  const response = await apiClient.delete(`/newsletters/admin/${id}`);
  return response.data;
}; 