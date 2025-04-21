import { apiClient } from './apiClient'; // Varsayılan axios instance

// Yorum verisi tipi (API'den beklenen)
// Bu tip, backend'den gelen yanıta göre güncellenmeli
export interface Comment {
    id: number;
    created_at: string;
    user_id: number;
    movie_imdb_id: string;
    movieTitle?: string; // Film başlığı (OMDb'den eklendi)
    parent_comment_id: number | null;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    likes: number;
    dislikes: number;
    // Kullanıcı bilgilerini de içermeli (Backend join ile sağlamalı)
    author?: {
        username?: string;
        avatar_url?: string;
        // Gerekirse diğer profil bilgileri
    };
    // İstek yapan kullanıcının oyu (Backend sağlamalı)
    user_vote?: 'like' | 'dislike' | null;
    // Yanıtlar (Backend iç içe getirebilir veya ayrı sorgu gerekebilir)
    replies?: Comment[];
}

// Yeni yorum ekleme için veri tipi
export interface NewCommentData {
    content: string;
    movieId: string; // movie_imdb_id
    parentId?: number | null; // parent_comment_id
}

// Oy verme için veri tipi
export interface VoteData {
    voteType: 'like' | 'dislike';
}

// Servis Fonksiyonları

/**
 * @desc Belirtilen IMDb ID'sine sahip film için onaylanmış yorumları getirir.
 * @param movieId - Filmin IMDb ID'si
 */
export const getComments = async (movieId: string): Promise<Comment[]> => {
    try {
        const response = await apiClient.get<Comment[]>(`/comments`, {
            params: { movieId } // Backend'in /api/comments?movieId=... şeklinde beklemesi lazım
        });
        // Yanıtları işlemek gerekebilir (eğer backend ayrı getiriyorsa)
        return response.data || [];
    } catch (error) {
        console.error('Yorumları getirme hatası:', error);
        throw error; // Hatanın component'te yakalanması için tekrar fırlat
    }
};

/**
 * @desc Yeni bir yorum veya yanıt ekler.
 * @param commentData - Yeni yorum bilgileri (content, movieId, parentId?)
 */
export const addComment = async (commentData: NewCommentData): Promise<any> => { // Backend'in dönüş tipi belirli değilse any
    try {
        const response = await apiClient.post('/comments', commentData);
        // Backend yeni eklenen yorumu dönebilir (ID'si vb. için)
        return response.data;
    } catch (error) {
        console.error('Yorum ekleme hatası:', error);
        throw error;
    }
};

/**
 * @desc Bir yoruma oy verir (like/dislike).
 * @param commentId - Oy verilecek yorumun ID'si
 * @param voteData - Oy türü ({ voteType: 'like' | 'dislike' })
 */
export const voteComment = async (commentId: number, voteData: VoteData): Promise<any> => { // Backend'in güncel oy sayılarını dönmesi beklenir
    try {
        const response = await apiClient.post(`/comments/${commentId}/vote`, voteData);
        return response.data; // Güncel like/dislike sayıları vb.
    } catch (error) {
        console.error(`Yorum ${commentId} oylama hatası:`, error);
        throw error;
    }
};

/**
 * @desc Bir yorumu siler (Sadece Admin).
 * @param commentId - Silinecek yorumun ID'si
 */
export const deleteComment = async (commentId: number): Promise<void> => {
    try {
        await apiClient.delete(`/comments/admin/${commentId}`);
    } catch (error) {
        console.error(`Yorum ${commentId} silme hatası:`, error);
        throw error;
    }
};

/**
 * @desc Müəyyən bir istifadəçiyə aid şərhləri gətirir (Admin üçün).
 * @param userId - Şərhləri gətiriləcək istifadəçinin ID'si
 */
export const getCommentsByUserId = async (userId: number): Promise<Comment[]> => {
    const endpoint = `/comments/admin/user/${userId}`; // Yeni backend endpoint
    try {
        const response = await apiClient.get<Comment[]>(endpoint);
        // Film başlığını gətirmək üçün əlavə məntiq lazım ola bilər
        // Məsələn, hər şərh üçün OMDb API-ya müraciət etmək (performans problemi yarada bilər)
        // Və ya backend endpointini yeniləyərək film başlığını da qaytarmaq
        return response.data || [];
    } catch (error: any) {
        console.error(`İstifadəçi #${userId} şərhlərini gətirmə xətası:`, error);
        const errorMessage = error.response?.data?.message || error.message || 'İstifadəçi şərhləri gətirilərkən xəta baş verdi.';
        throw new Error(errorMessage);
    }
};

// --- Admin Fonksiyonları --- 

/**
 * @desc Onay bekleyen yorumları getirir.
 * @returns {Promise<Comment[]>} Bekleyen yorumların listesi
 */
export const getPendingComments = async (): Promise<Comment[]> => {
    const endpoint = '/comments/admin'; // Backend route tanımına göre doğru yol (/api + /comments/admin)
    try {
        const response = await apiClient.get<Comment[]>(endpoint);
        return response.data || [];
    } catch (error: any) {
        console.error('Gözləyən şərhləri gətirmə xətası:', error); // Hata mesajını burada da gösterelim
        const errorMessage = error.response?.data?.message || error.message || 'Gözləyən şərhlər gətirilərkən bilinməyən xəta.';
        // Server əlçatan deyil hatasını doğrudan fırlatabiliriz
        if (typeof error === 'string' && error.includes('Server əlçatan deyil')) {
             throw new Error('Serverə qoşularkən xəta baş verdi. Zəhmət olmasa, serverin işlədiyindən əmin olun.');
        }
        throw new Error(errorMessage);
    }
};

/**
 * @desc Belirtilen ID'li yorumu onaylar.
 * @param commentId - Onaylanacak yorumun ID'si
 * @returns {Promise<any>} Backend yanıtı (genellikle başarılı mesajı veya güncellenmiş yorum)
 */
export const approveComment = async (commentId: number): Promise<any> => {
    const endpoint = `/comments/admin/${commentId}/approve`; // Doğru yol: /api/comments/admin/:id/approve
    try {
        // Genellikle PATCH veya PUT kullanılır, API tasarımına göre değişir.
        // Backend router.patch kullandığı için burada da patch kullanıyoruz.
        const response = await apiClient.patch(endpoint); 
        return response.data;
    } catch (error: any) {
        console.error(`Şərh #${commentId} təsdiq etmə xətası:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Şərh #${commentId} təsdiq edilərkən bilinməyən xəta.`;
        throw new Error(errorMessage);
    }
};

/**
 * @desc Belirtilen ID'li yorumu reddeder.
 * @param commentId - Reddedilecek yorumun ID'si
 * @returns {Promise<any>} Backend yanıtı (genellikle başarılı mesajı)
 */
export const rejectComment = async (commentId: number): Promise<any> => {
    const endpoint = `/comments/admin/${commentId}/reject`; // Doğru yol: /api/comments/admin/:id/reject
    try {
        // Backend router.patch kullandığı için burada da patch kullanıyoruz.
        const response = await apiClient.patch(endpoint); 
        return response.data;
    } catch (error: any) {
        console.error(`Şərh #${commentId} rədd etmə xətası:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Şərh #${commentId} rədd edilərkən bilinməyən xəta.`;
        throw new Error(errorMessage);
    }
}; 