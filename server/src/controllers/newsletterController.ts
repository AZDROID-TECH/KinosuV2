import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { TABLES, getClient } from '../utils/supabase';

// Bütün newsletterları getir (public API)
export const getNewsletters = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const start = (pageNumber - 1) * limitNumber;

    // Newsletterları alma
    const { data, error, count } = await supabase
      .from('newsletters')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(start, start + limitNumber - 1);

    if (error) throw error;

    // Yazarları ayrı sorgularla getir
    for (const newsletter of data) {
      if (newsletter.author_id) {
        // İlk olarak standart sorgu ile deneyelim
        const { data: authorData, error: authorError } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', newsletter.author_id)
          .single();
        
        if (!authorError && authorData) {
          newsletter.author = authorData;
        } else {
          // Direkt olarak getClient() ile deneyelim
          try {
            const { data: userData, error: userError } = await getClient()
              .from(TABLES.USERS)
              .select('username, avatar_url')
              .eq('id', newsletter.author_id)
              .single();
            
            if (!userError && userData) {
              newsletter.author = {
                username: userData.username || 'Admin',
                avatar_url: userData.avatar_url || null
              };
            }
          } catch (clientError) {
            console.error(`Error using client API for newsletter ${newsletter.id}:`, clientError);
          }
        }
      }
    }

    // Görüntüleme sayılarını ekle
    const { data: viewsData, error: viewsError } = await supabase
      .from('newsletter_views')
      .select('newsletter_id, viewers');
    
    if (!viewsError && viewsData) {
      data.forEach(newsletter => {
        const viewRecord = viewsData.find(v => v.newsletter_id === newsletter.id);
        newsletter.view_count = viewRecord && viewRecord.viewers ? viewRecord.viewers.length : 0;
      });
    }

    return res.status(200).json({
      success: true,
      data,
      totalCount: count,
      currentPage: pageNumber,
      totalPages: Math.ceil((count || 0) / limitNumber)
    });
  } catch (error) {
    console.error('Newsletter fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yenilikləri gətirərkən xəta baş verdi'
    });
  }
};

// Son eklenen ve okunmamış newsletterları getir (header popup için)
export const getLatestNewsletters = async (req: Request, res: Response) => {
  try {
    const { limit = 5 } = req.query;
    const limitNumber = parseInt(limit as string);
    
    const userId = req.user?.userId;
    
    // Tüm yayınlanmış newsletterları getir
    const { data: newsletters, error } = await supabase
      .from('newsletters')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limitNumber);
    
    if (error) {
      console.error('Newsletter fetch error:', error);
      throw error;
    }
    
    // Yazarları ayrı sorgularla getir
    for (const newsletter of newsletters) {
      if (newsletter.author_id) {
        // İlk olarak standart sorgu ile deneyelim
        const { data: authorData, error: authorError } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', newsletter.author_id)
          .single();
        
        if (!authorError && authorData) {
          newsletter.author = authorData;
        } else {
          // Direkt olarak getClient() ile deneyelim
          try {
            const { data: userData, error: userError } = await getClient()
              .from(TABLES.USERS)
              .select('username, avatar_url')
              .eq('id', newsletter.author_id)
              .single();
            
            if (!userError && userData) {
              newsletter.author = {
                username: userData.username || 'Admin',
                avatar_url: userData.avatar_url || null
              };
            }
          } catch (clientError) {
            console.error(`Error using client API for newsletter ${newsletter.id}:`, clientError);
          }
        }
      }
    }
    
    // Kullanıcı giriş yapmışsa, görüntüleme durumunu kontrol et
    if (userId) {
      // Tüm newsletter_views kayıtlarını çek
      const { data: viewsData, error: viewsError } = await supabase
        .from('newsletter_views')
        .select('newsletter_id, viewers');
      
      if (viewsError) {
        console.error('Views fetch error:', viewsError);
        throw viewsError;
      }
      
      // ID'yi numara olarak kesinleştirelim
      const userIdNumber = Number(userId);
      
      // Görüntüleme durumunu ekle
      newsletters.forEach(newsletter => {
        const viewRecord = viewsData?.find(v => v.newsletter_id === newsletter.id);
        
        // Eğer bir görüntüleme kaydı varsa viewers array'ini kontrol et
        let isViewed = false;
        if (viewRecord && viewRecord.viewers) {
          // Her iki tarafı da Number'a çevirerek karşılaştır
          isViewed = viewRecord.viewers.some(viewerId => Number(viewerId) === userIdNumber);
        }
        
        newsletter.is_viewed = isViewed;
        newsletter.view_count = viewRecord && viewRecord.viewers ? viewRecord.viewers.length : 0;
      });
      
      // Sadece görüntülenmemiş olanları döndür
      const unreadNewsletters = newsletters.filter(newsletter => !newsletter.is_viewed);
      
      return res.status(200).json({
        success: true,
        data: unreadNewsletters
      });
    } else {
      // Kullanıcı giriş yapmamışsa, hiçbir newsletter dönme (güvenlik için)
      return res.status(200).json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Latest newsletter fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Son yenilikləri gətirərkən xəta baş verdi'
    });
  }
};

// Tekil newsletter detayı getir
export const getNewsletterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Yeniliği alma
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Yenilik tapılmadı'
        });
      }
      throw error;
    }

    // Yazarı ayrı bir sorgu ile getir
    if (data.author_id) {
      // users tablosundan yazar bilgilerini al
      const { data: authorData, error: authorError } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', data.author_id)
        .single();
      
      if (!authorError && authorData) {
        data.author = authorData;
      } else {
        // Direkt olarak veritabanına erişim ile deneyelim
        try {
          const { data: userData, error: userError } = await getClient()
            .from(TABLES.USERS)
            .select('username, avatar_url')
            .eq('id', data.author_id)
            .single();
          
          if (!userError && userData) {
            data.author = {
              username: userData.username || 'Admin',
              avatar_url: userData.avatar_url || null
            };
          }
        } catch (clientError) {
          console.error('Error using client API:', clientError);
        }
      }
    }

    // Görüntüleme sayısını ekle
    const { data: viewData, error: viewError } = await supabase
      .from('newsletter_views')
      .select('viewers')
      .eq('newsletter_id', data.id)
      .single();
      
    if (!viewError) {
      data.view_count = viewData.viewers ? viewData.viewers.length : 0;
    } else {
      data.view_count = 0;
    }

    // Kullanıcı giriş yapmışsa görüntüleme kaydı oluşturalım
    const userId = req.user?.userId;
    if (userId) {
      // Önce bu newsletter için kayıt var mı kontrol et
      const { data: existingView, error: checkError } = await supabase
        .from('newsletter_views')
        .select('viewers')
        .eq('newsletter_id', data.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Newsletter view check error:', checkError);
      }
      
      if (!existingView) {
        // Kayıt yoksa yeni oluştur
        const { error: insertError } = await supabase
          .from('newsletter_views')
          .insert({
            newsletter_id: data.id,
            user_id: userId,
            viewers: [userId]
          });
        
        if (insertError) {
          console.error('Error inserting newsletter view:', insertError);
        } else {
          // Yeni kayıt oluşturulduğundan görüntüleme sayısını 1 olarak ayarla
          data.view_count = 1;
        }
      } else {
        // Kayıt varsa, viewers listesine kullanıcı ekle (eğer yoksa)
        let viewers = existingView.viewers || [];
        
        // Kullanıcı zaten listede yoksa ekle
        if (!viewers.includes(userId)) {
          viewers.push(userId);
          
          const { error: updateError } = await supabase
            .from('newsletter_views')
            .update({ viewers })
            .eq('newsletter_id', data.id);
          
          if (updateError) {
            console.error('Error updating newsletter viewers:', updateError);
          } else {
            // Viewer sayısını güncelle
            data.view_count = viewers.length;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Newsletter detail fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yenilik detallarını gətirərkən xəta baş verdi'
    });
  }
};

// Newsletter görüntüleme olarak işaretle
export const markNewsletterAsViewed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Giriş etməlisiniz'
      });
    }
    
    // Önce bu newsletter için kayıt var mı kontrol et
    const { data: existingView, error: checkError } = await supabase
      .from('newsletter_views')
      .select('viewers')
      .eq('newsletter_id', parseInt(id))
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 "no rows found" hatası, bu beklenen bir durum olabilir
      throw checkError;
    }
    
    if (!existingView) {
      // Kayıt yoksa yeni oluştur
      const { error: insertError } = await supabase
        .from('newsletter_views')
        .insert({
          newsletter_id: parseInt(id),
          user_id: userId,
          viewers: [userId]
        });
      
      if (insertError) throw insertError;
    } else {
      // Kayıt varsa, viewers listesine kullanıcı ekle (eğer yoksa)
      let viewers = existingView.viewers || [];
      
      // Kullanıcı zaten listede yoksa ekle
      if (!viewers.includes(userId)) {
        viewers.push(userId);
        
        const { error: updateError } = await supabase
          .from('newsletter_views')
          .update({ viewers })
          .eq('newsletter_id', parseInt(id));
        
        if (updateError) throw updateError;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Yenilik görüntüləndi olaraq qeyd edildi'
    });
  } catch (error) {
    console.error('Mark newsletter viewed error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yeniliyi görüntülənmiş olaraq qeyd edərkən xəta baş verdi'
    });
  }
};

// Admin: Newsletter listesini getir
export const getAdminNewsletters = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const start = (pageNumber - 1) * limitNumber;
    
    // Newsletterları alma
    const { data, error, count } = await supabase
      .from('newsletters')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, start + limitNumber - 1);
    
    if (error) throw error;
    
    // Yazarları ayrı sorgularla getir
    for (const newsletter of data) {
      if (newsletter.author_id) {
        // İlk olarak standart sorgu ile deneyelim
        const { data: authorData, error: authorError } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', newsletter.author_id)
          .single();
        
        if (!authorError && authorData) {
          newsletter.author = authorData;
        } else {
          // Direkt olarak getClient() ile deneyelim
          try {
            const { data: userData, error: userError } = await getClient()
              .from(TABLES.USERS)
              .select('username, avatar_url')
              .eq('id', newsletter.author_id)
              .single();
            
            if (!userError && userData) {
              newsletter.author = {
                username: userData.username || 'Admin',
                avatar_url: userData.avatar_url || null
              };
            }
          } catch (clientError) {
            console.error(`Admin: Error using client API for newsletter ${newsletter.id}:`, clientError);
          }
        }
      }
    }
    
    // Görüntüleme sayılarını ekle
    const { data: viewsData, error: viewsError } = await supabase
      .from('newsletter_views')
      .select('newsletter_id, viewers');
    
    if (!viewsError && viewsData) {
      data.forEach(newsletter => {
        const viewRecord = viewsData.find(v => v.newsletter_id === newsletter.id);
        newsletter.view_count = viewRecord && viewRecord.viewers ? viewRecord.viewers.length : 0;
      });
    }
    
    return res.status(200).json({
      success: true,
      data,
      totalCount: count,
      currentPage: pageNumber,
      totalPages: Math.ceil((count || 0) / limitNumber)
    });
  } catch (error) {
    console.error('Admin newsletter fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Admin yenilikləri gətirərkən xəta baş verdi'
    });
  }
};

// Admin: Newsletter oluştur
export const createNewsletter = async (req: Request, res: Response) => {
  try {
    const { title, content, is_important, is_published = true } = req.body;
    const authorId = req.user?.userId;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Başlıq və məzmun tələb olunur'
      });
    }
    
    const { data, error } = await supabase
      .from('newsletters')
      .insert({
        title,
        content,
        is_important: is_important || false,
        is_published,
        author_id: authorId
      })
      .select();
    
    if (error) throw error;
    
    return res.status(201).json({
      success: true,
      message: 'Yenilik uğurla yaradıldı',
      data: data[0]
    });
  } catch (error) {
    console.error('Create newsletter error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yenilik yaradarkən xəta baş verdi'
    });
  }
};

// Admin: Newsletter güncelle
export const updateNewsletter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, is_important, is_published } = req.body;
    
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (is_important !== undefined) updates.is_important = is_important;
    if (is_published !== undefined) updates.is_published = is_published;
    updates.updated_at = new Date();
    
    const { data, error } = await supabase
      .from('newsletters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      message: 'Yenilik uğurla yeniləndi',
      data
    });
  } catch (error) {
    console.error('Update newsletter error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yeniliyi yeniləyərkən xəta baş verdi'
    });
  }
};

// Admin: Newsletter sil
export const deleteNewsletter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('newsletters')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      message: 'Yenilik uğurla silindi'
    });
  } catch (error) {
    console.error('Delete newsletter error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yeniliyi silkərkən xəta baş verdi'
    });
  }
};

// Kullanıcı için okunmamış newsletter sayısını getir
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(200).json({ success: true, count: 0 });
    }
    
    // Tüm yayınlanmış newsletterları getir
    const { data: newsletters, error: newsletterError } = await supabase
      .from('newsletters')
      .select('id')
      .eq('is_published', true);
    
    if (newsletterError) throw newsletterError;
    
    // Tüm newsletter_views kayıtlarını getir
    const { data: viewsData, error: viewsError } = await supabase
      .from('newsletter_views')
      .select('newsletter_id, viewers');
    
    if (viewsError) throw viewsError;
    
    // Görüntülenmemiş newsletterları say
    const unreadCount = newsletters.filter(newsletter => {
      const viewRecord = viewsData?.find(v => v.newsletter_id === newsletter.id);
      const viewers = viewRecord ? viewRecord.viewers || [] : [];
      
      // Kullanıcı görüntüleyenler arasında değilse, okunmamış olarak kabul et
      return !viewers.includes(userId);
    }).length;
    
    return res.status(200).json({
      success: true,
      count: unreadCount
    });
  } catch (error) {
    console.error('Unread count error:', error);
    return res.status(500).json({
      success: false,
      message: 'Oxunmamış yenilik sayını hesablayarkən xəta baş verdi',
      count: 0
    });
  }
}; 